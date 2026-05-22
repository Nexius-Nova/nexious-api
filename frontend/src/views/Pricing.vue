<template>
  <div class="pricing-page animate-fade-in">
    <div class="view-header">
      <div class="header-text">
        <h2>模型定价</h2>
        <p>配置每个渠道下每个模型的价格（每 1M tokens），用于计算请求金额。</p>
      </div>
      <button class="btn-primary" @click="openDialog()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        添加定价
      </button>
    </div>

    <DataTable :columns="columns" :data="pricings" empty-text="暂无定价配置">
      <template #cell-channel="{ row }">
        <span class="channel-name">{{ row.channel?.name || '渠道 #' + row.channelId }}</span>
      </template>
      <template #cell-inputPricePer1M="{ row }">
        <code class="price-code">${{ formatPrice(row.inputPricePer1M) }} / 1M</code>
      </template>
      <template #cell-outputPricePer1M="{ row }">
        <code class="price-code">${{ formatPrice(row.outputPricePer1M) }} / 1M</code>
      </template>
      <template #cell-currency="{ row }">
        <span class="currency-tag">{{ row.currency }}</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="actions">
          <button class="icon-btn-sm" @click="openDialog(row as any)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn-sm danger" @click="deletePricing(row as any)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modal -->
    <Modal :visible="dialogVisible" :title="form.id ? '编辑定价' : '添加定价'" width="480px" @close="dialogVisible = false">
      <div class="form-group">
        <label class="form-label">渠道</label>
        <SelectField v-model="formChannelId" :options="channelOptions" placeholder="选择渠道" />
      </div>

      <!-- Model pricing entries -->
      <div class="form-group">
        <label class="form-label">{{ form.id ? '模型' : '模型定价（可批量添加）' }}</label>
        <div class="pricing-entries">
          <div v-for="(entry, index) in pricingEntries" :key="index" class="pricing-entry">
            <SelectField
              v-model="entry.model"
              :options="currentChannelModels"
              placeholder="选择模型"
              :allow-custom="true"
              class="pricing-model-input"
            />
            <input
              v-model="entry.inputPrice"
              class="form-input pricing-price-input"
              placeholder="输入价"
            />
            <input
              v-model="entry.outputPrice"
              class="form-input pricing-price-input"
              placeholder="输出价"
            />
            <button class="icon-btn-sm pricing-remove-btn" @click="pricingEntries.splice(index, 1)" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <button v-if="!form.id" class="btn-ghost btn-add-pricing" @click="pricingEntries.push({ model: '', inputPrice: '0', outputPrice: '0' })" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加模型
        </button>
        <p v-if="!form.id" class="form-hint">{{ modelCountHint }}</p>
      </div>
      <div class="form-group">
        <label class="form-label">币种</label>
        <SelectField v-model="form.currency" :options="currencyOptions" placeholder="USD" :allow-custom="true" search-placeholder="搜索或输入自定义币种..." />
      </div>
      <template #footer>
        <button class="btn-ghost" @click="dialogVisible = false">取消</button>
        <button class="btn-primary" @click="savePricing" :disabled="saving">
          <span v-if="saving" class="spinner-sm"></span>
          {{ saving ? '保存中...' : '保存定价' }}
        </button>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:visible="confirmVisible"
      title="删除定价"
      message="确定要删除该定价配置吗？"
      confirm-text="删除"
      type="danger"
      @confirm="doDeletePricing"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { pricingApi } from '../api/pricing';
import api from '../api';
import type { ModelPricing, Channel } from '../types';
import DataTable from '../components/DataTable.vue';
import type { ColumnDef } from '../components/DataTable.vue';
import Modal from '../components/Modal.vue';
import SelectField from '../components/SelectField.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useToast } from '../composables/useToast';

const toast = useToast();
const pricings = ref<ModelPricing[]>([]);
const channels = ref<Channel[]>([]);
const dialogVisible = ref(false);
const confirmVisible = ref(false);
const deletingId = ref<number | null>(null);
const saving = ref(false);

interface PricingEntry {
  model: string;
  inputPrice: string;
  outputPrice: string;
}
const pricingEntries = ref<PricingEntry[]>([]);

const form = ref<ModelPricing>({
  id: null,
  channelId: 0,
  model: '',
  inputPricePer1M: '0',
  outputPricePer1M: '0',
  currency: 'USD',
});

const channelOptions = computed(() =>
  channels.value.map((ch) => ({
    value: String(ch.id),
    label: ch.name,
  })),
);

const currentChannelModels = computed(() => {
  const ch = channels.value.find(c => c.id === form.value.channelId);
  if (!ch || !ch.models) return [];
  return ch.models.split(',').map(m => {
    const trimmed = m.trim();
    return { value: trimmed, label: trimmed };
  });
});

const currencyOptions = [
  { value: 'USD', label: 'USD - 美元' },
  { value: 'CNY', label: 'CNY - 人民币' },
  { value: 'EUR', label: 'EUR - 欧元' },
  { value: 'GBP', label: 'GBP - 英镑' },
  { value: 'JPY', label: 'JPY - 日元' },
  { value: 'KRW', label: 'KRW - 韩元' },
];

const formChannelId = computed({
  get: () => String(form.value.channelId || ''),
  set: (v: string) => { form.value.channelId = Number(v) || 0; },
});

const columns: ColumnDef[] = [
  { key: 'channel', label: '渠道' },
  { key: 'model', label: '模型' },
  { key: 'inputPricePer1M', label: '输入价格' },
  { key: 'outputPricePer1M', label: '输出价格' },
  { key: 'currency', label: '币种' },
  { key: 'actions', label: '操作', align: 'right', sortable: false },
];

const modelCountHint = computed(() => {
  const count = pricingEntries.value.filter(e => e.model.trim()).length;
  if (count === 0) return '请输入至少一个模型名称';
  return `将创建 ${count} 条定价记录`;
});

const formatPrice = (value: number | string) => {
  const n = Number(value) || 0;
  if (n < 0.0001) return n.toExponential(2);
  return n.toFixed(6);
};

const fetchPricings = async () => {
  try {
    pricings.value = await pricingApi.list();
  } catch {}
};

const fetchChannels = async () => {
  try {
    const res = await api.get('/channels');
    channels.value = res.data;
  } catch {}
};

const openDialog = (row: ModelPricing | null = null) => {
  if (row) {
    form.value = { ...row };
    pricingEntries.value = [{
      model: row.model,
      inputPrice: String(row.inputPricePer1M || '0'),
      outputPrice: String(row.outputPricePer1M || '0'),
    }];
  } else {
    form.value = {
      id: null,
      channelId: channels.value[0]?.id! ?? 0,
      model: '',
      inputPricePer1M: '0',
      outputPricePer1M: '0',
      currency: 'USD',
    };
    pricingEntries.value = [{ model: '', inputPrice: '0', outputPrice: '0' }];
  }
  dialogVisible.value = true;
};

const cleanPayload = (raw: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const k of ['channelId', 'model', 'inputPricePer1M', 'outputPricePer1M', 'currency']) {
    if (k in raw) {
      out[k] = raw[k];
    }
  }
  return out;
};

const savePricing = async () => {
  saving.value = true;
  try {
    if (form.value.id) {
      const entry = pricingEntries.value[0];
      await pricingApi.update(form.value.id, {
        ...cleanPayload(form.value),
        model: entry.model,
        inputPricePer1M: entry.inputPrice,
        outputPricePer1M: entry.outputPrice,
      });
      toast.success('定价已更新');
    } else {
      const entries = pricingEntries.value.filter(e => e.model.trim());
      if (entries.length === 0) {
        toast.error('请输入至少一个模型名称');
        saving.value = false;
        return;
      }
      const base = cleanPayload(form.value);
      for (const entry of entries) {
        await pricingApi.create({
          ...base,
          model: entry.model.trim(),
          inputPricePer1M: entry.inputPrice,
          outputPricePer1M: entry.outputPrice,
        });
      }
      toast.success(`已创建 ${entries.length} 条定价`);
    }
    dialogVisible.value = false;
    fetchPricings();
  } catch {
    toast.error('保存失败');
  } finally {
    saving.value = false;
  }
};

const deletePricing = (row: ModelPricing) => {
  deletingId.value = row.id;
  confirmVisible.value = true;
};

const doDeletePricing = async () => {
  if (deletingId.value === null) return;
  try {
    await pricingApi.remove(deletingId.value);
    deletingId.value = null;
    fetchPricings();
    toast.success('定价已删除');
  } catch {
    toast.error('删除失败');
  }
};

onMounted(() => {
  Promise.all([fetchPricings(), fetchChannels()]);
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

.channel-name {
  color: var(--text-primary);
  font-weight: 500;
}

.price-code {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--accent-green);
  font-weight: 600;
}

.currency-tag {
  display: inline-block;
  font-size: 0.73rem;
  color: var(--text-secondary);
  background: var(--bg-input);
  padding: 2px 8px;
  border-radius: 4px;
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
  cursor: pointer;
  border: none;
  background: transparent;
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

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* Pricing entries */
.pricing-entries {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.pricing-entry {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pricing-model-input {
  flex: 1;
  min-width: 0;
}

.pricing-price-input {
  width: 100px;
  flex-shrink: 0;
}

.pricing-remove-btn {
  flex-shrink: 0;
}

.pricing-remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
}

.btn-add-pricing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 6px 12px;
}

.form-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
