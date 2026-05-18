import { reactive } from 'vue';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const toasts = reactive<Toast[]>([]);
let nextId = 0;

export function useToast() {
  const show = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = nextId++;
    toasts.push({ id, message, type });
    setTimeout(() => {
      const idx = toasts.findIndex((t) => t.id === id);
      if (idx !== -1) toasts.splice(idx, 1);
    }, duration);
  };

  const success = (message: string) => show(message, 'success');
  const error = (message: string) => show(message, 'error');

  return { toasts, show, success, error };
}
