import { useContext } from "react";
import { ToastContext } from "../context/ToastContext.jsx";

const colors = {
  success: "border-[var(--success)]",
  error: "border-[var(--danger)]",
  info: "border-[var(--accent)]"
};

export default function Toast() {
  const { toasts } = useContext(ToastContext);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-72 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border-l-4 bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-lg transition ${
            colors[toast.type] || colors.info
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
