<template>
  <span
    v-if="svgContent"
    class="model-icon-inline"
    :style="{ width: size + 'px', height: size + 'px', color: iconColor }"
    v-html="svgContent"
  ></span>
  <span v-else class="model-icon-placeholder" :style="{ width: size + 'px', height: size + 'px' }"></span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getIconInfo } from '../utils/icons';

const props = withDefaults(defineProps<{
  name: string;
  size?: number;
}>(), {
  size: 18,
});

const CDN_PREFIX = 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons';
const svgContent = ref('');
const iconColor = ref('');

const loadIcon = async () => {
  const info = getIconInfo(props.name);
  if (!info) {
    svgContent.value = '';
    return;
  }
  iconColor.value = info.color;
  try {
    const res = await fetch(`${CDN_PREFIX}/${info.slug}.svg`);
    if (!res.ok) throw new Error('Icon not found');
    const raw = await res.text();
    svgContent.value = raw.replace(
      /fill="currentColor"/g,
      `fill="${info.color}"`,
    );
  } catch {
    svgContent.value = '';
  }
};

onMounted(loadIcon);
watch(() => props.name, loadIcon);
</script>

<style scoped>
.model-icon-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
}

.model-icon-inline :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.model-icon-placeholder {
  display: inline-block;
  flex-shrink: 0;
  background: var(--border-subtle);
  border-radius: 4px;
  vertical-align: middle;
}
</style>
