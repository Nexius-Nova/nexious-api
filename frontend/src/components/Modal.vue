<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="visible"
        ref="overlayRef"
        class="modal-overlay"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="$emit('close')"
        @keydown.escape="$emit('close')"
        @keydown="trapFocus"
      >
        <div class="modal-panel glass-panel" :style="{ maxWidth: width }">
          <div class="modal-header">
            <slot name="header">
              <h3 :id="titleId">{{ title }}</h3>
            </slot>
            <button class="close-btn" @click="$emit('close')">&times;</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue';

const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  width?: string
}>(), {
  width: '500px',
});

defineEmits<{
  close: []
}>();

const overlayRef = ref<HTMLElement | null>(null);
const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;

// Scroll lock on body
watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
    nextTick(() => {
      // Focus the modal wrapper so it can receive keydown events for Escape/Tab
      overlayRef.value?.focus();
    });
  } else {
    document.body.style.overflow = '';
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
});

// Focus trap: keep Tab inside the modal
function trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const panel = overlayRef.value?.querySelector('.modal-panel');
  if (!panel) return;
  const focusable = panel.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
</script>

<style scoped>
.modal-overlay {
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
  z-index: 100;
}

.modal-panel {
  width: 100%;
  background: var(--bg-card);
  padding: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

.modal-header h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 24px;
  max-height: calc(85vh - 130px);
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px 20px;
}

/* Transition: fade + slight scale */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-panel,
.modal-fade-leave-active .modal-panel {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-panel {
  transform: scale(0.95);
}

.modal-fade-leave-to .modal-panel {
  transform: scale(0.95);
}
</style>
