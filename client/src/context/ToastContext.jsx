import { createContext, useCallback, useMemo, useState } from "react";

export const ToastContext = createContext({
  showToast: () => {},
  toasts: []
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast, toasts }), [showToast, toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
