<template>
  <div class="form-group">
    <label v-if="label" class="form-label" :for="uid">{{ label }}</label>
    <textarea
      :id="uid"
      :value="modelValue"
      class="form-textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    ></textarea>
    <p v-if="hint && !error" class="form-hint">{{ hint }}</p>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

withDefaults(defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  hint?: string
  error?: string
}>(), {
  disabled: false,
  rows: 4,
});

defineEmits<{
  'update:modelValue': [value: string]
}>();

const uid = computed(() => `fta-${Math.random().toString(36).slice(2, 8)}`);
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

.form-textarea {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.6;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: var(--accent-blue);
}

.form-textarea:disabled {
  opacity: 0.55;
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
