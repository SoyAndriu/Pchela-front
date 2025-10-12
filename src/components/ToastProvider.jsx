/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Toast from "./Toast";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [duration, setDuration] = useState(2500);

  const show = useCallback((msg, opts = {}) => {
    setType(opts.type || "info");
    setDuration(opts.duration || 2500);
    setMessage(String(msg || ""));
  }, []);

  const api = useMemo(() => ({ show, success: (m, o)=>show(m,{...o,type:"success"}), error:(m,o)=>show(m,{...o,type:"error"}), info:(m,o)=>show(m,{...o,type:"info"}) }), [show]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Toast message={message} type={type} onClose={() => setMessage("")} duration={duration} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
