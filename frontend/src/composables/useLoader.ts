import { ref } from 'vue';

const loading = ref(false);
// Number between 0–100 for the bar width
const progress = ref(0);

let trickleTimer: ReturnType<typeof setTimeout> | null = null;
let finishTimer: ReturnType<typeof setTimeout> | null = null;

const TRICKLE_RATE = 600; // ms between trickle ticks
const TRICKLE_AMOUNT = 3; // % per tick
const START_PCT = 20;

function clearTimers() {
  if (trickleTimer) { clearTimeout(trickleTimer); trickleTimer = null; }
  if (finishTimer) { clearTimeout(finishTimer); finishTimer = null; }
}

function trickle() {
  if (progress.value < 85) {
    progress.value += TRICKLE_AMOUNT;
  }
  if (progress.value < 85) {
    trickleTimer = setTimeout(trickle, TRICKLE_RATE);
  }
}

export function useLoader() {
  const start = () => {
    clearTimers();
    progress.value = 0;
    loading.value = true;
    // Fast initial burst
    requestAnimationFrame(() => {
      progress.value = START_PCT;
      // Then slow trickle
      trickleTimer = setTimeout(trickle, TRICKLE_RATE);
    });
  };

  const stop = () => {
    clearTimers();
    progress.value = 100;
    finishTimer = setTimeout(() => {
      loading.value = false;
      progress.value = 0;
    }, 400);
  };

  return {
    loading,
    progress,
    start,
    stop,
  };
}
