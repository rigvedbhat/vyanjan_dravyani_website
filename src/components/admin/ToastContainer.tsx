"use client";

import type { ToastItem } from "@/hooks/useToast";

type ToastContainerProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          role="alert"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            type="button"
            aria-label="Dismiss"
            onClick={() => onDismiss(toast.id)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
