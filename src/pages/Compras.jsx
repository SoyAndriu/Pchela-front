import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ModalIngresoStock from "../components/products/ModalIngresoStock";
import HistorialLotesModal from "../components/products/HistorialLotesModal";
import Proveedores from "./Proveedores";
import Marcas from "./Marcas";
import { useLotes } from "../hooks/useLotes";
import useProveedores from "../hooks/useProveedores";
import useMarcas from "../hooks/useMarcas";
import { useProducts } from "../hooks/useProducts";

export default function Compras({ darkMode }) {
  const [tab, setTab] = useState("ingreso");

  // Hooks de datos
  const { lotes, createLote } = useLotes();
  const { proveedores, fetchProveedores } = useProveedores();
  const { marcas, fetchMarcas } = useMarcas();
  const { productos, fetchProducts } = useProducts();

  // Estados para modales y selección de productos
  const [showIngreso, setShowIngreso] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [selectedProductIngreso, setSelectedProductIngreso] = useState(null);
  const [selectedProductHistorial, setSelectedProductHistorial] = useState(null);

  // Cargar datos base al montar
  useEffect(() => {
    fetchProducts?.();
    fetchProveedores?.();
    fetchMarcas?.();
    // lotes se cargan por producto en los modales
  }, [fetchProducts, fetchProveedores, fetchMarcas]);

  // Estadísticas calculadas
  const stats = {
    productos: productos?.length || 0,
    lotes: lotes?.length || 0,
    proveedores: proveedores?.length || 0,
    marcas: marcas?.length || 0,
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        darkMode ? "bg-gray-900" : "bg-pink-25"
      }`}
    >
      {/* Header con estadísticas */}
      <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <button
            onClick={() => window.history.back()}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title="Volver"
            aria-label="Volver"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1
            className={`text-2xl font-bold ${
              darkMode ? "text-pink-300" : "text-pink-600"
            }`}
          >
            Panel de Compras
          </h1>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Productos", value: stats.productos },
            { label: "Lotes", value: stats.lotes },
            { label: "Proveedores", value: stats.proveedores },
            { label: "Marcas", value: stats.marcas },
          ].map(({ label, value }) => (
            <div
              key={label}
              className={`px-4 py-2 rounded-lg shadow text-center ${
                darkMode
                  ? "bg-gray-800 text-pink-300"
                  : "bg-pink-50 text-pink-600"
              }`}
            >
              <span className="block text-xs font-semibold">{label}</span>
              <span className="block text-lg font-bold">{value}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Tabs de navegación */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "ingreso", label: "Ingreso de Stock" },
          { id: "historial", label: "Historial de Lotes" },
          { id: "proveedores", label: "Proveedores" },
          { id: "marcas", label: "Marcas" },
        ].map(({ id, label }) => (
          <button
            key={id}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === id
                ? darkMode
                  ? "bg-pink-600 text-white"
                  : "bg-pink-500 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido según tab */}
      <div>
        {/* Tab: Ingreso de Stock */}
        {tab === "ingreso" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Producto</label>
                <select
                  className={`min-w-[260px] px-3 py-2 rounded border text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-slate-300'}`}
                  value={selectedProductIngreso?.id || ''}
                  onChange={(e) => {
                    const p = productos?.find(pr => String(pr.id) === e.target.value);
                    setSelectedProductIngreso(p || null);
                  }}
                >
                  <option value="">Selecciona un producto…</option>
                  {Array.isArray(productos) && productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                disabled={!selectedProductIngreso}
                onClick={() => setShowIngreso(true)}
                className={`px-4 py-2 rounded text-sm font-medium ${!selectedProductIngreso ? 'opacity-60 cursor-not-allowed' : ''} ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
              >
                Ingresar stock
              </button>
            </div>

            {/* Modal de Ingreso */}
            <ModalIngresoStock
              visible={showIngreso}
              onClose={() => setShowIngreso(false)}
              producto={selectedProductIngreso}
              onSaved={() => setShowIngreso(false)}
              darkMode={darkMode}
              createLote={createLote}
            />
          </div>
        )}

        {/* Tab: Historial de Lotes */}
        {tab === "historial" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Producto</label>
                <select
                  className={`min-w-[260px] px-3 py-2 rounded border text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-slate-300'}`}
                  value={selectedProductHistorial?.id || ''}
                  onChange={(e) => {
                    const p = productos?.find(pr => String(pr.id) === e.target.value);
                    setSelectedProductHistorial(p || null);
                  }}
                >
                  <option value="">Selecciona un producto…</option>
                  {Array.isArray(productos) && productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                disabled={!selectedProductHistorial}
                onClick={() => setShowHistorial(true)}
                className={`px-4 py-2 rounded text-sm font-medium ${!selectedProductHistorial ? 'opacity-60 cursor-not-allowed' : ''} ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
              >
                Ver historial
              </button>
            </div>

            {/* Modal Historial */}
            <HistorialLotesModal
              visible={showHistorial}
              onClose={() => setShowHistorial(false)}
              producto={selectedProductHistorial}
              darkMode={darkMode}
              onAfterChange={() => { /* podrías refrescar stats si se requiere */ }}
            />
          </div>
        )}

        {/* Tab: Proveedores */}
        {tab === "proveedores" && <Proveedores darkMode={darkMode} />}

        {/* Tab: Marcas */}
        {tab === "marcas" && <Marcas darkMode={darkMode} />}
      </div>

      {/* Fin dashboard compras */}
    </div>
  );
}
