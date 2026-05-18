<template>
  <div :class="['skeleton-wrapper', type]">
    <div v-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-row" v-for="i in rows" :key="i">
        <div class="skeleton-cell" v-for="j in cols" :key="j"></div>
      </div>
    </div>
    <div v-else-if="type === 'card'" class="skeleton-cards">
      <div class="skeleton-card" v-for="i in rows" :key="i">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line long"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'table' | 'card'
  rows?: number
  cols?: number
}>(), {
  type: 'table',
  rows: 5,
  cols: 5,
});
</script>

<style scoped>
.skeleton-wrapper {
  width: 100%;
}

.skeleton-line {
  height: 14px;
  background: var(--border-subtle);
  border-radius: 6px;
  margin-bottom: 12px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line.short {
  width: 40%;
}

.skeleton-line.long {
  width: 80%;
}

.skeleton-table {
  padding: 16px;
}

.skeleton-row {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.skeleton-cell {
  flex: 1;
  height: 14px;
  background: var(--border-subtle);
  border-radius: 4px;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.skeleton-card {
  padding: 20px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}
</style>
