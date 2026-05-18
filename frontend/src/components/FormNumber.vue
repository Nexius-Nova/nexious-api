<template>
  <div class="form-group">
    <label v-if="label" class="form-label" :for="uid">{{ label }}</label>
    <div class="number-wrap" :class="{ 'number-wrap-disabled': disabled }">
      <button
        type="button"
        class="number-btn"
        :disabled="disabled || isAtMin"
        aria-label="减少"
        @click="decrement"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <input
        :id="uid"
        :value="displayValue"
        type="text"
        inputmode="numeric"
        class="number-input"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @keydown="onKeydown"
        @blur="onBlur"
      />
      <button
        type="button"
        class="number-btn"
        :disabled="disabled || isAtMax"
        aria-label="增加"
        @click="increment"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
    <p v-if="hint && !error" class="form-hint">{{ hint }}</p>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: number
  label?: string
  placeholder?: string
  disabled?: boolean
  hint?: string
  error?: string
  min?: number
  max?: number
  step?: number
}>(), {
  disabled: false,
  step: 1,
});

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>();

const uid = computed(() => `fn-${Math.random().toString(36).slice(2, 8)}`);
const displayValue = ref(String(props.modelValue));

watch(() => props.modelValue, (val) => {
  displayValue.value = String(val);
});

const isAtMin = computed(() => props.min !== undefined && props.modelValue <= props.min);
const isAtMax = computed(() => props.max !== undefined && props.modelValue >= props.max);

function clamp(val: number): number {
  if (props.min !== undefined && val < props.min) return props.min;
  if (props.max !== undefined && val > props.max) return props.max;
  return val;
}

function emitValue(val: number) {
  const clamped = clamp(val);
  displayValue.value = String(clamped);
  emit('update:modelValue', clamped);
}

function increment() {
  emitValue(props.modelValue + props.step);
}

function decrement() {
  emitValue(props.modelValue - props.step);
}

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  // Allow minus only at start for negative numbers
  const sanitized = raw.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, '').replace(/^-{2,}/, '-');
  displayValue.value = sanitized;

  const parsed = Number(sanitized);
  if (sanitized === '' || sanitized === '-') {
    // Still typing — defer emit until blur or a valid number
    return;
  }
  if (!isNaN(parsed)) {
    const clamped = clamp(parsed);
    if (clamped !== props.modelValue) {
      emit('update:modelValue', clamped);
    }
  }
}

function onBlur() {
  const parsed = Number(displayValue.value);
  if (displayValue.value === '' || displayValue.value === '-' || isNaN(parsed)) {
    // Reset to current valid value
    displayValue.value = String(props.modelValue);
  } else {
    const clamped = clamp(parsed);
    displayValue.value = String(clamped);
    if (clamped !== props.modelValue) {
      emit('update:modelValue', clamped);
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  const allowed = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Tab', 'Home', 'End', 'Enter', 'Escape',
  ];
  if (allowed.includes(e.key)) return;

  // Allow digits
  if (/^[0-9]$/.test(e.key)) return;

  // Allow minus only at the very beginning
  if (e.key === '-' && (e.target as HTMLInputElement).selectionStart === 0 && !displayValue.value.includes('-')) {
    return;
  }

  // Allow Ctrl/Cmd + A/C/V/X for select/copy/paste
  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;

  e.preventDefault();
}
</script>

<style scoped>
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

.number-wrap {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  overflow: hidden;
  transition: border-color 0.2s;
}

.number-wrap:focus-within {
  border-color: var(--accent-blue);
}

.number-wrap-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.number-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  flex-shrink: 0;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.number-btn:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--bg-card-hover);
}

.number-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.number-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  padding: 10px 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.875rem;
  text-align: center;
  outline: none;
}

.number-input:disabled {
  cursor: not-allowed;
}

.form-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.form-error {
  font-size: 0.8rem;
  color: var(--accent-red);
  margin-top: 6px;
}
</style>
