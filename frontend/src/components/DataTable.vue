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
            >{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in data" :key="(row as any).id ?? idx">
            <td
              v-for="col in columns"
              :key="col.key"
              :style="{ textAlign: col.align || 'left' }"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="(row as any)[col.key]">
                {{ (row as any)[col.key] }}
              </slot>
            </td>
          </tr>
          <tr v-if="!data.length">
            <td :colspan="columns.length" class="empty-cell">
              {{ emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
export interface ColumnDef {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: string
}

withDefaults(defineProps<{
  columns: ColumnDef[]
  data: Record<string, any>[]
  emptyText?: string
}>(), {
  emptyText: '暂无数据',
});
</script>

<style scoped>
.table-card {
  overflow: hidden;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.custom-table th {
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle);
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
</style>
