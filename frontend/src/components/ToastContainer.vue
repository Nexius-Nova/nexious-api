<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast-item', `toast-${toast.type}`]"
          @mouseenter="pauseTimer(toast.id)"
          @mouseleave="resumeTimer(toast.id)"
        >
          <svg v-if="toast.type === 'success'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <svg v-else-if="toast.type === 'error'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg v-else-if="toast.type === 'warning'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <svg v-else class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="toast-text">{{ toast.message }}</span>
          <button class="toast-dismiss" @click="dismiss(toast.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="toast-progress">
            <div class="toast-progress-bar" :style="getProgressStyle(toast.id)"></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, dismiss, pauseTimer, resumeTimer, getProgressStyle } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 40px 12px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md), 0 0 30px rgba(0, 0, 0, 0.2);
  font-size: 0.875rem;
  color: var(--text-primary);
  pointer-events: auto;
  max-width: 400px;
  overflow: hidden;
}

.toast-icon {
  flex-shrink: 0;
}

.toast-text {
  line-height: 1.4;
  flex: 1;
}

.toast-dismiss {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.toast-dismiss:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.05);
}

.toast-progress-bar {
  height: 100%;
  transition: width 0.1s linear;
}

.toast-success .toast-icon {
  color: var(--accent-green);
}

.toast-success .toast-progress-bar {
  background: var(--accent-green);
}

.toast-error .toast-icon {
  color: var(--accent-red);
}

.toast-error .toast-progress-bar {
  background: var(--accent-red);
}

.toast-info .toast-icon {
  color: var(--accent-blue);
}

.toast-info .toast-progress-bar {
  background: var(--accent-blue);
}

.toast-warning .toast-icon {
  color: var(--accent-orange);
}

.toast-warning .toast-progress-bar {
  background: var(--accent-orange);
}

/* Transition */
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.3s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
