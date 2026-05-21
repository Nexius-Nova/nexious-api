import { reactive } from 'vue';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
  remaining: number;
  startTime: number;
  pausedAt: number | null;
}

const toasts = reactive<Toast[]>([]);
let nextId = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

// Track per-toast remaining time for progress bars
const progressStates = reactive<Record<number, number>>({});

function getRemaining(id: number): number {
  const toast = toasts.find((t) => t.id === id);
  if (!toast || !toast.duration) return 0;
  if (toast.pausedAt !== null) return toast.remaining;
  const elapsed = Date.now() - toast.startTime;
  return Math.max(0, toast.duration - elapsed);
}

export function useToast() {
  const show = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = nextId++;
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      remaining: duration,
      startTime: Date.now(),
      pausedAt: null,
    };
    toasts.push(toast);
    progressStates[id] = 100;

    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    timers.set(id, timer);

    // Update progress every 50ms
    const progressInterval = setInterval(() => {
      const remaining = getRemaining(id);
      progressStates[id] = duration > 0 ? (remaining / duration) * 100 : 100;
      if (remaining <= 0) {
        clearInterval(progressInterval);
      }
    }, 50);

    return id;
  };

  const dismiss = (id: number) => {
    removeToast(id);
  };

  function removeToast(id: number) {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    const idx = toasts.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.splice(idx, 1);
    delete progressStates[id];
  }

  const success = (message: string, duration?: number) =>
    show(message, 'success', duration ?? 3000);
  const error = (message: string, duration?: number) =>
    show(message, 'error', duration ?? 5000);
  const warning = (message: string, duration?: number) =>
    show(message, 'warning', duration ?? 4000);
  const info = (message: string, duration?: number) =>
    show(message, 'info', duration ?? 3000);

  // Loading/promise toast pattern
  const loading = (message: string) => show(message, 'info', 0); // 0 = no auto-dismiss
  const resolve = (id: number, successMsg: string) => {
    removeToast(id);
    return show(successMsg, 'success');
  };
  const reject = (id: number, errorMsg: string) => {
    removeToast(id);
    return show(errorMsg, 'error');
  };
  const promise = async <T>(
    promiseFn: () => Promise<T>,
    messages: { loading: string; success: string; error: string },
  ): Promise<T> => {
    const id = loading(messages.loading);
    try {
      const result = await promiseFn();
      resolve(id, messages.success);
      return result;
    } catch (err) {
      reject(id, messages.error);
      throw err;
    }
  };

  // Hover pause/resume
  const pauseTimer = (id: number) => {
    const toast = toasts.find((t) => t.id === id);
    if (!toast || toast.pausedAt !== null) return;
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    toast.remaining = getRemaining(id);
    toast.pausedAt = Date.now();
  };

  const resumeTimer = (id: number) => {
    const toast = toasts.find((t) => t.id === id);
    if (!toast || toast.pausedAt === null) return;
    const pausedDuration = Date.now() - toast.pausedAt;
    toast.startTime += pausedDuration;
    toast.pausedAt = null;

    const remaining = toast.remaining;
    if (remaining > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, remaining);
      timers.set(id, timer);
    }
  };

  const getProgressStyle = (id: number) => {
    return { width: (progressStates[id] ?? 100) + '%' };
  };

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    loading,
    resolve,
    reject,
    promise,
    pauseTimer,
    resumeTimer,
    getProgressStyle,
  };
}
