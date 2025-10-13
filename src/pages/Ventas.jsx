import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import useCaja from "../hooks/useCaja";

export default function Ventas({ darkMode }) {
  const navigate = useNavigate();
  const { getSesionAbierta } = useCaja();

  // Gate de Caja
  const [cajaLoading, setCajaLoading] = useState(true);
  const [cajaOpen, setCajaOpen] = useState(false);
  const [cajaErr, setCajaErr] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setCajaLoading(true);
      setCajaErr("");
      try {
        const s = await getSesionAbierta();
        if (!active) return;
        setCajaOpen(!!s?.open);
      } catch (e) {
        if (!active) return;
        setCajaOpen(false);
        setCajaErr(e?.message || "No se pudo verificar la caja");
      } finally {
        if (active) setCajaLoading(false);
      }
    })();
    return () => { active = false; };
  }, [getSesionAbierta]);

  // Página simplificada: las ventas se registran desde Cobro (Cajero)

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            darkMode 
              ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600" 
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>
          Ventas
        </h1>
        <div className="w-[90px]" />
      </header>
      {/* Tarjeta principal con CTA hacia Cobro */}
      <div className={`rounded-lg border shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <div className="p-6 space-y-4">
          <p className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Este módulo fue simplificado. Para registrar ventas que impacten en caja y stock, usá el flujo de <b>Cobro</b> del Cajero.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/cajero/payment')} className={`${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'} px-4 py-2 rounded`}>
              Ir a Cobro
            </button>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {cajaLoading ? 'Verificando caja…' : `Caja: ${cajaOpen ? 'Abierta' : 'Cerrada'}`}
            </span>
            {!cajaLoading && !cajaOpen && (
              <button onClick={() => navigate('/cajero/caja')} className={`px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800 text-gray-200' : 'border-gray-300 hover:bg-gray-100 text-gray-800'}`}>
                Ir a Caja
              </button>
            )}
          </div>
          {cajaErr && (
            <div className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{cajaErr}</div>
          )}
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            El historial y reportes de ventas estarán en el módulo de reportes.
          </div>
        </div>
      </div>
    </div>
  );
}