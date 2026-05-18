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

    <DataTable :columns="columns" :data="channels" empty-text="暂无渠道数据">
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
          <span v-if="testResults[(row as any).id!]" :class="['test-result', testResults[(row as any).id!].success ? 'success' : 'error']">
            {{ testResults[(row as any).id!].success ? testResults[(row as any).id!].latency + 'ms' : '!' }}
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

    <!-- Custom Modal -->
    <Modal :visible="dialogVisible" :title="form.id ? '编辑渠道' : '添加渠道'" width="560px" @close="dialogVisible = false">
      <div class="form-row">
        <FormInput v-model="form.name" label="渠道名称" placeholder="例如：OpenAI 主渠道" />
        <div class="form-group">
          <label class="form-label">类型</label>
          <SelectField v-model="form.type" :options="providerOptions" :allow-custom="true" />
        </div>
      </div>
      <FormInput v-model="form.baseUrl" label="基础 URL" placeholder="https://api.openai.com" />
      <FormInput v-model="form.apiKey" label="API 密钥" type="password" :placeholder="form.id ? '留空则不修改密钥' : 'sk-...'" />
      <FormInput v-model="form.models" label="支持的模型 (逗号分隔)" placeholder="gpt-4,gpt-3.5-turbo" />
      <FormTextarea v-model="formModelTypes" label="模型类型 (JSON 格式)" :rows="3" placeholder='{"gpt-4":"text","dall-e-3":"image"}' hint="可选类型: text, image, video, audio。不填则默认为 text。" />
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
      <template #footer>
        <button class="btn-ghost" @click="dialogVisible = false">取消</button>
        <button class="btn-primary" @click="saveChannel">保存渠道</button>
      </template>
    </Modal>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      v-model:visible="confirmVisible"
      title="删除渠道"
      message="确定要删除该渠道吗？此操作不可恢复。"
      confirm-text="删除"
      type="danger"
      @confirm="doDeleteChannel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import type { Channel } from '../types';
import DataTable from '../components/DataTable.vue';
import type { ColumnDef } from '../components/DataTable.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import SelectField from '../components/SelectField.vue';
import FormInput from '../components/FormInput.vue';
import FormNumber from '../components/FormNumber.vue';
import FormTextarea from '../components/FormTextarea.vue';
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

const channels = ref<Channel[]>([]);
const dialogVisible = ref(false);
const confirmVisible = ref(false);
const deletingId = ref<number | null>(null);
const testingSet = ref<Set<number>>(new Set());
const testResults = ref<Record<number, { success: boolean; latency: number; error?: string }>>({});
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
});
const toast = useToast();
const authStore = useAuthStore();

const columns: ColumnDef[] = [
  { key: 'type', label: '提供商' },
  { key: 'status', label: '状态' },
  { key: 'visibility', label: '可见性' },
  { key: 'baseUrl', label: '基础 URL' },
  { key: 'models', label: '模型' },
  { key: 'weight', label: '权重' },
  { key: 'actions', label: '操作', align: 'right' },
];

const maxWeight = computed(() => Math.max(...channels.value.map((c) => c.weight), 1));
const formModelTypes = computed({
  get: () => form.value.modelTypes ?? '',
  set: (value: string) => {
    form.value.modelTypes = value;
  },
});
const formVisibility = computed({
  get: () => form.value.visibility ?? 'private',
  set: (value: string) => {
    form.value.visibility = value;
  },
});

const canEdit = (row: Channel) => {
  return row.userId === authStore.user?.id;
};

const fetchChannels = async () => {
  const res = await api.get('/channels');
  channels.value = res.data;
};

const openDialog = (row: Channel | null = null) => {
  if (row) {
    form.value = { ...row };
    // Clear apiKey — backend will keep the existing key if a new one is not provided
    form.value.apiKey = '';
  } else {
    form.value = {
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
    };
  }
  dialogVisible.value = true;
};

const saveChannel = async () => {
  try {
    if (form.value.id) {
      await api.patch(`/channels/${form.value.id}`, form.value);
    } else {
      const { id, ...createData } = form.value;
      await api.post('/channels', createData);
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

/* Weight Bar */
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

/* Test Button */
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

/* Modal Styles */
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

/* Visibility tag */
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
</style>
