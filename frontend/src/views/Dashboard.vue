<template>
  <div v-if="isLoading" class="dashboard-loading">
    <LoadingSkeleton type="card" :rows="4" />
  </div>
  <section v-else class="dashboard-shell animate-fade-in">
    <header class="dashboard-header">
      <div>
        <h2>数据看板</h2>
      </div>
      <div class="header-meta">
        <div class="mode-switch" role="group" aria-label="数据模式">
          <button :class="['mode-btn', { active: dataMode === 'tokens' }]" @click="dataMode = 'tokens'">
            Token
          </button>
          <button :class="['mode-btn', { active: dataMode === 'cost' }]" @click="dataMode = 'cost'">
            金额
          </button>
        </div>
        <span>统计周期</span>
        <div class="range-switch" role="group" aria-label="选择统计周期">
          <button
            v-for="day in dayOptions"
            :key="day"
            type="button"
            :class="['range-btn', { active: dailyDays === day && !customRangeEnabled }]"
            @click="changeDailyRange(day)"
          >
            {{ day }} 天
          </button>
          <button
            type="button"
            :class="['range-btn', { active: customRangeEnabled }]"
            @click="toggleCustomRange"
          >
            自定义
          </button>
        </div>
        <div v-if="customRangeEnabled" class="custom-range-inputs">
          <input type="date" v-model="customStartDate" class="date-input" @change="fetchCustomRange" />
          <span class="date-separator">至</span>
          <input type="date" v-model="customEndDate" class="date-input" @change="fetchCustomRange" />
        </div>
      </div>
    </header>

    <div class="metric-grid">
      <article
        v-for="metric in dataMode === 'tokens' ? metrics : costMetrics"
        :key="metric.label"
        class="metric-card glass-panel"
        :style="{ '--metric-color': metric.color }"
      >
        <div class="metric-icon">
          <component :is="metric.icon" />
        </div>
        <div class="metric-content">
          <span class="metric-label">{{ metric.label }}</span>
          <strong class="metric-value">{{ metric.value }}</strong>
          <span class="metric-note">{{ metric.note }}</span>
        </div>
      </article>
    </div>

    <div class="dashboard-grid">
      <article class="panel panel-trend glass-panel">
        <div class="panel-header">
          <div>
            <h3>每日消耗趋势</h3>
            <p>{{ dataMode === 'tokens' ? '按自然日统计 Token 消耗与请求热度' : '按自然日统计金额消耗' }}</p>
          </div>
          <span class="panel-kpi">{{ dataMode === 'tokens' ? formatNumber(stats.todayTokens) + ' tokens 今日' : formatCost(costStats.todayCost) + ' 今日' }}</span>
        </div>
        <div class="chart-slot trend-chart">
          <BarChart :data="dataMode === 'tokens' ? dailyData : dailyCostData" :height="260" bar-color="var(--accent-blue)" />
        </div>
      </article>

      <article class="panel panel-donut glass-panel">
        <div class="panel-header compact">
          <div>
            <h3>模型占比</h3>
            <p>{{ dataMode === 'tokens' ? '按 Token 消耗拆分' : '按金额消耗拆分' }}</p>
          </div>
        </div>
        <div class="donut-layout">
          <DonutChart :data="dataMode === 'tokens' ? topModelData : topModelCostData" :size="168" :thickness="22" />
        </div>
      </article>

      <article class="panel panel-ranking glass-panel">
        <div class="panel-header compact">
          <div>
            <h3>模型排行</h3>
            <p>{{ dataMode === 'tokens' ? '消耗最高的模型' : '金额最高的模型' }}</p>
          </div>
        </div>
        <div class="ranking-list" v-if="(dataMode === 'tokens' ? modelRanking : modelCostRanking).length">
          <div v-for="item in (dataMode === 'tokens' ? modelRanking : modelCostRanking)" :key="item.model" class="ranking-row">
            <div class="ranking-main">
              <span class="rank-dot" :style="{ background: item.color }"></span>
              <span class="rank-name">{{ item.model }}</span>
            </div>
            <div class="rank-meter">
              <span :style="{ width: item.percent + '%', background: item.color }"></span>
            </div>
            <span class="rank-value">{{ dataMode === 'tokens' ? formatNumber(item.totalTokens) : formatCost(item.totalCost) }}</span>
          </div>
        </div>
        <div v-else class="empty-state">暂无模型数据</div>
      </article>

      <article class="panel panel-model-bars glass-panel">
        <div class="panel-header">
          <div>
            <h3>模型消耗分布</h3>
            <p>{{ dataMode === 'tokens' ? '用于快速对比不同模型的消耗量级' : '用于快速对比不同模型的金额量级' }}</p>
          </div>
        </div>
        <div class="chart-slot model-chart">
          <BarChart :data="dataMode === 'tokens' ? modelBarData : modelCostBarData" :height="230" bar-color="var(--accent-green)" />
        </div>
      </article>

      <article class="panel panel-recent glass-panel">
        <div class="panel-header">
          <div>
            <h3>最近请求</h3>
            <p>最新 5 条调用记录</p>
          </div>
          <router-link :to="{ path: '/console/logs', query: { days: dailyDays } }" class="view-link">
            查看全部
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </router-link>
        </div>
        <div class="recent-table-wrap">
          <table v-if="recentLogs.length" class="recent-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>模型</th>
                <th>令牌</th>
                <th class="align-right">Token</th>
                <th class="align-right">金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in recentLogs" :key="log.id">
                <td class="time-cell">{{ fmtTime(log.createdAt) }}</td>
                <td>
                  <span class="model-chip">{{ log.model }}</span>
                </td>
                <td class="muted-cell">{{ log.token?.name || '-' }}</td>
                <td class="align-right strong-cell">{{ formatNumber(log.totalTokens) }}</td>
                <td class="align-right strong-cell">
                  <span v-if="Number(log.totalCost) > 0">{{ formatCost(log.totalCost) }}</span>
                  <span v-else class="muted-cell">-</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">暂无请求记录</div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import api from '../api';
import BarChart from '../components/BarChart.vue';
import DonutChart from '../components/DonutChart.vue';
import LoadingSkeleton from '../components/LoadingSkeleton.vue';
import type { Log } from '../types';

type DailyUsage = {
  date: string;
  totalTokens: number;
  requestCount?: number;
};

type ModelUsage = {
  model: string;
  totalTokens: number;
  requestCount?: number;
};

const stats = ref({
  totalTokens: 0,
  todayTokens: 0,
  totalRequests: 0,
  todayRequests: 0,
  avgTokensPerRequest: 0,
});
const costStats = ref({ totalCost: 0, todayCost: 0 });
const dataMode = ref<'tokens' | 'cost'>('tokens');
const dailyDays = ref(7);
const dayOptions = [7, 30];
const customRangeEnabled = ref(false);
const customStartDate = ref('');
const customEndDate = ref('');
const dailyUsage = ref<DailyUsage[]>([]);
const dailyCostUsage = ref<DailyUsage[]>([]);
const modelDist = ref<ModelUsage[]>([]);
const modelCostDist = ref<ModelUsage[]>([]);
const recentLogs = ref<Log[]>([]);

const isLoading = ref(true);

const palette = [
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-orange)',
  'var(--accent-red)',
  '#8b5cf6',
  '#14b8a6',
];

const dailyData = computed(() =>
  dailyUsage.value.map((item) => ({
    label: item.date.slice(5),
    value: item.totalTokens,
  })),
);

const modelBarData = computed(() =>
  modelDist.value.map((item) => ({
    label: item.model,
    value: item.totalTokens,
  })),
);

const topModelData = computed(() =>
  modelDist.value.slice(0, 6).map((item) => ({
    label: item.model,
    value: item.totalTokens,
  })),
);

const modelRanking = computed(() => {
  const max = Math.max(...modelDist.value.map((item) => item.totalTokens), 1);
  return modelDist.value.slice(0, 6).map((item, index) => ({
    ...item,
    color: palette[index % palette.length],
    percent: Math.round((item.totalTokens / max) * 100),
  }));
});

const metrics = computed(() => [
  {
    label: '累计消耗',
    value: formatNumber(stats.value.totalTokens),
    note: '全部请求 Token 总量',
    color: 'var(--accent-blue)',
    icon: cubeIcon,
  },
  {
    label: '今日请求',
    value: formatNumber(stats.value.todayRequests),
    note: `${formatNumber(stats.value.todayTokens)} tokens 今日`,
    color: 'var(--accent-orange)',
    icon: pulseIcon,
  },
  {
    label: '累计请求',
    value: formatNumber(stats.value.totalRequests),
    note: '已记录的网关调用次数',
    color: 'var(--accent-green)',
    icon: listIcon,
  },
  {
    label: '平均长度',
    value: `${formatNumber(stats.value.avgTokensPerRequest)}`,
    note: 'tokens / request',
    color: 'var(--accent-red)',
    icon: gaugeIcon,
  },
]);

const costMetrics = computed(() => [
  {
    label: '累计金额',
    value: formatCost(costStats.value.totalCost),
    note: '全部请求总金额',
    color: 'var(--accent-blue)',
    icon: cubeIcon,
  },
  {
    label: '今日请求',
    value: formatNumber(stats.value.todayRequests),
    note: `${formatNumber(stats.value.todayTokens)} tokens 今日`,
    color: 'var(--accent-orange)',
    icon: pulseIcon,
  },
  {
    label: '今日金额',
    value: formatCost(costStats.value.todayCost),
    note: '今日累计金额消耗',
    color: 'var(--accent-green)',
    icon: listIcon,
  },
  {
    label: '平均长度',
    value: `${formatNumber(stats.value.avgTokensPerRequest)}`,
    note: 'tokens / request',
    color: 'var(--accent-red)',
    icon: gaugeIcon,
  },
]);

// Cost chart data
const dailyCostData = computed(() =>
  dailyCostUsage.value.map((item: any) => ({
    label: item.date.slice(5),
    value: Number(item.totalCost) || 0,
  })),
);

const modelCostBarData = computed(() =>
  modelCostDist.value.map((item: any) => ({
    label: item.model,
    value: Number(item.totalCost) || 0,
  })),
);

const topModelCostData = computed(() =>
  modelCostDist.value.slice(0, 6).map((item: any) => ({
    label: item.model,
    value: Number(item.totalCost) || 0,
  })),
);

const modelCostRanking = computed(() => {
  const items = modelCostDist.value.map((item: any) => ({
    ...item,
    totalCost: Number(item.totalCost) || 0,
  }));
  const max = Math.max(...items.map((item) => item.totalCost), 1);
  return items.slice(0, 6).map((item, index) => ({
    ...item,
    color: palette[index % palette.length],
    percent: Math.round((item.totalCost / max) * 100),
  }));
});

const fetchStats = async () => {
  const res = await api.get('/logs/stats');
  stats.value = res.data;
};

const fetchDailyUsage = async () => {
  const params: any = customRangeEnabled.value && customStartDate.value && customEndDate.value
    ? { startDate: customStartDate.value, endDate: customEndDate.value }
    : { days: dailyDays.value };
  const res = await api.get('/logs/stats/daily', { params });
  dailyUsage.value = res.data;
};

const fetchModelDistribution = async () => {
  const res = await api.get('/logs/stats/models');
  modelDist.value = res.data;
};

const fetchRecentLogs = async () => {
  const res = await api.get('/logs', { params: { page: 1, limit: 5 } });
  recentLogs.value = res.data.items || [];
};

const fetchCostStats = async () => {
  try {
    const res = await api.get('/logs/stats/cost');
    costStats.value = res.data;
  } catch (e: any) { console.error('Cost stats failed:', e); }
};

const fetchDailyCost = async () => {
  try {
    const params: any = customRangeEnabled.value && customStartDate.value && customEndDate.value
      ? { startDate: customStartDate.value, endDate: customEndDate.value }
      : { days: dailyDays.value };
    const res = await api.get('/logs/stats/daily-cost', { params });
    dailyCostUsage.value = res.data;
  } catch (e: any) { console.error('Daily cost failed:', e); }
};

const fetchModelCosts = async () => {
  try {
    const res = await api.get('/logs/stats/model-costs');
    modelCostDist.value = res.data;
  } catch (e: any) { console.error('Model costs failed:', e); }
};

const changeDailyRange = async (days: number) => {
  customRangeEnabled.value = false;
  if (dailyDays.value === days) return;
  dailyDays.value = days;
  await Promise.all([fetchDailyUsage(), fetchDailyCost()]);
};

const toggleCustomRange = () => {
  customRangeEnabled.value = !customRangeEnabled.value;
  if (customRangeEnabled.value) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    customStartDate.value = start.toISOString().slice(0, 10);
    customEndDate.value = end.toISOString().slice(0, 10);
    Promise.all([fetchDailyUsage(), fetchDailyCost()]);
  } else {
    Promise.all([fetchDailyUsage(), fetchDailyCost()]);
  }
};

const fetchCustomRange = () => {
  if (customRangeEnabled.value && customStartDate.value && customEndDate.value) {
    Promise.all([fetchDailyUsage(), fetchDailyCost()]);
  }
};

const fmtTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
};

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatCost(value: number | string | undefined | null) {
  const n = Number(value) || 0;
  if (n === 0) return '$0.00';
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function cubeIcon() {
  return h('svg', iconAttrs(), [
    h('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
    h('path', { d: 'M3.3 7 12 12l8.7-5' }),
    h('path', { d: 'M12 22V12' }),
  ]);
}

function pulseIcon() {
  return h('svg', iconAttrs(), [
    h('polyline', { points: '22 12 18 12 15 21 9 3 6 12 2 12' }),
  ]);
}

function listIcon() {
  return h('svg', iconAttrs(), [
    h('path', { d: 'M8 6h13' }),
    h('path', { d: 'M8 12h13' }),
    h('path', { d: 'M8 18h13' }),
    h('path', { d: 'M3 6h.01' }),
    h('path', { d: 'M3 12h.01' }),
    h('path', { d: 'M3 18h.01' }),
  ]);
}

function gaugeIcon() {
  return h('svg', iconAttrs(), [
    h('path', { d: 'M12 14l4-4' }),
    h('path', { d: 'M3.34 19a10 10 0 1 1 17.32 0' }),
  ]);
}

function iconAttrs() {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  };
}

onMounted(async () => {
  isLoading.value = true;
  try {
    await Promise.all([fetchStats(), fetchDailyUsage(), fetchModelDistribution(), fetchRecentLogs(), fetchCostStats(), fetchDailyCost(), fetchModelCosts()]);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.dashboard-loading {
  padding: 40px 0;
}

.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ---------- Header ---------- */
.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  margin-bottom: 4px;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dashboard-header h2 {
  color: var(--text-primary);
  font-size: 1.4rem;
  line-height: 1.2;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.76rem;
}

.mode-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--accent-blue);
  border-radius: 8px;
  background: var(--bg-sidebar);
}

.mode-btn {
  min-width: 52px;
  padding: 5px 10px;
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  transition: all 0.15s;
}

.mode-btn.active {
  background: var(--accent-blue);
  color: white;
}

.range-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-sidebar);
}

.range-btn {
  min-width: 52px;
  padding: 5px 10px;
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 600;
  transition: all 0.15s;
}

.range-btn.active {
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ---------- Custom date range ---------- */
.custom-range-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input {
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.74rem;
  font-family: var(--font-mono);
  outline: none;
}

.date-input:focus {
  border-color: var(--accent-blue);
}

.date-separator {
  color: var(--text-muted);
  font-size: 0.72rem;
}

/* ---------- Metric cards ---------- */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 18px;
  border-top: 2px solid var(--metric-color);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid color-mix(in srgb, var(--metric-color) 36%, transparent);
  border-radius: 8px;
  color: var(--metric-color);
  background: color-mix(in srgb, var(--metric-color) 12%, transparent);
}

.metric-content {
  min-width: 0;
}

.metric-label {
  display: block;
  color: var(--text-muted);
  font-size: 0.74rem;
}

.metric-value {
  display: block;
  margin: 4px 0 2px;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.15;
}

.metric-note {
  display: block;
  color: var(--text-muted);
  font-size: 0.72rem;
}

/* ---------- Dashboard grid ---------- */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 14px;
}

.panel {
  min-width: 0;
  padding: 20px;
}

.panel-trend {
  grid-column: span 8;
}

.panel-donut {
  grid-column: span 4;
}

.panel-ranking {
  grid-column: span 4;
}

.panel-model-bars {
  grid-column: span 8;
}

.panel-recent {
  grid-column: 1 / -1;
}

/* ---------- Panel header ---------- */
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.panel-header.compact {
  margin-bottom: 10px;
}

.panel-header h3 {
  color: var(--text-primary);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.25;
}

.panel-header p {
  margin-top: 3px;
  color: var(--text-muted);
  font-size: 0.73rem;
}

.panel-kpi {
  flex-shrink: 0;
  padding: 5px 9px;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  white-space: nowrap;
}

/* ---------- Chart slots ---------- */
.chart-slot {
  width: 100%;
  min-width: 0;
}

.trend-chart {
  aspect-ratio: 16 / 7;
}

.model-chart {
  aspect-ratio: 16 / 6.5;
}

.chart-slot :deep(.chart-wrapper) {
  width: 100%;
  height: 100%;
}

.chart-slot :deep(.bar-chart) {
  display: block;
  width: 100%;
  height: 100%;
}

/* ---------- Donut ---------- */
.donut-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
}

.donut-layout :deep(.donut-wrapper) {
  justify-content: center;
  gap: 16px;
}

/* ---------- Ranking ---------- */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}

.ranking-row {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) minmax(80px, 120px) 60px;
  gap: 10px;
  align-items: center;
}

.ranking-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.rank-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rank-name {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-meter {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--bg-input);
}

.rank-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.rank-value {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  text-align: right;
}

/* ---------- View link ---------- */
.view-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 6px;
  color: var(--accent-blue);
  font-size: 0.76rem;
  font-weight: 600;
  transition: background 0.15s;
}

.view-link:hover {
  background: color-mix(in srgb, var(--accent-blue) 10%, transparent);
}

/* ---------- Recent table ---------- */
.recent-table-wrap {
  overflow-x: auto;
}

.recent-table {
  width: 100%;
  border-collapse: collapse;
}

.recent-table th {
  padding: 9px 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.recent-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.recent-table tr:last-child td {
  border-bottom: none;
}

.recent-table tr:hover td {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.time-cell,
.strong-cell {
  font-family: var(--font-mono);
}

.muted-cell {
  color: var(--text-muted) !important;
}

.strong-cell {
  color: var(--text-primary) !important;
  font-weight: 700;
}

.align-right {
  text-align: right !important;
}

.model-chip {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  padding: 2px 8px;
  border: 1px solid color-mix(in srgb, var(--accent-blue) 25%, transparent);
  border-radius: 5px;
  color: var(--accent-blue);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

/* ---------- Empty ---------- */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: var(--text-muted);
  font-size: 0.82rem;
}

/* ---------- Responsive ---------- */
@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel-trend,
  .panel-donut,
  .panel-ranking,
  .panel-model-bars {
    grid-column: 1 / -1;
  }

  .trend-chart {
    aspect-ratio: 16 / 6;
  }

  .model-chart {
    aspect-ratio: 16 / 5.5;
  }
}

@media (max-width: 720px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 14px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-kpi {
    white-space: normal;
  }

  .ranking-row {
    grid-template-columns: minmax(0, 1fr) 54px;
  }

  .rank-meter {
    grid-column: 1 / -1;
    order: 3;
  }
}
</style>
