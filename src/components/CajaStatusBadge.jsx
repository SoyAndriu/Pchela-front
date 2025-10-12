import React, { useCallback, useEffect, useState } from "react";
import useCaja from "../hooks/useCaja";
import { useToast } from "./ToastProvider";

export default function CajaStatusBadge({ darkMode }) {
  const { getSesionAbierta, abrirCaja, cerrarCaja } = useCaja();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const s = await getSesionAbierta();
      setOpen(!!s?.open);
    } catch (e) {
      setOpen(false);
      const msg = e?.message || "No se pudo verificar la caja";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [getSesionAbierta, toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const base = darkMode
    ? "border border-gray-600 bg-gray-800 text-gray-100"
    : "border border-slate-200 bg-white text-gray-800";

  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${base}`}>
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${open ? "bg-emerald-500" : "bg-gray-400"}`} />
      <span className="text-sm">Caja: {loading ? "…" : (open ? "Abierta" : "Cerrada")}</span>
      <div className="h-4 w-px bg-gray-400/40 mx-1" />
      {open ? (
        <button
          onClick={async () => {
            const counted = prompt("Conteo final para cerrar caja:", "0");
            if (counted === null) return;
            const n = Number(counted);
            if (!isFinite(n) || n < 0) { toast.error("Valor inválido"); return; }
            try { await cerrarCaja({ counted_amount: n }); await refresh(); toast.success("Caja cerrada"); }
            catch (e) { toast.error(e?.message || "Error cerrando caja"); }
          }}
          className={`${darkMode ? "bg-pink-600 hover:bg-pink-700 text-white" : "bg-pink-500 hover:bg-pink-600 text-white"} text-xs px-2 py-1 rounded`}
        >
          Cerrar
        </button>
      ) : (
        <button
          onClick={async () => {
            const opening = prompt("Monto inicial para abrir caja:", "0");
            if (opening === null) return;
            const n = Number(opening);
            if (!isFinite(n) || n < 0) { toast.error("Valor inválido"); return; }
            try { await abrirCaja(n); await refresh(); toast.success("Caja abierta"); }
            catch (e) { toast.error(e?.message || "Error abriendo caja"); }
          }}
          className={`${darkMode ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"} text-xs px-2 py-1 rounded`}
        >
          Abrir
        </button>
      )}
    </div>
  );
}
