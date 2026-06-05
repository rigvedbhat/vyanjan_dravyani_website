"use client";

import { useCallback, useRef, useState } from "react";

export type ToastType = "success" | "error";

export type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

export function useToast(autoDismissMs = 3500) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, autoDismissMs);
    },
    [autoDismissMs]
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
