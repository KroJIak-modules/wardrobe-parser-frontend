import { IconClose } from "./mono-icons";
import type { ToastItem } from "./use-toasts";

type ToastStackProps = {
  toasts: ToastItem[];
  onClose: (id: number) => void;
};

export function ToastStack({ toasts, onClose }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-item">
          <span>{toast.message}</span>
          <button type="button" className="toast-close" onClick={() => onClose(toast.id)}>
            <IconClose className="icon-svg icon-svg--sm" />
          </button>
        </div>
      ))}
    </div>
  );
}
