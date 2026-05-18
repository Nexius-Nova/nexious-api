<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay" @click.self="onCancel">
      <div class="confirm-dialog glass-panel animate-fade-in">
        <div class="confirm-header">
          <div class="confirm-icon" :class="type">
            <svg v-if="type === 'danger'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <h3 class="confirm-title">{{ title }}</h3>
        </div>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-footer">
          <button class="btn-ghost" @click="onCancel">取消</button>
          <button :class="['btn-primary', type === 'danger' ? 'btn-danger' : '']" @click="onConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  message: string
  confirmText?: string
  type?: 'danger' | 'warning'
}>(), {
  title: '确认操作',
  confirmText: '确定',
  type: 'danger',
});

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:visible': [value: boolean]
}>();

const onConfirm = () => {
  emit('confirm');
  emit('update:visible', false);
};

const onCancel = () => {
  emit('cancel');
  emit('update:visible', false);
};
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.confirm-dialog {
  width: 380px;
  max-width: 90vw;
  background: var(--bg-card);
  padding: 28px;
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.confirm-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-icon.danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
}

.confirm-icon.warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--accent-orange);
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.confirm-message {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 28px;
  padding-left: 52px;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-danger {
  background-color: var(--accent-red) !important;
}

.btn-danger:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3) !important;
}
</style>
