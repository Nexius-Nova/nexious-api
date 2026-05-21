<template>
  <div class="logs animate-fade-in">
    <div class="view-header">
      <div class="header-text">
        <h2>使用日志</h2>
        <p>网关处理的所有 API 请求的实时流。</p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportCSV">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出 CSV
        </button>
        <button class="btn-ghost" @click="fetchLogs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          刷新
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar glass-panel">
      <div class="filter-row">
        <div class="filter-group">
          <label class="filter-label">开始日期</label>
          <input v-model="startDate" type="date" class="filter-input" @change="onFilterChange" />
        </div>
        <div class="filter-group">
          <label class="filter-label">结束日期</label>
          <input v-model="endDate" type="date" class="filter-input" @change="onFilterChange" />
        </div>
        <div class="filter-group">
          <label class="filter-label">模型</label>
          <div class="combo-box" ref="modelComboRef">
            <input
              v-model="modelFilterInput"
              type="text"
              class="filter-input combo-input"
              placeholder="选择或输入模型..."
              @focus="showModelDropdown = true"
              @input="onModelInput"
              @keydown.enter="selectModelFromInput"
            />
            <Transition name="drop">
              <div v-if="showModelDropdown" class="combo-dropdown glass-panel">
                <div
                  v-for="m in filteredModelOptions"
                  :key="m"
                  class="combo-option"
                  :class="{ selected: modelFilter === m }"
                  @mousedown.prevent="selectModel(m)"
                >
                  <ModelIcon :name="m" :size="16" />
                  <span class="combo-label">{{ m }}</span>
                </div>
                <div v-if="!filteredModelOptions.length" class="combo-empty">无匹配模型，按 Enter 使用 "{{ modelFilterInput }}"</div>
              </div>
            </Transition>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">令牌</label>
          <div class="combo-box" ref="tokenComboRef">
            <input
              v-model="tokenFilterInput"
              type="text"
              class="filter-input combo-input"
              placeholder="选择令牌..."
              @focus="showTokenDropdown = true"
              @input="onTokenInput"
              @keydown.enter="selectTokenFromInput"
            />
            <Transition name="drop">
              <div v-if="showTokenDropdown" class="combo-dropdown glass-panel">
                <div
                  v-for="t in filteredTokenOptions"
                  :key="t.id ?? t.name"
                  class="combo-option"
                  :class="{ selected: tokenId === t.id }"
                  @mousedown.prevent="selectToken(t.id!, t.name)"
                >
                  <span class="combo-label">{{ t.name }}</span>
                </div>
                <div v-if="!filteredTokenOptions.length" class="combo-empty">无匹配令牌</div>
              </div>
            </Transition>
          </div>
        </div>
        <div class="filter-group flex-1">
          <label class="filter-label">关键词</label>
          <input v-model="keyword" type="text" class="filter-input" placeholder="搜索模型、IP 地址..." @input="onKeywordInput" />
        </div>
        <div class="filter-actions">
          <button v-if="hasActiveFilters" class="btn-ghost btn-clear" @click="clearFilters">
            清除筛选
          </button>
        </div>
      </div>
    </div>

    <DataTable :columns="columns" :data="logs" empty-text="暂无匹配的日志记录">
      <template #cell-createdAt="{ row }">
        <div class="time-cell">
          <div class="time-main">{{ formatTime(row.createdAt) }}</div>
          <div class="time-sub">{{ formatDate(row.createdAt) }}</div>
        </div>
      </template>
      <template #cell-token="{ row }">
        <div class="relation-cell">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cell-icon"><path d="M21 2l-2 2"></path><circle cx="7" cy="10" r="5"></circle><path d="M11 5.5l9 9"></path></svg>
          <span>{{ row.token?.name || '未知' }}</span>
        </div>
      </template>
      <template #cell-channel="{ row }">
        <div class="relation-cell">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cell-icon"><path d="M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8Z"></path></svg>
          <span>{{ row.channel?.name || '未知' }}</span>
        </div>
      </template>
      <template #cell-model="{ row }">
        <div class="model-cell">
          <ModelIcon :name="row.model" :size="18" />
          <span class="tag model-tag clickable" role="button" tabindex="0" @click="filterByModel(row.model)" @keydown.enter="filterByModel(row.model)">{{ row.model }}</span>
        </div>
      </template>
      <template #cell-totalTokens="{ row }">
        <div class="usage-stack">
          <div class="usage-total">{{ row.totalTokens }} <span class="unit">总计</span><span v-if="row.isEstimated" class="est-badge" title="上游未返回 usage，此值为估算">估算</span></div>
          <div class="usage-split">{{ row.promptTokens }} 提示 / {{ row.completionTokens }} 补全</div>
        </div>
      </template>
      <template #cell-totalCost="{ row }">
        <div class="cost-cell">
          <span v-if="Number(row.totalCost || 0) > 0" class="cost-value">{{ formatCost(row.totalCost) }}</span>
          <span v-else class="cost-na">-</span>
        </div>
      </template>
      <template #cell-ip="{ row }">
        <code class="ip-code">{{ row.ip || '0.0.0.0' }}</code>
      </template>

      <template #footer>
        <div class="pagination-footer">
          <div class="pagination-info">
            显示第 {{ (page - 1) * limit + 1 }} 到 {{ Math.min(page * limit, total) }} 条，共 {{ total }} 条日志
          </div>
          <div class="pagination-controls">
            <button class="btn-icon" :disabled="page === 1" @click="changePage(page - 1)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div class="page-numbers">
              <button
                v-for="p in visiblePages"
                :key="p"
                class="page-btn"
                :class="{ active: p === page }"
                @click="typeof p === 'number' && changePage(p)"
              >
                {{ p }}
              </button>
            </div>
            <button class="btn-icon" :disabled="page * limit >= total" @click="changePage(page + 1)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import api from '../api';
import type { Log, Channel, Token } from '../types';
import DataTable from '../components/DataTable.vue';
import type { ColumnDef } from '../components/DataTable.vue';
import ModelIcon from '../components/ModelIcon.vue';

const logs = ref<Log[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);

const columns: ColumnDef[] = [
  { key: 'createdAt', label: '时间戳' },
  { key: 'token', label: '令牌' },
  { key: 'channel', label: '渠道' },
  { key: 'model', label: '模型' },
  { key: 'totalTokens', label: '消耗' },
  { key: 'totalCost', label: '金额', align: 'right' },
  { key: 'ip', label: 'IP 地址' },
];

const startDate = ref('');
const endDate = ref('');
const modelFilter = ref('');
const modelFilterInput = ref('');
const tokenId = ref<number | null>(null);
const tokenFilterInput = ref('');
const keyword = ref('');

// Combo box state
const showModelDropdown = ref(false);
const showTokenDropdown = ref(false);
const modelComboRef = ref<HTMLElement | null>(null);
const tokenComboRef = ref<HTMLElement | null>(null);

// Data sources for dropdowns
const channels = ref<Channel[]>([]);
const tokens = ref<Token[]>([]);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Available model options from all channels
const allModelOptions = computed(() => {
  const set = new Set<string>();
  for (const ch of channels.value) {
    for (const m of ch.models.split(',').map((s) => s.trim()).filter(Boolean)) {
      set.add(m);
    }
  }
  return Array.from(set).sort();
});

const filteredModelOptions = computed(() => {
  const q = modelFilterInput.value.toLowerCase().trim();
  if (!q) return allModelOptions.value;
  return allModelOptions.value.filter((m) => m.toLowerCase().includes(q));
});

const filteredTokenOptions = computed(() => {
  const q = tokenFilterInput.value.toLowerCase().trim();
  if (!q) return tokens.value;
  return tokens.value.filter((t) => t.name.toLowerCase().includes(q));
});

// Model combo handlers
const onModelInput = () => {
  showModelDropdown.value = true;
};

const selectModel = (model: string) => {
  modelFilter.value = model;
  modelFilterInput.value = model;
  showModelDropdown.value = false;
  onFilterChange();
};

const selectModelFromInput = () => {
  modelFilter.value = modelFilterInput.value.trim();
  showModelDropdown.value = false;
  onFilterChange();
};

// Token combo handlers
const onTokenInput = () => {
  showTokenDropdown.value = true;
};

const selectToken = (id: number, name: string) => {
  tokenId.value = id;
  tokenFilterInput.value = name;
  showTokenDropdown.value = false;
  onFilterChange();
};

const selectTokenFromInput = () => {
  // token dropdown doesn't support free typing — clear if no match
  const match = filteredTokenOptions.value[0];
  if (match) {
    selectToken(match.id!, match.name);
  } else {
    tokenFilterInput.value = '';
    tokenId.value = null;
    showTokenDropdown.value = false;
  }
};

// Click outside to close dropdowns
const handleComboClickOutside = (e: MouseEvent) => {
  if (modelComboRef.value && !modelComboRef.value.contains(e.target as Node)) {
    showModelDropdown.value = false;
  }
  if (tokenComboRef.value && !tokenComboRef.value.contains(e.target as Node)) {
    showTokenDropdown.value = false;
  }
};

const hasActiveFilters = computed(() =>
  startDate.value || endDate.value || modelFilter.value || keyword.value || tokenId.value
);

const fetchLogs = async () => {
  const params: Record<string, any> = { page: page.value, limit: limit.value };
  if (startDate.value) params.startDate = startDate.value;
  if (endDate.value) params.endDate = endDate.value;
  if (modelFilter.value) params.model = modelFilter.value;
  if (keyword.value) params.keyword = keyword.value;
  if (tokenId.value) params.tokenId = tokenId.value;

  const res = await api.get('/logs', { params });
  logs.value = res.data.items;
  total.value = res.data.total;
};

const onFilterChange = () => {
  page.value = 1;
  fetchLogs();
};

const onKeywordInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchLogs();
  }, 300);
};

const clearFilters = () => {
  startDate.value = '';
  endDate.value = '';
  modelFilter.value = '';
  modelFilterInput.value = '';
  tokenId.value = null;
  tokenFilterInput.value = '';
  keyword.value = '';
  page.value = 1;
  fetchLogs();
};

const changePage = (p: number) => {
  page.value = p;
  fetchLogs();
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString();
};

function formatCost(value: number | string | undefined | null) {
  const n = Number(value) || 0;
  if (n === 0) return '$0.00';
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

const visiblePages = computed(() => {
  const totalPages = Math.ceil(total.value / limit.value);
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  if (page.value <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
  if (page.value >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];

  return [1, '...', page.value - 1, page.value, page.value + 1, '...', totalPages];
});

const fetchChannels = async () => {
  try {
    const res = await api.get('/channels');
    channels.value = res.data;
  } catch (e: any) {
    /* keep defaults - channels list empty */
  }
};

const fetchTokens = async () => {
  try {
    const res = await api.get('/tokens');
    tokens.value = res.data;
  } catch (e: any) {
    /* keep defaults - tokens list empty */
  }
};

const filterByModel = (model: string) => {
  modelFilter.value = model;
  modelFilterInput.value = model;
  onFilterChange();
};

const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const exportCSV = () => {
  const headers = ['时间', '模型', 'Token ID', 'Prompt Tokens', 'Completion Tokens', '总Tokens', '费用', 'IP'];
  const rows = logs.value.map(l => [
    l.createdAt,
    l.model,
    l.tokenId,
    l.promptTokens,
    l.completionTokens,
    l.totalTokens,
    l.totalCost,
    l.ip,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'logs.csv';
  a.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  fetchLogs();
  fetchChannels();
  fetchTokens();
  document.addEventListener('click', handleComboClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleComboClickOutside);
});
</script>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.header-text h2 {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.header-text p {
  color: var(--text-muted);
  font-size: 0.875rem;
}

/* Filter Bar */
.filter-bar {
  padding: 16px 20px;
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  min-width: 140px;
}

.filter-group.flex-1 {
  flex: 1;
  min-width: 160px;
}

.filter-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  color: var(--text-primary);
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.filter-input:focus {
  border-color: var(--accent-blue);
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  padding-bottom: 1px;
}

.btn-clear {
  font-size: 0.8rem;
  padding: 6px 12px;
  color: var(--accent-blue);
}

/* Table */
.time-cell {
  display: flex;
  flex-direction: column;
}

.time-main {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.875rem;
}

.time-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.relation-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.cell-icon {
  color: var(--text-muted);
  opacity: 0.6;
}

.model-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-icon {
  flex-shrink: 0;
  border-radius: 4px;
}

.model-tag {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
}

.model-tag.clickable {
  cursor: pointer;
}

.usage-stack {
  display: flex;
  flex-direction: column;
}

.usage-total {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.usage-total .unit {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.usage-split {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.ip-code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.empty-cell {
  text-align: center;
  padding: 40px 16px !important;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.pagination-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.01);
}

.pagination-info {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  border-radius: 6px;
  color: var(--text-secondary);
}

.page-btn:hover:not(.active) {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.page-btn.active {
  background: var(--accent-blue);
  color: white;
  font-weight: 600;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-secondary);
}

.btn-icon:hover:not(:disabled) {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Combo Box */
.combo-box {
  position: relative;
}

.combo-input {
  width: 100%;
}

.combo-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 220px;
  overflow-y: auto;
  background: var(--bg-card);
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.combo-icon,
.combo-icon-placeholder {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-right: 8px;
}

.combo-icon-placeholder {
  background: var(--border-subtle);
  border-radius: 3px;
}

.combo-option {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-family: var(--font-mono, monospace);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.1s;
}

.combo-option:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.combo-option.selected {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.08);
}

.combo-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.combo-empty {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  padding: 12px 8px;
}

/* Drop transition */
.drop-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.drop-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Estimate badge */
.est-badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--accent-orange);
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 6px;
  vertical-align: middle;
}

/* Cost cell */
.cost-cell {
  text-align: right;
}

.cost-value {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--accent-green);
  font-size: 0.82rem;
}

.cost-na {
  color: var(--text-muted);
  font-size: 0.8rem;
}
</style>
