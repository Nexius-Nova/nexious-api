<template>
  <div class="models-layout">
    <!-- Left Filter Sidebar -->
    <aside class="filter-sidebar glass-panel">
      <!-- Search -->
      <div class="filter-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" class="filter-search-input" placeholder="搜索模型..." />
      </div>

      <!-- Provider filter -->
      <div class="filter-section">
        <h4 class="filter-title">供应商</h4>
        <div class="filter-chips">
          <button
            :class="['filter-chip', { active: !providerFilter }]"
            @click="providerFilter = ''"
          >全部</button>
          <button
            v-for="t in providerTypes"
            :key="t"
            :class="['filter-chip', { active: providerFilter === t }]"
            @click="providerFilter = providerFilter === t ? '' : t"
          >{{ t }}</button>
        </div>
      </div>

      <!-- Type filter -->
      <div class="filter-section">
        <h4 class="filter-title">模型类型</h4>
        <div class="filter-chips">
          <button
            :class="['filter-chip', { active: !typeFilter }]"
            @click="typeFilter = ''"
          >全部</button>
          <button
            v-for="t in modelTypeOptions"
            :key="t.value"
            :class="['filter-chip', 'chip-' + t.value, { active: typeFilter === t.value }]"
            @click="typeFilter = typeFilter === t.value ? '' : t.value"
          >{{ t.label }}</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="filter-stats">
        <div class="filter-stat">
          <span class="filter-stat-label">模型总数</span>
          <span class="filter-stat-value">{{ uniqueModels.length }}</span>
        </div>
        <div class="filter-stat">
          <span class="filter-stat-label">可用模型</span>
          <span class="filter-stat-value accent-green">{{ availableModels.length }}</span>
        </div>
        <div class="filter-stat">
          <span class="filter-stat-label">渠道总数</span>
          <span class="filter-stat-value">{{ channels.length }}</span>
        </div>
        <div class="filter-stat">
          <span class="filter-stat-label">当前筛选</span>
          <span class="filter-stat-value accent-blue">{{ filteredModels.length }}</span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="models-main">
      <div v-if="filteredModels.length" class="models-grid">
        <div
          v-for="model in filteredModels"
          :key="model.name"
          class="model-card glass-panel"
          @click="openDetail(model)"
        >
          <div class="model-card-top">
            <div class="model-card-icon">
              <ModelIcon :name="model.name" :size="26" />
            </div>
            <div class="model-card-badges">
              <span :class="['status-dot-sm', model.available ? 'active' : 'inactive']"></span>
              <span class="type-badge-sm" :class="'type-' + model.modelType">{{ typeLabel(model.modelType) }}</span>
            </div>
          </div>

          <code class="model-card-name">{{ model.name }}</code>

          <div class="model-card-providers">
            <span v-for="t in model.types" :key="t" class="provider-chip">{{ t }}</span>
          </div>

          <div class="model-card-channels">
            <div
              v-for="ch in model.channels"
              :key="ch.id ?? ch.name"
              :class="['channel-row', { disabled: !ch.status }]"
            >
              <span class="channel-row-dot" :class="ch.status ? 'active' : 'inactive'"></span>
              <span class="channel-row-name">{{ ch.name }}</span>
              <span v-if="getPricing(ch.id, model.name)" class="channel-row-price">{{ formatPricing(getPricing(ch.id, model.name)!) }}</span>
              <span class="channel-row-weight">×{{ ch.weight }}</span>
            </div>
          </div>

          <div class="model-card-footer">
            <span class="footer-channels">{{ model.channelCount }} 渠道</span>
            <span class="footer-hint">点击查看详情 →</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>{{ channels.length ? '没有匹配的模型' : '暂无模型数据，请先添加渠道' }}</p>
      </div>
    </main>

    <!-- Model Detail Modal -->
    <Teleport to="body">
      <div v-if="detailVisible" class="modal-overlay" @click.self="detailVisible = false">
        <div class="modal-panel glass-panel animate-fade-in">
          <div class="modal-header">
            <div class="modal-title">
              <ModelIcon v-if="selectedModel" :name="selectedModel.name" :size="26" />
              <code class="modal-model-name">{{ selectedModel?.name }}</code>
              <span :class="['status-badge-lg', selectedModel?.available ? 'available' : 'unavailable']">
                {{ selectedModel?.available ? '可用' : '不可用' }}
              </span>
            </div>
            <button class="close-btn" @click="detailVisible = false">&times;</button>
          </div>

          <div class="modal-body">
            <div class="detail-section">
              <h4>模型类型</h4>
              <span class="type-badge type-badge-lg" :class="'type-' + selectedModel?.modelType">{{ typeLabel(selectedModel?.modelType || 'text') }}</span>
            </div>

            <div class="detail-section">
              <h4>API 端点</h4>
              <code class="endpoint-code">{{ endpointForType(selectedModel?.modelType || 'text') }}</code>
            </div>

            <div class="detail-section">
              <h4>提供商类型</h4>
              <div class="detail-tags">
                <span v-for="t in selectedModel?.types" :key="t" class="provider-tag-lg">{{ t }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>可用渠道 ({{ selectedModel?.channels.length }})</h4>
              <div class="channel-detail-list">
                <div
                  v-for="ch in selectedModel?.channels"
                  :key="ch.id ?? ch.name"
                  class="channel-detail-item"
                >
                  <div class="channel-detail-left">
                    <div class="channel-icon">
                      <ModelIcon v-if="getIconInfo(ch.type)" :name="ch.type" :size="20" />
                      <span v-else class="channel-icon-fallback">{{ ch.type[0].toUpperCase() }}</span>
                    </div>
                    <div class="channel-detail-info">
                      <span class="channel-detail-name">{{ ch.name }}</span>
                      <span class="channel-detail-url">{{ ch.baseUrl }}</span>
                    </div>
                  </div>
                  <div class="channel-detail-right">
                    <span :class="['status-dot-sm', ch.status ? 'active' : 'inactive']"></span>
                    <span class="channel-detail-status">{{ ch.status ? '启用' : '禁用' }}</span>
                    <span v-if="selectedModel && getPricing(ch.id, selectedModel.name)" class="channel-detail-price">{{ formatPricing(getPricing(ch.id, selectedModel.name)!) }}</span>
                    <span class="channel-detail-weight">权重 {{ ch.weight }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" @click="detailVisible = false">关闭</button>
            <router-link to="/console/channels" class="btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8Z"></path><path d="M10 12h.01"></path><path d="M14 12h.01"></path><path d="M18 12h4"></path><path d="M21.5 10V14"></path></svg>
              管理渠道
            </router-link>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { pricingApi } from '../api/pricing';
import type { Channel, ModelPricing } from '../types';
import { getIconInfo } from '../utils/icons';
import ModelIcon from '../components/ModelIcon.vue';

const channels = ref<Channel[]>([]);
const search = ref('');
const providerFilter = ref('');
const typeFilter = ref('');
const detailVisible = ref(false);
const selectedModel = ref<ModelEntry | null>(null);
const pricingMap = ref<Map<string, ModelPricing>>(new Map());

const modelTypeOptions = [
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
];

const providerTypes = computed(() => {
  const types = new Set<string>();
  for (const ch of channels.value) {
    if (ch.type) types.add(ch.type);
  }
  return Array.from(types).sort();
});

const fetchChannels = async () => {
  const res = await api.get('/channels');
  channels.value = res.data;
};

interface ModelEntry {
  name: string;
  channels: Channel[];
  available: boolean;
  types: string[];
  channelCount: number;
  modelType: string;
}

const uniqueModels = computed(() => {
  const map = new Map<string, ModelEntry>();
  for (const ch of channels.value) {
    const models = ch.models.split(',').map((m) => m.trim()).filter(Boolean);
    // Parse modelTypes JSON
    let modelTypeMap: Record<string, string> = {};
    if (ch.modelTypes) {
      try {
        modelTypeMap = JSON.parse(ch.modelTypes);
      } catch { /* ignore invalid JSON */ }
    }
    for (const model of models) {
      const modelType = modelTypeMap[model] || 'text';
      const existing = map.get(model);
      if (existing) {
        existing.channels.push(ch);
        if (!existing.types.includes(ch.type)) existing.types.push(ch.type);
        if (ch.status) existing.available = true;
        existing.channelCount = existing.channels.length;
        // Merge model type — prefer non-text if available
        if (existing.modelType === 'text' && modelType !== 'text') {
          existing.modelType = modelType;
        }
      } else {
        map.set(model, {
          name: model,
          channels: [ch],
          available: ch.status,
          types: [ch.type],
          channelCount: 1,
          modelType,
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const availableModels = computed(() => uniqueModels.value.filter((m) => m.available));

const filteredModels = computed(() => {
  let list = uniqueModels.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.types.some((t) => t.toLowerCase().includes(q)) ||
        m.channels.some((c) => c.name.toLowerCase().includes(q))
    );
  }
  if (providerFilter.value) {
    list = list.filter((m) => m.types.includes(providerFilter.value));
  }
  if (typeFilter.value) {
    list = list.filter((m) => m.modelType === typeFilter.value);
  }
  return list;
});

const openDetail = (model: ModelEntry) => {
  selectedModel.value = model;
  detailVisible.value = true;
};

const fetchPricing = async () => {
  try {
    const list = await pricingApi.list();
    const map = new Map<string, ModelPricing>();
    for (const p of list) {
      map.set(`${p.channelId}:${p.model}`, p);
    }
    pricingMap.value = map;
  } catch {}
};

const getPricing = (channelId: number | undefined, model: string): ModelPricing | null => {
  if (!channelId) return null;
  return pricingMap.value.get(`${channelId}:${model}`) || null;
};

const formatPricing = (p: ModelPricing) => {
  const input = Number(p.inputPricePer1M) || 0;
  const output = Number(p.outputPricePer1M) || 0;
  return `${p.currency} ${input.toFixed(4)}/${output.toFixed(4)}`;
};

const typeLabel = (t: string) => {
  const map: Record<string, string> = { text: '文本', image: '图片', video: '视频', audio: '音频' };
  return map[t] || t;
};

const endpointForType = (t: string) => {
  const map: Record<string, string> = {
    text: 'POST /v1/chat/completions',
    image: 'POST /v1/images/generations',
    video: 'POST /v1/video/generations',
    audio: 'POST /v1/audio/speech',
  };
  return map[t] || 'POST /v1/chat/completions';
};

onMounted(() => {
  Promise.all([fetchChannels(), fetchPricing()]);
});
</script>

<style scoped>
/* ============================================
   Layout
   ============================================ */
.models-layout {
  display: flex;
  height: 100%;
  gap: 0;
  overflow: hidden;
}

/* ============================================
   Left Filter Sidebar
   ============================================ */
.filter-sidebar {
  width: 280px;
  flex-shrink: 0;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  border-right: none;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  gap: 24px;
  overflow-y: auto;
}

/* Search */
.filter-search {
  position: relative;
}

.filter-search .search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.filter-search-input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 9px 10px 9px 32px;
  color: var(--text-primary);
  font-size: 0.83rem;
  outline: none;
  transition: border-color 0.2s;
}

.filter-search-input:focus {
  border-color: var(--accent-blue);
}

/* Filter sections */
.filter-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.filter-chip:hover {
  color: var(--text-secondary);
  border-color: var(--text-muted);
}

.filter-chip.active {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

/* Type chip colors */
.filter-chip.chip-text.active {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.filter-chip.chip-image.active {
  color: var(--accent-green);
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.filter-chip.chip-video.active {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
}

.filter-chip.chip-audio.active {
  color: #f97316;
  background: rgba(249, 115, 22, 0.1);
  border-color: rgba(249, 115, 22, 0.3);
}

/* Stats */
.filter-stats {
  margin-top: auto;
  padding-top: 18px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
}

.filter-stat-label {
  color: var(--text-muted);
}

.filter-stat-value {
  font-weight: 600;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.filter-stat-value.accent-green {
  color: var(--accent-green);
}

.filter-stat-value.accent-blue {
  color: var(--accent-blue);
}

/* ============================================
   Main Content
   ============================================ */
.models-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  min-width: 0;
}

/* Models Grid */
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

/* Model Card */
.model-card {
  padding: 18px;
  transition: transform 0.2s, border-color 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.model-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-accent);
}

.model-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.model-card-icon {
  flex-shrink: 0;
}

.model-card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot-sm {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot-sm.active {
  background: var(--accent-green);
}

.status-dot-sm.inactive {
  background: var(--text-muted);
}

.type-badge-sm {
  font-size: 0.6rem;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.type-badge-sm.type-text {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.type-badge-sm.type-image {
  color: var(--accent-green);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.type-badge-sm.type-video {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.15);
}

.type-badge-sm.type-audio {
  color: #f97316;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.15);
}

.model-card-name {
  font-family: var(--font-mono);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.08);
  padding: 4px 10px;
  border-radius: 5px;
  word-break: break-all;
}

/* Provider chips */
.model-card-providers {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.provider-chip {
  font-size: 0.62rem;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
  background: var(--bg-input);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

/* Channel rows */
.model-card-channels {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 120px;
  overflow-y: auto;
}

.channel-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  background: var(--bg-sidebar);
  border: 1px solid var(--border-subtle);
}

.channel-row.disabled {
  opacity: 0.4;
}

.channel-row-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.channel-row-dot.active {
  background: var(--accent-green);
}

.channel-row-dot.inactive {
  background: var(--text-muted);
}

.channel-row-name {
  flex: 1;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-row-weight {
  font-size: 0.62rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.channel-row-price {
  font-size: 0.6rem;
  color: var(--accent-green);
  font-family: var(--font-mono);
  flex-shrink: 0;
  margin-left: auto;
  margin-right: 6px;
}

/* Card footer */
.model-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
}

.footer-channels {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.footer-hint {
  font-size: 0.65rem;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.2s;
}

.model-card:hover .footer-hint {
  opacity: 1;
  color: var(--accent-blue);
}

/* ============================================
   Modal
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-panel {
  width: 540px;
  max-width: 92vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px 0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-model-name {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 12px;
  border-radius: 6px;
}

.status-badge-lg {
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.status-badge-lg.available {
  color: var(--accent-green);
  background: rgba(16, 185, 129, 0.1);
}

.status-badge-lg.unavailable {
  color: var(--text-muted);
  background: rgba(113, 113, 122, 0.1);
}

.close-btn {
  font-size: 1.5rem;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.close-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 28px;
  overflow-y: auto;
  flex: 1;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.provider-tag-lg {
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 500;
  text-transform: capitalize;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

/* API Endpoint */
.endpoint-code {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  background: var(--bg-sidebar);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--accent-blue);
}

/* Type badge (modal) */
.type-badge {
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 500;
  white-space: nowrap;
}

.type-badge.type-text {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.type-badge.type-image {
  color: var(--accent-green);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.type-badge.type-video {
  color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.15);
}

.type-badge.type-audio {
  color: #f97316;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.15);
}

.type-badge-lg {
  font-size: 0.8rem;
  padding: 5px 16px;
  border-radius: 6px;
}

.channel-detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  background: var(--bg-sidebar);
  border: 1px solid var(--border-subtle);
  transition: border-color 0.15s;
}

.channel-detail-item:hover {
  border-color: var(--border-accent);
}

.channel-detail-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.channel-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.channel-icon-fallback {
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--accent-blue);
}

.channel-detail-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.channel-detail-name {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-detail-url {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-detail-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.channel-detail-status {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.channel-detail-weight {
  font-size: 0.7rem;
  color: var(--text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-input);
}

.channel-detail-price {
  font-size: 0.72rem;
  color: var(--accent-green);
  font-family: var(--font-mono);
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 28px 24px;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: var(--text-muted);
  font-size: 0.9rem;
  min-height: 300px;
}

/* Transition */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out;
}
</style>
