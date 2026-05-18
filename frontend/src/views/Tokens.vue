<template>
  <div class="tokens animate-fade-in">
    <div class="view-header">
      <div class="header-text">
        <h2>访问令牌</h2>
        <p>用于访问所有上游渠道的统一 API 密钥。</p>
      </div>
      <button class="btn-primary" @click="openDialog()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        生成令牌
      </button>
    </div>

    <DataTable :columns="columns" :data="tokens" empty-text="暂无令牌数据">
      <template #cell-name="{ row }">
        <div class="token-name">{{ row.name }}</div>
        <div class="token-date">创建于 {{ new Date(row.createdAt!).toLocaleDateString() }}</div>
      </template>
      <template #cell-key="{ row }">
        <div class="key-wrapper">
          <code class="mono-key">{{ maskKey(row.key) }}</code>
          <button class="icon-btn-sm" @click="copyKey(row.key)" title="复制密钥">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </template>
      <template #cell-group="{ row }">
        <span v-if="row.group" class="tag">{{ row.group }}</span>
        <span v-else class="text-muted">-</span>
      </template>
      <template #cell-quota="{ row }">
        <div v-if="row.quota === -1" class="usage-info">
          <span class="usage-value">{{ row.used.toLocaleString() }}</span>
          <span class="usage-unit">/ ∞</span>
        </div>
        <div v-else class="quota-bar">
          <ProgressBar :value="row.used" :max="row.quota" :label="`${Math.round(row.used / row.quota * 100)}%`" />
        </div>
      </template>
      <template #cell-status="{ row }">
        <span :class="['status-dot', row.status ? 'status-active' : 'status-disabled']"></span>
        {{ row.status ? '正常' : '已吊销' }}
      </template>
      <template #cell-expiresAt="{ row }">
        <span v-if="isExpired(row.expiresAt)" class="tag" style="color: var(--accent-red); border-color: rgba(239,68,68,0.3);">已过期</span>
        <span v-else-if="isExpiringSoon(row.expiresAt)" class="tag" style="color: var(--accent-orange); border-color: rgba(245,158,11,0.3);">即将到期</span>
        <span v-else class="text-muted">{{ row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '永久' }}</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="actions">
          <button class="icon-btn-sm" @click="openDialog(row as any)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn-sm danger" @click="deleteToken((row as any).id!)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Token Dialog -->
    <Modal :visible="dialogVisible" :title="form.id ? '更新令牌' : '生成新令牌'" width="480px" @close="dialogVisible = false">
      <FormInput :model-value="form.name || ''" @update:model-value="form.name = $event" label="令牌名称 / 标签" placeholder="例如：生产环境 Web 应用" />
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">分组</label>
          <SelectField :model-value="form.group || ''" @update:model-value="form.group = $event" :options="groupOptions" placeholder="不分组" />
        </div>
        <FormInput :model-value="form.expiresAt || ''" @update:model-value="form.expiresAt = $event" type="date" label="过期时间" />
      </div>
      <FormNumber :model-value="form.quota ?? -1" @update:model-value="form.quota = $event" label="额度限制 (Tokens)" placeholder="-1 表示无限额度" hint="设置为 -1 以不限制使用额度。" />
      <div class="form-group">
        <label class="form-label">允许的模型</label>
        <div class="model-selector">
          <div class="model-selector-trigger" @click="showModelPicker = !showModelPicker">
            <span v-if="form.allowedModels" class="model-selector-summary">{{ form.allowedModels.split(',').length }} 个模型已选择</span>
            <span v-else class="model-selector-placeholder">全部允许（不限制）</span>
            <svg :class="['model-chevron', { rotated: showModelPicker }]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <Transition name="drop">
            <div v-if="showModelPicker" class="model-dropdown glass-panel">
              <div class="model-dropdown-header">
                <button class="clear-btn" @click="form.allowedModels = ''; showModelPicker = false">清除选择</button>
                <button class="confirm-btn" @click="showModelPicker = false">确定</button>
              </div>
              <div class="model-dropdown-list">
                <label
                  v-for="model in availableModels"
                  :key="model"
                  class="model-check-item"
                >
                  <input
                    type="checkbox"
                    :checked="isModelSelected(model)"
                    @change="toggleModel(model)"
                  />
                  <span class="check-box"></span>
                  <ModelIcon :name="model" :size="18" />
                  <span class="check-label">{{ model }}</span>
                </label>
                <div v-if="!availableModels.length" class="model-empty">暂无可用模型，请先配置渠道</div>
              </div>
            </div>
          </Transition>
        </div>
        <p class="form-hint">留空表示允许所有模型。</p>
      </div>
      <FormTextarea :model-value="form.note || ''" @update:model-value="form.note = $event" label="备注" placeholder="可选的备注信息" :rows="2" />
      <div class="form-group">
        <label class="form-label">状态</label>
        <SwitchToggle :model-value="!!form.status" @update:model-value="form.status = $event" :label="form.status ? '正常' : '禁用'" />
      </div>
      <template #footer>
        <button class="btn-ghost" @click="dialogVisible = false">取消</button>
        <button class="btn-primary" @click="saveToken">
          {{ form.id ? '保存更改' : '生成令牌' }}
        </button>
      </template>
    </Modal>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      v-model:visible="confirmVisible"
      title="删除令牌"
      message="确定要删除该令牌吗？此操作不可逆。"
      confirm-text="删除"
      type="danger"
      @confirm="doDeleteToken"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import type { Token, Channel } from '../types';
import DataTable from '../components/DataTable.vue';
import type { ColumnDef } from '../components/DataTable.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ProgressBar from '../components/ProgressBar.vue';
import SelectField from '../components/SelectField.vue';
import FormInput from '../components/FormInput.vue';
import FormNumber from '../components/FormNumber.vue';
import FormTextarea from '../components/FormTextarea.vue';
import Modal from '../components/Modal.vue';
import SwitchToggle from '../components/SwitchToggle.vue';
import { useToast } from '../composables/useToast';
import ModelIcon from '../components/ModelIcon.vue';

const groupOptions = [
  { value: 'production', label: 'Production (生产)' },
  { value: 'staging', label: 'Staging (预发布)' },
  { value: 'development', label: 'Development (开发)' },
  { value: 'testing', label: 'Testing (测试)' },
  { value: 'internal', label: 'Internal (内部)' },
];

const tokens = ref<Token[]>([]);
const dialogVisible = ref(false);
const confirmVisible = ref(false);
const deletingId = ref<number | null>(null);
const showModelPicker = ref(false);
const channels = ref<Channel[]>([]);

const form = ref<Partial<Token>>({
  id: null,
  name: '',
  quota: -1,
  status: true,
  group: '',
  allowedModels: '',
  expiresAt: null,
  note: '',
});
const toast = useToast();

const columns: ColumnDef[] = [
  { key: 'name', label: '名称' },
  { key: 'key', label: 'API 密钥' },
  { key: 'group', label: '分组' },
  { key: 'quota', label: '已用额度' },
  { key: 'status', label: '状态' },
  { key: 'expiresAt', label: '过期时间' },
  { key: 'actions', label: '操作', align: 'right' },
];

const availableModels = computed(() => {
  const set = new Set<string>();
  for (const ch of channels.value) {
    for (const m of ch.models.split(',').map((s) => s.trim()).filter(Boolean)) {
      set.add(m);
    }
  }
  return Array.from(set).sort();
});

const isModelSelected = (model: string) => {
  if (!form.value.allowedModels) return false;
  return form.value.allowedModels.split(',').map((s) => s.trim()).includes(model);
};

const toggleModel = (model: string) => {
  const current = form.value.allowedModels
    ? form.value.allowedModels.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const idx = current.indexOf(model);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(model);
  }
  form.value.allowedModels = current.join(',');
};

const fetchChannels = async () => {
  try {
    const res = await api.get('/channels');
    channels.value = res.data;
  } catch {}
};

const fetchTokens = async () => {
  const res = await api.get('/tokens');
  tokens.value = res.data;
};

const openDialog = (row: Token | null = null) => {
  if (row) {
    form.value = { ...row };
    // Convert ISO date to YYYY-MM-DD for date input
    if (form.value.expiresAt) {
      form.value.expiresAt = (form.value.expiresAt as string).slice(0, 10);
    }
  } else {
    form.value = {
      id: null,
      name: '',
      quota: -1,
      status: true,
      group: '',
      allowedModels: '',
      expiresAt: null,
      note: '',
    };
  }
  dialogVisible.value = true;
};

// Whitelist: only fields allowed by CreateTokenDto / UpdateTokenDto
const TOKEN_WHITELIST = [
  'name', 'quota', 'status', 'group',
  'allowedModels', 'expiresAt', 'note',
] as const;

const cleanTokenPayload = (raw: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const k of TOKEN_WHITELIST) {
    if (k in raw) {
      const v = raw[k];
      if (k === 'expiresAt' && !v) {
        out[k] = null;
      } else {
        out[k] = v;
      }
    }
  }
  return out;
};

const saveToken = async () => {
  try {
    const payload = cleanTokenPayload(form.value);
    if (form.value.id) {
      await api.patch(`/tokens/${form.value.id}`, payload);
    } else {
      await api.post('/tokens', payload);
    }
    dialogVisible.value = false;
    fetchTokens();
    toast.success(form.value.id ? '令牌已更新' : '令牌已生成');
  } catch (error) {
    toast.error('操作失败');
  }
};

const deleteToken = (id: number) => {
  deletingId.value = id;
  confirmVisible.value = true;
};

const doDeleteToken = async () => {
  if (deletingId.value === null) return;
  try {
    await api.delete(`/tokens/${deletingId.value}`);
    deletingId.value = null;
    fetchTokens();
    toast.success('令牌已删除');
  } catch (error) {
    toast.error('删除失败');
  }
};

const copyKey = async (key: string) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(key);
    } else {
      // Fallback for HTTP (non-secure context)
      const ta = document.createElement('textarea');
      ta.value = key;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast.success('已复制到剪贴板');
  } catch {
    toast.error('复制失败');
  }
};

const maskKey = (key: string) => {
  if (!key || key.length <= 8) return '****';
  return key.slice(0, 6) + '••••' + key.slice(-4);
};

const isExpired = (date: string | null | undefined) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

const isExpiringSoon = (date: string | null | undefined) => {
  if (!date) return false;
  const d = new Date(date);
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  return d > new Date() && d <= sevenDays;
};

onMounted(() => {
  fetchTokens();
  fetchChannels();
});
</script>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.header-text h2 {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.header-text p {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.token-name {
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 2px;
}

.token-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.key-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mono-key {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background: var(--bg-sidebar);
  border: 1px solid var(--border-subtle);
  padding: 4px 8px;
  border-radius: 4px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-info {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.usage-value {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.usage-unit {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.quota-bar {
  min-width: 100px;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.icon-btn-sm {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-muted);
}

.icon-btn-sm:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.icon-btn-sm.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ============ Model Selector ============ */
.model-selector {
  position: relative;
}

.model-selector-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.model-selector-trigger:hover {
  border-color: var(--text-muted);
}

.model-selector-summary {
  color: var(--text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-selector-placeholder {
  color: var(--text-muted);
  flex: 1;
}

.model-chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.model-chevron.rotated {
  transform: rotate(180deg);
}

.model-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 260px;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  padding: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.model-dropdown-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.clear-btn {
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: 4px;
}

.clear-btn:hover {
  color: var(--accent-red);
  background: rgba(239, 68, 68, 0.08);
}

.confirm-btn {
  font-size: 0.75rem;
  color: var(--accent-blue);
  padding: 4px 8px;
  border-radius: 4px;
}

.confirm-btn:hover {
  background: rgba(59, 130, 246, 0.08);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.model-dropdown-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.model-check-icon,
.model-check-icon-placeholder {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 4px;
}

.model-check-icon-placeholder {
  background: var(--border-subtle);
}

.model-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s;
}

.model-check-item:hover {
  background: var(--bg-card-hover);
}

.model-check-item input {
  display: none;
}

.check-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--text-muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.model-check-item input:checked + .check-box {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
}

.model-check-item input:checked + .check-box::after {
  content: '';
  width: 5px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-top: -1px;
}

.check-label {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
}

.model-empty {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
  padding: 20px 10px;
}

/* Transition */
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

</style>
