import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useCaja from "../hooks/useCaja";

/**
 * CajaGuard
 * - Verifica si hay caja abierta.
 * - Si no hay, permite navegar sólo a rutas incluidas en allowedWhenClosed.
 * - Caso contrario, muestra un panel con CTA para ir a Caja y reintentar.
 */
export default function CajaGuard({ children, allowedWhenClosed = [], darkMode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { getSesionAbierta } = useCaja();

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const allowed = useMemo(() => {
    const list = Array.isArray(allowedWhenClosed) ? allowedWhenClosed : [];
    return list.some((p) => pathname.startsWith(p));
  }, [allowedWhenClosed, pathname]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const s = await getSesionAbierta();
        if (!active) return;
        setOpen(!!s?.open);
      } catch (e) {
        if (!active) return;
        setOpen(false);
        setError(e?.message || "No se pudo verificar la caja");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [pathname]);

  if (loading || open || allowed) {
    return <>{children}</>;
  }

  return (
    <div className={`p-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
      <div className={`max-w-2xl mx-auto p-5 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <h2 className="text-xl font-semibold mb-2">Caja no abierta</h2>
        <p className="text-sm opacity-80 mb-4">
          Debés abrir la caja antes de usar esta sección.
          {error && <span className="block mt-2 text-red-500">{error}</span>}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/cajero/caja")}
            className={`${darkMode ? "bg-pink-600 hover:bg-pink-700 text-white" : "bg-pink-500 hover:bg-pink-600 text-white"} px-4 py-2 rounded`}
          >
            Ir a Caja
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`px-4 py-2 rounded border ${darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
