<template>
  <Transition name="loader-bar">
    <div v-if="loading" class="global-loader">
      <div class="loader-track">
        <div
          class="loader-fill"
          :style="{ width: progress + '%' }"
        ></div>
        <div class="loader-glow"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useLoader } from '../composables/useLoader';

const { loading, progress } = useLoader();
</script>

<style scoped>
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
}

.loader-track {
  height: 2px;
  background: transparent;
  position: relative;
}

.loader-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #818cf8, #6366f1, #3b82f6);
  background-size: 200% 100%;
  animation: loader-shift 1.8s linear infinite;
  border-radius: 0 2px 2px 0;
  transition: width 0.5s cubic-bezier(0.2, 0.8, 0.3, 1);
  will-change: width;
}

.loader-glow {
  position: absolute;
  top: 0;
  width: 60px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.35), transparent);
  animation: loader-glow-move 1s ease-in-out infinite;
  opacity: 0.7;
}

@keyframes loader-shift {
  0% { background-position: 200% 0; }
  100% { background-position: 0 0; }
}

@keyframes loader-glow-move {
  0% { left: 0; opacity: 0; }
  50% { opacity: 0.7; }
  100% { left: 100%; opacity: 0; transform: translateX(-60px); }
}

/* Vue transition */
.loader-bar-enter-active {
  transition: opacity 0.15s ease-out;
}
.loader-bar-leave-active {
  transition: opacity 0.35s ease-in;
}
.loader-bar-enter-from,
.loader-bar-leave-to {
  opacity: 0;
}
</style>
