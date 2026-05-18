<template>
  <div class="chart-wrapper">
    <svg
      v-if="data.length"
      :viewBox="`0 0 ${svgWidth} ${height}`"
      preserveAspectRatio="xMidYMid meet"
      class="bar-chart"
    >
      <!-- Grid lines -->
      <line
        v-for="(y, i) in gridLines"
        :key="'grid-' + i"
        :x1="padding.left"
        :y1="y"
        :x2="svgWidth - padding.right"
        :y2="y"
        class="grid-line"
      />
      <!-- Y-axis labels -->
      <text
        v-for="(label, i) in yLabels"
        :key="'ylabel-' + i"
        :x="padding.left - 8"
        :y="gridLines[i] + 4"
        class="axis-label-y"
        text-anchor="end"
      >{{ label }}</text>
      <!-- Bars -->
      <g
        v-for="(d, i) in data"
        :key="'bar-' + i"
        class="bar-group"
        @mouseenter="hovered = i"
        @mouseleave="hovered = null"
      >
        <rect
          :x="barX(i)"
          :y="barY(d.value)"
          :width="barWidth"
          :height="barH(d.value)"
          :rx="3"
          :ry="3"
          :class="['bar', { 'bar-hover': hovered === i }]"
          :style="{ '--bar-color': barColor }"
        />
        <text
          :x="barX(i) + barWidth / 2"
          :y="height - padding.bottom + 12"
          class="axis-label-x"
          text-anchor="end"
          :transform="`rotate(-40, ${barX(i) + barWidth / 2}, ${height - padding.bottom + 12})`"
        >{{ d.label }}</text>
      </g>
      <!-- Tooltip -->
      <g v-if="hovered !== null && data[hovered]">
        <rect
          :x="tooltipX"
          y="6"
          :width="tooltipW"
          height="32"
          class="tooltip-bg"
          rx="5"
        />
        <text :x="tooltipX + 10" y="21" class="tooltip-label">{{ data[hovered].label }}</text>
        <text :x="tooltipX + 10" y="32" class="tooltip-value">{{ formatValue(data[hovered].value) }}</text>
      </g>
    </svg>
    <div v-else class="chart-empty">暂无数据</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(defineProps<{
  data: { label: string; value: number }[]
  height?: number
  barColor?: string
}>(), {
  height: 240,
  barColor: 'var(--accent-blue)',
});

const padding = { top: 12, right: 12, bottom: 44, left: 40 };
const hovered = ref<number | null>(null);

const svgWidth = computed(() => {
  const count = props.data.length;
  return Math.max(400, count * 40);
});

const maxValue = computed(() => Math.max(...props.data.map((d) => d.value), 1));

const gridLines = computed(() => {
  const step = Math.ceil(maxValue.value / 4);
  const steps = [];
  for (let i = 0; i <= 4; i++) {
    steps.push(step * i);
  }
  return steps.map((v) => {
    const ratio = v / maxValue.value;
    return padding.top + (props.height - padding.top - padding.bottom) * (1 - ratio);
  });
});

const yLabels = computed(() => {
  const step = Math.ceil(maxValue.value / 4);
  const labels: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const val = step * i;
    labels.push(formatValue(val));
  }
  return labels;
});

const availableWidth = computed(() => svgWidth.value - padding.left - padding.right);
const barWidth = computed(() => {
  return Math.max(8, Math.min(32, (availableWidth.value - props.data.length * 4) / props.data.length));
});

const barX = (i: number) => {
  const gap = 4;
  return padding.left + i * (barWidth.value + gap);
};

const barY = (val: number) => {
  const ratio = val / maxValue.value;
  return padding.top + (props.height - padding.top - padding.bottom) * (1 - ratio);
};

const barH = (val: number) => {
  const ratio = val / maxValue.value;
  return (props.height - padding.top - padding.bottom) * ratio;
};

const tooltipX = computed(() => {
  if (hovered.value === null) return 0;
  const x = barX(hovered.value) + barWidth.value / 2 - tooltipW.value / 2;
  return Math.max(4, Math.min(x, svgWidth.value - tooltipW.value - 4));
});

const tooltipW = computed(() => 140);

const formatValue = (v: number) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
};
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.bar-chart {
  width: 100%;
  height: 100%;
}

.grid-line {
  stroke: var(--border-subtle);
  stroke-width: 1;
}

.axis-label-y {
  fill: var(--text-muted);
  font-size: 10px;
  font-family: var(--font-sans);
}

.axis-label-x {
  fill: var(--text-muted);
  font-size: 9px;
  font-family: var(--font-sans);
}

.bar {
  fill: var(--bar-color, var(--accent-blue));
  opacity: 0.7;
  transition: opacity 0.2s;
  cursor: pointer;
}

.bar-hover {
  opacity: 1;
}

.tooltip-bg {
  fill: var(--bg-card);
  stroke: var(--border-subtle);
  stroke-width: 1;
}

.tooltip-label {
  fill: var(--text-muted);
  font-size: 10px;
  font-family: var(--font-sans);
}

.tooltip-value {
  fill: var(--text-primary);
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-sans);
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
