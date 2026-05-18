<template>
  <div class="custom-select" ref="wrapperRef">
    <div
      class="select-trigger"
      :class="{ focused, open: isOpen }"
      @click="toggle"
    >
      <span class="select-value" :class="{ placeholder: !modelValue }">{{ displayText }}</span>
      <svg class="select-chevron" :class="{ rotated: isOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <Transition name="drop">
      <div v-if="isOpen" class="select-dropdown glass-panel">
        <input
          v-if="allowCustom"
          ref="searchInput"
          v-model="searchText"
          class="dropdown-search"
          :placeholder="searchPlaceholder"
          @keydown.enter.prevent="commitCustom"
          @click.stop
        />
        <div
          v-for="opt in filteredOptions"
          :key="opt.value"
          class="select-option"
          :class="{ selected: modelValue === opt.value }"
          @click="select(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <svg v-if="modelValue === opt.value" class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div v-if="allowCustom && searchText && !filteredOptions.length" class="dropdown-custom-hint" @click="commitCustom">
          使用 "{{ searchText }}"
        </div>
        <div v-if="!allowCustom && !options.length" class="dropdown-empty">无可用选项</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  placeholder?: string
  allowCustom?: boolean
  searchPlaceholder?: string
}>(), {
  placeholder: '请选择',
  allowCustom: false,
  searchPlaceholder: '搜索或输入自定义...',
});

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>();

const isOpen = ref(false);
const focused = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const searchText = ref('');

const displayText = computed(() => {
  if (!props.modelValue) return props.placeholder;
  const opt = props.options.find((o) => o.value === props.modelValue);
  return opt ? opt.label : props.modelValue;
});

const filteredOptions = computed(() => {
  if (!searchText.value) return props.options;
  const q = searchText.value.toLowerCase();
  return props.options.filter(o => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q));
});

const toggle = () => {
  isOpen.value = !isOpen.value;
  focused.value = isOpen.value;
  if (isOpen.value && props.allowCustom) {
    searchText.value = '';
    nextTick(() => searchInput.value?.focus());
  }
};

const select = (value: string) => {
  emit('update:modelValue', value);
  searchText.value = '';
  isOpen.value = false;
  focused.value = false;
};

const commitCustom = () => {
  const val = searchText.value.trim();
  if (val) {
    emit('update:modelValue', val);
  }
  searchText.value = '';
  isOpen.value = false;
  focused.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    isOpen.value = false;
    focused.value = false;
    searchText.value = '';
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s;
}

.select-trigger:hover {
  border-color: var(--text-muted);
}

.select-trigger.focused,
.select-trigger.open {
  border-color: var(--accent-blue);
}

.select-value {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-value.placeholder {
  color: var(--text-muted);
}

.select-chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.select-chevron.rotated {
  transform: rotate(180deg);
}

/* Dropdown panel */
.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 260px;
  overflow-y: auto;
  background: var(--bg-card);
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.dropdown-search {
  width: 100%;
  padding: 7px 10px;
  margin-bottom: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}

.dropdown-search:focus {
  border-color: var(--accent-blue);
}

.dropdown-custom-hint {
  padding: 8px 12px;
  font-size: 0.8rem;
  color: var(--accent-blue);
  cursor: pointer;
  border-radius: 6px;
  text-align: center;
}

.dropdown-custom-hint:hover {
  background: rgba(59, 130, 246, 0.08);
}

.dropdown-empty {
  padding: 12px;
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s;
}

.select-option:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.select-option.selected {
  color: var(--accent-blue);
  font-weight: 500;
  background: rgba(59, 130, 246, 0.08);
}

.check-icon {
  flex-shrink: 0;
  color: var(--accent-blue);
}

/* Transition */
.drop-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.drop-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
