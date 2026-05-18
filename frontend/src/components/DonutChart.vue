<template>
  <div class="donut-wrapper">
    <svg
      v-if="data.length"
      :viewBox="`0 0 ${size} ${size}`"
      :width="size"
      :height="size"
      class="donut-svg"
    >
      <!-- Background circle -->
      <circle
        :cx="cx"
        :cy="cy"
        :r="radius"
        fill="none"
        stroke="var(--border-subtle)"
        :stroke-width="thickness"
      />
      <!-- Segments -->
      <circle
        v-for="(d, i) in segments"
        :key="'seg-' + i"
        :cx="cx"
        :cy="cy"
        :r="radius"
        fill="none"
        :stroke="d.color"
        :stroke-width="thickness"
        :stroke-dasharray="`${d.dashLen} ${circumference}`"
        :stroke-dashoffset="d.dashOffset"
        transform="rotate(-90, cx, cy)"
        class="segment"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
      />
      <!-- Center text -->
      <text :x="cx" :y="cy - 4" class="center-value" text-anchor="middle">{{ totalFormatted }}</text>
      <text :x="cx" :y="cy + 11" class="center-label" text-anchor="middle">总计</text>
    </svg>
    <div v-else class="donut-empty">暂无数据</div>
    <!-- Legend -->
    <div v-if="data.length" class="legend">
      <div
        v-for="(d, i) in data"
        :key="'leg-' + i"
        :class="['legend-item', { 'legend-hover': hovered === i }]"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
      >
        <span class="legend-dot" :style="{ background: segmentColors[i % segmentColors.length] }"></span>
        <span class="legend-label">{{ d.label }}</span>
        <span class="legend-value">{{ formatValue(d.value) }}</span>
        <span class="legend-pct">{{ percentage(d.value) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
  data: { label: string; value: number }[]
  size?: number
  thickness?: number
}>(), {
  size: 200,
  thickness: 24,
});

const segmentColors = [
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-orange)',
  'var(--accent-red)',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

const hovered = ref<number | null>(null);

const cx = computed(() => props.size / 2);
const cy = computed(() => props.size / 2);
const radius = computed(() => (props.size - props.thickness) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);

const total = computed(() => props.data.reduce((s, d) => s + d.value, 0));

const totalFormatted = computed(() => {
  const v = total.value;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
});

const segments = computed(() => {
  let offset = 0;
  return props.data.map((d, i) => {
    const ratio = total.value > 0 ? d.value / total.value : 0;
    const dashLen = ratio * circumference.value;
    const seg = {
      color: segmentColors[i % segmentColors.length],
      dashLen,
      dashOffset: -offset,
    };
    offset += dashLen;
    return seg;
  });
});

const percentage = (v: number) => {
  if (total.value === 0) return 0;
  return ((v / total.value) * 100).toFixed(1);
};

const formatValue = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
};
</script>

<style scoped>
.donut-wrapper {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.donut-svg {
  flex-shrink: 0;
}

.segment {
  cursor: pointer;
  transition: opacity 0.2s;
}

.segment:hover {
  opacity: 0.8;
}

.center-value {
  fill: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-sans);
}

.center-label {
  fill: var(--text-muted);
  font-size: 10px;
  font-family: var(--font-sans);
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.75rem;
}

.legend-hover {
  background: var(--bg-card-hover);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legend-value {
  color: var(--text-secondary);
  font-weight: 500;
}

.legend-pct {
  color: var(--text-muted);
  font-size: 0.7rem;
  width: 40px;
  text-align: right;
}

.donut-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
