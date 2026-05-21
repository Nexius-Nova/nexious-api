<template>
  <div class="channels animate-fade-in">
    <div class="view-header">
      <div class="header-text">
        <h2>系统渠道</h2>
        <p>管理您的上游 LLM 提供商和模型。</p>
      </div>
      <button class="btn-primary" @click="openDialog()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        添加渠道
      </button>
    </div>

    <LoadingSkeleton v-if="channelsLoading" type="table" :rows="5" :cols="8" />
    <div v-else-if="channelsError" class="error-state">
      <p>{{ channelsError }}</p>
      <button class="btn-ghost" @click="fetchChannels">重试</button>
    </div>
    <template v-else>
      <!-- Batch Toolbar -->
      <div v-if="selectedIds.size > 0" class="batch-toolbar glass-panel">
        <span class="batch-count">已选择 {{ selectedIds.size }} 项</span>
        <div class="batch-actions">
          <button class="btn-ghost btn-sm" @click="batchEnable">批量启用</button>
          <button class="btn-ghost btn-sm" @click="batchDisable">批量禁用</button>
          <button class="btn-ghost btn-sm danger" @click="batchDelete">批量删除</button>
        </div>
      </div>
      <DataTable :columns="columns" :data="channels" empty-text="暂无渠道数据">
      <template #cell-_select="{ row }">
        <input
          type="checkbox"
          :checked="selectedIds.has((row as any).id!)"
          @change="toggleSelect((row as any).id!)"
          class="row-checkbox"
        />
      </template>
      <template #cell-type="{ row }">
        <div class="provider-info">
          <div class="provider-icon">
            <ModelIcon v-if="getIconInfo(row.type)" :name="row.type" :size="24" />
            <span v-else class="provider-icon-fallback">{{ row.type[0].toUpperCase() }}</span>
          </div>
          <div>
            <div class="provider-name">{{ row.name }}</div>
            <div class="provider-type">{{ row.type }}</div>
          </div>
        </div>
      </template>
      <template #cell-status="{ row }">
        <span :class="['status-dot', row.status ? 'status-active' : 'status-disabled']"></span>
        {{ row.status ? '启用' : '禁用' }}
      </template>
      <template #cell-visibility="{ row }">
        <span :class="['visibility-tag', row.visibility === 'public' ? 'vis-public' : 'vis-private']">
          {{ row.visibility === 'public' ? '公开' : '私有' }}
        </span>
      </template>
      <template #cell-baseUrl="{ row }">
        <code class="url-code">{{ row.baseUrl }}</code>
      </template>
      <template #cell-models="{ row }">
        <div class="tags-list">
          <span v-for="model in row.models.split(',')" :key="model" class="tag model-tag-cell">
            <ModelIcon :name="model.trim()" :size="14" />
            {{ model }}
          </span>
        </div>
      </template>
      <template #cell-weight="{ row }">
        <div class="weight-cell">
          <div class="weight-bar">
            <div class="weight-fill" :style="{ width: (row.weight / maxWeight) * 100 + '%' }"></div>
          </div>
          <span class="weight-value">{{ row.weight }}</span>
        </div>
      </template>
      <template #cell-balance="{ row }">
        <div class="balance-cell">
          <template v-if="(row as any).balanceEnabled">
            <span class="balance-value">{{ formatBalance((row as any).lastBalance) }}</span>
            <span class="balance-currency">{{ (row as any).currency || 'USD' }}</span>
          </template>
          <span v-else class="balance-disabled">未启用</span>
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="actions">
          <button
            class="icon-btn-sm"
            :class="{ testing: testingSet.has((row as any).id!) }"
            @click="testChannel((row as any).id!)"
            :title="'测试连接'"
          >
            <svg v-if="testingSet.has((row as any).id!)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </button>
          <span v-if="testResults[(row as any).id!]" :class="['test-result', testResults[(row as any).id!].success ? 'success' : 'error']" :title="((testResults[(row as any).id!] as any).error || (testResults[(row as any).id!] as any).message) || ''">
            {{ testResults[(row as any).id!].success ? testResults[(row as any).id!].latency + 'ms' : ((testResults[(row as any).id!] as any).error || (testResults[(row as any).id!] as any).message || '连接失败') }}
          </span>
          <template v-if="canEdit(row as any)">
            <button class="icon-btn-sm" @click="openDialog(row as any)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="icon-btn-sm danger" @click="deleteChannel((row as any).id!)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </template>
          <span v-else class="owner-tag" :title="'由 ' + ((row as any).user?.username || '其他用户') + ' 创建'">
            {{ (row as any).user?.username || '他人' }}
          </span>
        </div>
      </template>
      </DataTable>
    </template>

    <Modal :visible="dialogVisible" :title="form.id ? '编辑渠道' : '添加渠道'" width="560px" @close="dialogVisible = false">
      <div class="form-row">
        <FormInput v-model="form.name" label="渠道名称" placeholder="例如：OpenAI 主渠道" />
        <div class="form-group">
          <label class="form-label">类型</label>
          <SelectField v-model="form.type" :options="providerOptions" :allow-custom="true" />
        </div>
      </div>
      <FormInput v-model="form.baseUrl" label="基础 URL" placeholder="https://api.openai.com" />
      <div class="api-key-wrapper">
        <FormInput v-model="form.apiKey" label="API 密钥" type="password" :placeholder="form.id ? '留空则不修改密钥' : 'sk-...'" />
        <span v-if="form.id && !form.apiKey && apiKeyUnchanged" class="api-key-unchanged-hint">密钥未修改</span>
      </div>
      <div class="form-group">
        <label class="form-label">支持的模型</label>
        <div class="models-list">
          <div v-for="(entry, index) in modelsList" :key="index" class="model-entry">
            <input v-model="entry.name" class="form-input model-name-input" placeholder="模型名称，如 gpt-4" />
            <SelectField v-model="entry.type" :options="modelTypeOptions" placeholder="text" class="model-type-select" />
            <button class="icon-btn-sm model-remove-btn" @click="removeModelEntry(index)" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <button class="btn-ghost btn-add-model" @click="addModelEntry" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加模型
        </button>
      </div>
      <div class="form-row">
        <FormNumber v-model="form.weight" label="优先级权重" />
        <div class="form-group">
          <label class="form-label">状态</label>
          <SwitchToggle v-model="form.status" :label="form.status ? '已启用' : '已禁用'" />
        </div>
      </div>
      <div v-if="authStore.isAdmin" class="form-group">
        <label class="form-label">可见性</label>
        <SelectField v-model="formVisibility" :options="visibilityOptions" placeholder="请选择" />
      </div>
      <div class="billing-section">
        <h4 class="section-title">余额设置</h4>
        <div class="form-group">
          <SwitchToggle v-model="formBalanceEnabled" :label="formBalanceEnabled ? '已启用余额查询' : '禁用余额查询'" />
        </div>
        <div v-if="formBalanceEnabled" class="form-row">
          <div class="form-group">
            <label class="form-label">余额接口类型</label>
            <SelectField v-model="balanceApiTypeModel" :options="balanceApiOptions" placeholder="openai" />
          </div>
          <div class="form-group">
            <label class="form-label">币种</label>
            <SelectField v-model="formCurrency" :options="currencyOptions" placeholder="USD" :allow-custom="true" search-placeholder="搜索或输入自定义币种..." />
            <p class="form-hint">余额轮询后自动从官方接口获取，此处作为兜底值</p>
          </div>
        </div>
        <template v-if="formBalanceEnabled">
          <template v-if="balanceApiTypeModel === 'generic'">
            <div class="form-group">
              <label class="form-label">余额接口 URL</label>
              <FormInput v-model="genericUrl" placeholder="https://api.moonshot.cn/v1/users/me/balance" />
              <p class="form-hint">完整 URL（https://...）或相对路径（如 /v1/users/me/balance），相对路径会拼接到基础 URL 后</p>
            </div>
            <div class="form-group">
              <label class="form-label">余额字段路径</label>
              <FormInput v-model="genericResponsePath" placeholder="data.available_balance" />
              <p class="form-hint">响应 JSON 中余额值的路径，用 . 分隔嵌套。如 data.balance、available_balance</p>
            </div>
          </template>
          <div v-else class="form-group">
            <label class="form-label">余额接口配置 (JSON)</label>
            <textarea v-model="balanceApiConfigModel" class="form-textarea" rows="2" placeholder='{"balanceUrl":"https://custom/api/balance"}'></textarea>
          </div>
        </template>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="dialogVisible = false">取消</button>
        <button class="btn-secondary" @click="testBeforeSave" :disabled="testingBeforeSave">
          {{ testingBeforeSave ? '测试中...' : '测试并保存' }}
        </button>
        <button class="btn-primary" @click="saveChannel">保存渠道</button>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:visible="confirmVisible"
      title="删除渠道"
      message="确定要删除该渠道吗？此操作不可恢复。删除此渠道将影响所有使用该渠道中模型的 API Token 和会话。删除后，关联该渠道的令牌将无法使用此渠道模型，相关会话可能受到影响。"
      confirm-text="删除"
      type="danger"
      @confirm="doDeleteChannel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '../api';
import type { Channel } from '../types';
import { MODEL_TYPE_OPTIONS } from '../types';
import LoadingSkeleton from '../components/LoadingSkeleton.vue';
import DataTable from '../components/DataTable.vue';
import type { ColumnDef } from '../components/DataTable.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import SelectField from '../components/SelectField.vue';
import FormInput from '../components/FormInput.vue';
import FormNumber from '../components/FormNumber.vue';
import SwitchToggle from '../components/SwitchToggle.vue';
import Modal from '../components/Modal.vue';
import { useToast } from '../composables/useToast';
import { getIconInfo } from '../utils/icons';
import ModelIcon from '../components/ModelIcon.vue';
import { useAuthStore } from '../store/auth';

const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic / Claude' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'xai', label: 'xAI Grok' },
  { value: 'ollama', label: 'Ollama (本地)' },
  { value: 'dify', label: 'Dify' },
  { value: 'together', label: 'Together AI' },
  { value: 'openrouter', label: 'OpenRouter' },
];

const visibilityOptions = [
  { value: 'private', label: '私有 — 仅自己可见' },
  { value: 'public', label: '公开 — 所有用户可见' },
];

const balanceApiOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'openai-compatible', label: 'OpenAI 兼容 (通用)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'deepseek-compatible', label: 'DeepSeek 兼容 (通用)' },
  { value: 'kimi', label: 'Kimi / Moonshot' },
  { value: 'generic', label: '自定义 (Generic)' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD - 美元' },
  { value: 'CNY', label: 'CNY - 人民币' },
  { value: 'EUR', label: 'EUR - 欧元' },
  { value: 'GBP', label: 'GBP - 英镑' },
  { value: 'JPY', label: 'JPY - 日元' },
  { value: 'KRW', label: 'KRW - 韩元' },
];

const modelTypeOptions = MODEL_TYPE_OPTIONS.map((o) => ({ ...o }));

const channels = ref<Channel[]>([]);
const channelsLoading = ref(true);
const channelsError = ref('');
const dialogVisible = ref(false);
const confirmVisible = ref(false);
const deletingId = ref<number | null>(null);
const testingSet = ref<Set<number>>(new Set());
const testResults = ref<Record<number, { success: boolean; latency: number; error?: string; message?: string }>>({});
const testingBeforeSave = ref(false);
const apiKeyUnchanged = ref(false);
const selectedIds = ref<Set<number>>(new Set());
const form = ref<Channel>({
  id: null,
  name: '',
  type: 'openai',
  baseUrl: '',
  apiKey: '',
  models: '',
  modelTypes: '',
  status: true,
  weight: 1,
  visibility: 'private',
  currency: 'USD',
  balanceEnabled: false,
  balanceApiType: 'openai-compatible',
  balanceApiConfig: '',
});
const toast = useToast();
const authStore = useAuthStore();

const genericUrl = ref('');
const genericResponsePath = ref('');

interface ModelEntry { name: string; type: string }
const modelsList = ref<ModelEntry[]>([]);

const addModelEntry = () => {
  modelsList.value.push({ name: '', type: 'text' });
};

const removeModelEntry = (index: number) => {
  modelsList.value.splice(index, 1);
};

const syncFormFromModelsList = () => {
  const entries = modelsList.value.filter(e => e.name.trim());
  form.value.models = entries.map(e => e.name.trim()).join(',');
  const types: Record<string, string> = {};
  entries.forEach(e => {
    if (e.type && e.type !== 'text') {
      types[e.name.trim()] = e.type;
    }
  });
  form.value.modelTypes = Object.keys(types).length > 0 ? JSON.stringify(types) : '';
};

const columns: ColumnDef[] = [
  { key: '_select', label: '', width: '40px', sortable: false },
  { key: 'type', label: '提供商' },
  { key: 'status', label: '状态' },
  { key: 'visibility', label: '可见性' },
  { key: 'baseUrl', label: '基础 URL' },
  { key: 'models', label: '模型' },
  { key: 'weight', label: '权重' },
  { key: 'balance', label: '余额' },
  { key: 'actions', label: '操作', align: 'right' },
];

const maxWeight = computed(() => Math.max(...channels.value.map((c) => c.weight), 1));
const formVisibility = computed({
  get: () => form.value.visibility ?? 'private',
  set: (value: string) => { form.value.visibility = value; },
});

const balanceApiTypeModel = computed({
  get: () => form.value.balanceApiType ?? 'openai-compatible',
  set: (value: string) => {
    form.value.balanceApiType = value;
    if (value !== 'generic') {
      genericUrl.value = '';
      genericResponsePath.value = '';
      form.value.balanceApiConfig = '';
    }
  },
});

const balanceApiConfigModel = computed({
  get: () => form.value.balanceApiConfig ?? '',
  set: (value: string) => { form.value.balanceApiConfig = value; },
});

const formBalanceEnabled = computed({
  get: () => form.value.balanceEnabled ?? false,
  set: (value: boolean) => { form.value.balanceEnabled = value; },
});

const formCurrency = computed({
  get: () => form.value.currency ?? 'USD',
  set: (value: string) => { form.value.currency = value; },
});

const canEdit = (row: Channel) => {
  return row.userId === authStore.user?.id;
};

const fetchChannels = async () => {
  channelsLoading.value = true;
  channelsError.value = '';
  try {
    const res = await api.get('/channels');
    channels.value = res.data;
  } catch (e: any) {
    channelsError.value = e.response?.data?.message || '获取渠道列表失败';
  } finally {
    channelsLoading.value = false;
  }
};

const openDialog = (row: Channel | null = null) => {
  apiKeyUnchanged.value = false;
  if (row) {
    form.value = { ...row };
    form.value.apiKey = '';
    apiKeyUnchanged.value = true;
    const names = (row.models || '').split(',').filter(Boolean);
    let types: Record<string, string> = {};
    try { types = JSON.parse(row.modelTypes || '{}'); } catch {}
    modelsList.value = names.map(n => ({
      name: n.trim(),
      type: types[n.trim()] || 'text',
    }));
    let cfg: any = {};
    try { cfg = JSON.parse(row.balanceApiConfig || '{}'); } catch {}
    genericUrl.value = cfg.balanceUrl || cfg.path || '';
    genericResponsePath.value = cfg.responsePath || '';
  } else {
    form.value = {
      id: null, name: '', type: 'openai', baseUrl: '', apiKey: '',
      models: '', modelTypes: '', status: true, weight: 1,
      visibility: 'private', currency: 'USD', balanceEnabled: false,
      balanceApiType: 'openai-compatible', balanceApiConfig: '',
    };
    modelsList.value = [];
    genericUrl.value = '';
    genericResponsePath.value = '';
  }
  dialogVisible.value = true;
};

watch(() => form.value.apiKey, (val) => {
  if (apiKeyUnchanged.value && val) {
    apiKeyUnchanged.value = false;
  }
});

const CHANNEL_WHITELIST = [
  'name', 'type', 'baseUrl', 'apiKey', 'models',
  'modelTypes', 'status', 'weight', 'visibility',
  'currency', 'balanceEnabled', 'balanceApiType', 'balanceApiConfig',
] as const;

const cleanPayload = (raw: Record<string, any>, isUpdate: boolean) => {
  const out: Record<string, any> = {};
  for (const k of CHANNEL_WHITELIST) {
    if (k in raw) {
      const v = raw[k];
      if (isUpdate && k === 'apiKey' && !v) continue;
      out[k] = v;
    }
  }
  return out;
};

const serializeGenericConfig = () => {
  if (balanceApiTypeModel.value === 'generic') {
    const cfg: Record<string, any> = {};
    if (genericUrl.value) {
      if (/^https?:\/\//.test(genericUrl.value)) {
        cfg.balanceUrl = genericUrl.value;
      } else {
        cfg.path = genericUrl.value;
      }
    }
    if (genericResponsePath.value) cfg.responsePath = genericResponsePath.value;
    form.value.balanceApiConfig = Object.keys(cfg).length ? JSON.stringify(cfg) : '';
  }
};

const saveChannel = async () => {
  try {
    syncFormFromModelsList();
    serializeGenericConfig();
    if (form.value.id) {
      await api.patch(`/channels/${form.value.id}`, cleanPayload(form.value, true));
    } else {
      await api.post('/channels', cleanPayload(form.value, false));
    }
    dialogVisible.value = false;
    fetchChannels();
    toast.success(form.value.id ? '渠道已更新' : '渠道已创建');
  } catch (error: any) {
    if (error?.response?.status === 403) {
      toast.error('仅渠道创建者可修改');
    } else {
      toast.error('保存失败');
    }
  }
};

const testBeforeSave = async () => {
  if (!form.value.id) {
    await saveChannel();
    return;
  }
  testingBeforeSave.value = true;
  try {
    syncFormFromModelsList();
    serializeGenericConfig();
    await api.patch(`/channels/${form.value.id}`, cleanPayload(form.value, true));
    const res = await api.post(`/channels/${form.value.id}/test`);
    if (res.data.success) {
      toast.success(`测试通过 (${res.data.latency}ms)，渠道已保存`);
    } else {
      toast.error(`保存成功但测试失败: ${res.data.error}`);
    }
    dialogVisible.value = false;
    fetchChannels();
  } catch (error: any) {
    if (error?.response?.status === 403) {
      toast.error('仅渠道创建者可修改');
    } else {
      toast.error('保存失败');
    }
  } finally {
    testingBeforeSave.value = false;
  }
};

const deleteChannel = (id: number) => {
  deletingId.value = id;
  confirmVisible.value = true;
};

const doDeleteChannel = async () => {
  if (deletingId.value === null) return;
  try {
    await api.delete(`/channels/${deletingId.value}`);
    deletingId.value = null;
    fetchChannels();
    toast.success('渠道已删除');
  } catch (error: any) {
    if (error?.response?.status === 403) {
      toast.error('仅渠道创建者可删除');
    } else {
      toast.error('删除失败');
    }
  }
};

const testChannel = async (id: number) => {
  testingSet.value = new Set([...testingSet.value, id]);
  try {
    const res = await api.post(`/channels/${id}/test`);
    testResults.value = { ...testResults.value, [id]: res.data };
    if (res.data.success) {
      toast.success(`连接成功 (${res.data.latency}ms)`);
    } else {
      toast.error(`连接失败: ${res.data.error}`);
    }
  } catch {
    testResults.value = { ...testResults.value, [id]: { success: false, latency: 0, error: '请求失败' } };
    toast.error('测试请求失败');
  } finally {
    const next = new Set(testingSet.value);
    next.delete(id);
    testingSet.value = next;
  }
};

const toggleSelect = (id: number) => {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id); else next.add(id);
  selectedIds.value = next;
};

const batchEnable = async () => {
  try {
    await Promise.all(Array.from(selectedIds.value).map(id => api.patch(`/channels/${id}`, { status: true })));
    toast.success(`已启用 ${selectedIds.value.size} 个渠道`);
    selectedIds.value = new Set();
    fetchChannels();
  } catch { toast.error('批量启用失败'); }
};

const batchDisable = async () => {
  try {
    await Promise.all(Array.from(selectedIds.value).map(id => api.patch(`/channels/${id}`, { status: false })));
    toast.success(`已禁用 ${selectedIds.value.size} 个渠道`);
    selectedIds.value = new Set();
    fetchChannels();
  } catch { toast.error('批量禁用失败'); }
};

const batchDelete = async () => {
  if (!confirm(`确定要删除 ${selectedIds.value.size} 个渠道吗？此操作不可恢复。`)) return;
  try {
    await Promise.all(Array.from(selectedIds.value).map(id => api.delete(`/channels/${id}`)));
    toast.success(`已删除 ${selectedIds.value.size} 个渠道`);
    selectedIds.value = new Set();
    fetchChannels();
  } catch { toast.error('批量删除失败'); }
};

function formatBalance(value: number | string | null | undefined) {
  const n = Number(value);
  if (!value || isNaN(n) || n === 0) return '$0.00';
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

onMounted(fetchChannels);
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

.table-card {
  overflow: hidden;
}

/* Batch Toolbar */
.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  margin-bottom: 12px;
  border: 1px solid var(--accent-blue);
  border-radius: var(--radius);
}

.batch-count {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-blue);
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 0.76rem;
}

.btn-sm.danger {
  color: var(--accent-red);
}

.btn-sm.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.row-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent-blue);
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-icon {
  width: 32px;
  height: 32px;
  background: var(--bg-sidebar);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--accent-blue);
  flex-shrink: 0;
  overflow: hidden;
}

.provider-icon-img {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.provider-icon-fallback {
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--accent-blue);
}

.provider-name {
  color: var(--text-primary);
  font-weight: 500;
}

.provider-type {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.url-code {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.model-tag-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tag-icon {
  flex-shrink: 0;
  border-radius: 2px;
}

.weight-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weight-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-input);
  border-radius: 10px;
  overflow: hidden;
  min-width: 40px;
}

.weight-fill {
  height: 100%;
  background: var(--accent-blue);
  border-radius: 10px;
  opacity: 0.6;
  transition: width 0.3s;
}

.weight-value {
  font-size: 0.8rem;
  color: var(--text-muted);
  min-width: 16px;
  text-align: right;
}

.icon-btn-sm.testing {
  color: var(--accent-blue);
  animation: pulse 1s ease-in-out infinite;
}

.spin {
  animation: spin 0.8s linear infinite;
}

.test-result {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.test-result.success {
  color: var(--accent-green);
  background: rgba(16, 185, 129, 0.1);
}

.test-result.error {
  color: var(--accent-red);
  background: rgba(239, 68, 68, 0.1);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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

.select-wrapper {
  position: relative;
}

.form-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 36px !important;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.api-key-wrapper {
  position: relative;
}

.api-key-unchanged-hint {
  display: inline-block;
  font-size: 0.72rem;
  color: var(--text-muted);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-input);
  margin-left: 8px;
  font-style: italic;
}

.visibility-tag {
  display: inline-block;
  font-size: 0.73rem;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 6px;
}

.vis-public {
  color: var(--accent-green);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.vis-private {
  color: var(--text-muted);
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
}

.owner-tag {
  font-size: 0.72rem;
  color: var(--text-muted);
  padding: 3px 8px;
  background: var(--bg-input);
  border-radius: 4px;
  white-space: nowrap;
}

.balance-cell {
  font-family: var(--font-mono);
  font-size: 0.8rem;
}

.balance-value {
  color: var(--accent-green);
  font-weight: 600;
}

.balance-currency {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-left: 3px;
}

.balance-disabled {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.error-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--accent-red);
}

.error-state p {
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.billing-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.section-title {
  font-size: 0.85rem;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 600;
}

.form-textarea {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  color: var(--text-primary);
  font-size: 0.8rem;
  font-family: var(--font-mono);
  resize: vertical;
  outline: none;
}

.form-textarea:focus {
  border-color: var(--accent-blue);
}

.models-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.model-entry {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-name-input {
  flex: 1;
  min-width: 0;
}

.model-type-select {
  width: 120px;
  flex-shrink: 0;
}

.model-remove-btn {
  flex-shrink: 0;
}

.model-remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
}

.btn-add-model {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 6px 12px;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
