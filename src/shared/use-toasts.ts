import { useCallback, useEffect, useRef, useState } from "react";

export type ToastItem = {
  id: number;
  message: string;
};

export function useToasts(timeoutMs = 4500) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef<number>(1);
  const timersRef = useRef<Map<number, number>>(new Map());

  const pushToast = useCallback((message: string) => {
    const text = message.trim();
    if (!text) {
      return;
    }
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message: text }]);
  }, []);

  const closeToast = useCallback((toastId: number) => {
    const timer = timersRef.current.get(toastId);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(toastId);
    }
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  }, []);

  const dismissAll = useCallback(() => {
    for (const timer of timersRef.current.values()) {
      window.clearTimeout(timer);
    }
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const pauseToast = useCallback((toastId: number) => {
    const timer = timersRef.current.get(toastId);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(toastId);
    }
  }, []);

  const resumeToast = useCallback((toastId: number) => {
    if (timersRef.current.has(toastId)) {
      return;
    }
    const timer = window.setTimeout(() => {
      closeToast(toastId);
    }, timeoutMs);
    timersRef.current.set(toastId, timer);
  }, [closeToast, timeoutMs]);

  useEffect(() => {
    for (const toast of toasts) {
      if (!timersRef.current.has(toast.id)) {
        const timer = window.setTimeout(() => {
          closeToast(toast.id);
        }, timeoutMs);
        timersRef.current.set(toast.id, timer);
      }
    }
    const ids = new Set(toasts.map((t) => t.id));
    for (const [id, timer] of timersRef.current.entries()) {
      if (!ids.has(id)) {
        window.clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }
  }, [closeToast, timeoutMs, toasts]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        window.clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  return {
    toasts,
    pushToast,
    closeToast,
    dismissAll,
    pauseToast,
    resumeToast,
  };
}
