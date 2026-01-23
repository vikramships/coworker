import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const TOAST_DURATION = 4000;
const TOAST_ID_COUNTER = { current: 0 };

function generateId(): string {
  TOAST_ID_COUNTER.current += 1;
  return `toast-${TOAST_ID_COUNTER.current}-${Date.now()}`;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message: string, type: ToastType, duration?: number) => {
    const id = generateId();
    const toast: Toast = {
      id,
      message,
      type,
      duration: duration ?? TOAST_DURATION,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration);
    }

    return id;
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));
