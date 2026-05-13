import { IconClose } from "./mono-icons";
import { useEffect, useRef, useState } from "react";
import type { ToastItem } from "./use-toasts";

type ToastStackProps = {
  toasts: ToastItem[];
  onClose: (id: number) => void;
  onPause?: (id: number) => void;
  onResume?: (id: number) => void;
};

export function ToastStack({ toasts, onClose, onPause, onResume }: ToastStackProps) {
  const [renderedToasts, setRenderedToasts] = useState<ToastItem[]>(toasts);
  const [closingIds, setClosingIds] = useState<number[]>([]);
  const removeTimersRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const nextById = new Map(toasts.map((t) => [t.id, t] as const));
    const nextIds = new Set(nextById.keys());

    setRenderedToasts((prev) => {
      const prevIds = new Set(prev.map((t) => t.id));
      const merged: ToastItem[] = prev.map((item) => nextById.get(item.id) || item);
      for (const toast of toasts) {
        if (!prevIds.has(toast.id)) {
          merged.push(toast);
        }
      }
      return merged;
    });

    setClosingIds((prev) => {
      const out = [...prev];
      for (const id of renderedToasts.map((t) => t.id)) {
        if (!nextIds.has(id) && !out.includes(id)) {
          out.push(id);
          const timer = window.setTimeout(() => {
            setRenderedToasts((list) => list.filter((item) => item.id !== id));
            setClosingIds((ids) => ids.filter((x) => x !== id));
            const existing = removeTimersRef.current.get(id);
            if (existing) {
              window.clearTimeout(existing);
              removeTimersRef.current.delete(id);
            }
          }, 220);
          removeTimersRef.current.set(id, timer);
        }
      }
      return out;
    });
  }, [toasts]);

  useEffect(() => {
    return () => {
      for (const timer of removeTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      removeTimersRef.current.clear();
    };
  }, []);

  const requestClose = (toastId: number) => {
    setClosingIds((prev) => (prev.includes(toastId) ? prev : [...prev, toastId]));
    window.setTimeout(() => {
      onClose(toastId);
    }, 180);
  };

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {renderedToasts.map((toast) => (
        <div
          key={toast.id}
          className={closingIds.includes(toast.id) ? "toast-item toast-item--closing" : "toast-item"}
          role="status"
          tabIndex={0}
          onMouseEnter={() => onPause?.(toast.id)}
          onMouseLeave={() => onResume?.(toast.id)}
          onFocus={() => onPause?.(toast.id)}
          onBlur={() => onResume?.(toast.id)}
          onClick={() => requestClose(toast.id)}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={(event) => {
              event.stopPropagation();
              requestClose(toast.id);
            }}
          >
            <IconClose className="icon-svg icon-svg--sm" />
          </button>
        </div>
      ))}
    </div>
  );
}
