import { useEffect, useState } from "react";

export default function Toast({ message, type = "info", onClose, duration = 2500 }) {
  const [open, setOpen] = useState(Boolean(message));
  useEffect(() => {
    setOpen(Boolean(message));
    if (message) {
      const t = setTimeout(() => { setOpen(false); onClose?.(); }, duration);
      return () => clearTimeout(t);
    }
  }, [message, duration, onClose]);

  if (!open || !message) return null;
  const base = "fixed z-50 bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow text-sm";
  const styles = type === "success"
    ? "bg-green-600 text-white"
    : type === "error"
    ? "bg-red-600 text-white"
    : type === "warning"
    ? "bg-amber-500 text-black"
    : "bg-gray-800 text-white";
  return (
    <div className={`${base} ${styles}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
