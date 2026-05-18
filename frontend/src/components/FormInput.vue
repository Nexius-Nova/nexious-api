<template>
  <div class="form-group">
    <label v-if="label" class="form-label" :for="uid">{{ label }}</label>
    <input
      :id="uid"
      :value="modelValue"
      :type="type"
      class="form-input"
      :class="{ 'form-input-error': error }"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :required="required"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="hint && !error" class="form-hint">{{ hint }}</p>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  autocomplete?: string
  required?: boolean
  hint?: string
  error?: string
}>(), {
  type: 'text',
  disabled: false,
  required: false,
});

defineEmits<{
  'update:modelValue': [value: string]
}>();

let uidCounter = 0;
const uid = computed(() => `fi-${props.label?.replace(/\s/g, '') || 'input'}-${++uidCounter}`);
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

.form-input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--accent-blue);
}

.form-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.form-input-error {
  border-color: var(--accent-red);
}

.form-input-error:focus {
  border-color: var(--accent-red);
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
