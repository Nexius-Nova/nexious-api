<template>
  <div class="table-card glass-panel">
    <div class="table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="{ textAlign: col.align || 'left', width: col.width }"
              :class="{ sortable: col.sortable !== false }"
              :aria-sort="getAriaSort(col)"
              @click="col.sortable !== false && toggleSort(col.key)"
            >
              <span class="th-content" :class="`align-${col.align || 'left'}`">
                <span>{{ col.label }}</span>
                <span
                  v-if="col.sortable !== false"
                  class="sort-indicator"
                  :class="{
                    active: sortBy === col.key,
                    asc: sortBy === col.key && sortOrder === 'asc',
                    desc: sortBy === col.key && sortOrder === 'desc',
                  }"
                  aria-hidden="true"
                ></span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="'skel-' + i">
              <td
                v-for="col in columns"
                :key="col.key"
                :style="{ textAlign: col.align || 'left' }"
                :data-label="col.label"
              >
                <div class="skeleton-cell"></div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="(row, idx) in sortedData" :key="(row as any).id ?? `row-${idx}`">
              <td
                v-for="col in columns"
                :key="col.key"
                :style="{ textAlign: col.align || 'left' }"
                :data-label="col.label"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="(row as any)[col.key]">
                  {{ (row as any)[col.key] }}
                </slot>
              </td>
            </tr>
            <tr v-if="!data.length && !loading">
              <td :colspan="columns.length" class="empty-cell">
                {{ emptyText }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export interface ColumnDef {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: string
  sortable?: boolean
  sortKey?: string
}

const props = withDefaults(defineProps<{
  columns: ColumnDef[]
  data: Record<string, any>[]
  emptyText?: string
  loading?: boolean
  skeletonRows?: number
}>(), {
  emptyText: '暂无数据',
  loading: false,
  skeletonRows: 5,
});

const sortBy = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');

const emit = defineEmits<{
  sort: [key: string, order: 'asc' | 'desc']
}>();

const sortedData = computed(() => {
  if (!sortBy.value) return props.data;
  const column = props.columns.find((col) => col.key === sortBy.value);
  if (!column || column.sortable === false) return props.data;

  const key = column.sortKey || column.key;
  const direction = sortOrder.value === 'asc' ? 1 : -1;

  return [...props.data].sort((a, b) => compareValues(readValue(a, key), readValue(b, key)) * direction);
});

function toggleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = key;
    sortOrder.value = 'asc';
  }
  emit('sort', sortBy.value, sortOrder.value);
}

function readValue(row: Record<string, any>, key: string) {
  return key.split('.').reduce((value, part) => value?.[part], row);
}

function compareValues(a: any, b: any) {
  const left = normalizeSortValue(a);
  const right = normalizeSortValue(b);

  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right), 'zh-CN', {
    numeric: true,
    sensitivity: 'base',
  });
}

function normalizeSortValue(value: any) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'boolean') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : trimmed.toLowerCase();
  }
  if (typeof value === 'object') {
    return value.name ?? value.username ?? value.label ?? value.id ?? JSON.stringify(value);
  }
  return value;
}

function getAriaSort(col: ColumnDef) {
  if (col.sortable === false) return undefined;
  if (sortBy.value !== col.key) return 'none';
  return sortOrder.value === 'asc' ? 'ascending' : 'descending';
}
</script>

<style scoped>
.table-card {
  overflow: hidden;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.custom-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  text-align: left;
}

.custom-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg-card);
}

.custom-table th {
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-card);
}

.custom-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.custom-table th.sortable:hover {
  color: var(--text-primary);
}

.th-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.th-content.align-right {
  justify-content: flex-end;
}

.th-content.align-center {
  justify-content: center;
}

.sort-indicator {
  position: relative;
  width: 10px;
  height: 14px;
  flex: 0 0 10px;
  opacity: 0.35;
}

.sort-indicator::before,
.sort-indicator::after {
  content: '';
  position: absolute;
  left: 2px;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
}

.sort-indicator::before {
  top: 1px;
  border-bottom: 4px solid currentColor;
}

.sort-indicator::after {
  bottom: 1px;
  border-top: 4px solid currentColor;
}

.sort-indicator.active {
  opacity: 1;
  color: var(--accent-blue);
}

.sort-indicator.asc::after,
.sort-indicator.desc::before {
  opacity: 0.25;
}

.custom-table td {
  padding: 16px;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.custom-table tbody tr:last-child td {
  border-bottom: none;
}

.custom-table tr:hover td {
  background: rgba(59, 130, 246, 0.02);
  color: var(--text-primary);
}

.empty-cell {
  text-align: center !important;
  padding: 40px 16px !important;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.skeleton-cell {
  height: 14px;
  background: var(--border-subtle);
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}

@media (max-width: 720px) {
  .table-card {
    overflow: visible;
  }

  .table-container {
    overflow-x: visible;
  }

  .custom-table,
  .custom-table thead,
  .custom-table tbody,
  .custom-table tr,
  .custom-table th,
  .custom-table td {
    display: block;
  }

  .custom-table {
    min-width: 0;
  }

  .custom-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .custom-table tbody {
    display: grid;
    gap: 10px;
    padding: 10px;
  }

  .custom-table tbody tr {
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    overflow: hidden;
  }

  .custom-table td {
    display: grid;
    grid-template-columns: minmax(88px, 35%) minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 10px 12px;
    text-align: left !important;
  }

  .custom-table td::before {
    content: attr(data-label);
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .custom-table td[data-label=''] {
    grid-template-columns: 1fr;
  }

  .custom-table td[data-label='']::before,
  .custom-table td.empty-cell::before {
    content: none;
  }

  .custom-table tr:hover td {
    background: transparent;
  }

  .empty-cell {
    display: block !important;
    padding: 28px 16px !important;
  }
}
</style>
