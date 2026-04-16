import { useCallback, useEffect, useRef, useState } from "react";

export type ToastItem = {
  id: number;
  message: string;
};

export function useToasts(timeoutMs = 4500) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef<number>(1);

  const pushToast = useCallback((message: string) => {
    const text = message.trim();
    if (!text) {
      return;
    }
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message: text }]);
  }, []);

  const closeToast = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  }, []);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        closeToast(toast.id);
      }, timeoutMs)
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [closeToast, timeoutMs, toasts]);

  return {
    toasts,
    pushToast,
    closeToast,
  };
}
