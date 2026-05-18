<template>
  <div class="switch-container">
    <label class="switch">
      <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)">
      <span class="slider"></span>
    </label>
    <span v-if="label" class="switch-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label?: string
}>();

defineEmits<{
  'update:modelValue': [value: boolean]
}>();
</script>

<style scoped>
.switch-container {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-input);
  transition: .4s;
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: var(--text-muted);
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--accent-blue);
  border-color: var(--accent-blue);
}

input:checked + .slider:before {
  transform: translateX(20px);
  background-color: white;
}

.switch-label {
  font-size: 0.85rem;
}
</style>
