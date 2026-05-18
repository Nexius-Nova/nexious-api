<template>
  <div class="progress-wrapper" :class="size">
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: percentage + '%', background: fillColor }"
      ></div>
    </div>
    <span v-if="label" class="progress-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  value: number
  max: number
  label?: string
  size?: 'sm' | 'md'
}>(), {
  size: 'sm',
});

const percentage = computed(() => {
  if (props.max <= 0) return 0;
  return Math.min(100, Math.round((props.value / props.max) * 100));
});

const fillColor = computed(() => {
  if (percentage.value > 85) return 'var(--accent-red)';
  if (percentage.value > 60) return 'var(--accent-orange)';
  return 'var(--accent-green)';
});
</script>

<style scoped>
.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  background: var(--bg-input);
  border-radius: 20px;
  overflow: hidden;
}

.sm .progress-bar {
  height: 6px;
}

.md .progress-bar {
  height: 10px;
}

.progress-fill {
  height: 100%;
  border-radius: 20px;
  transition: width 0.4s ease, background 0.3s;
  min-width: 0;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 36px;
  text-align: right;
}
</style>
