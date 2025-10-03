import React, { useState } from "react";
import { FunnelIcon, ArrowDownTrayIcon, ChartBarIcon, ClockIcon } from "@heroicons/react/24/outline";

function Stat({ title, value, darkMode }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm border transition hover:shadow-md ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
      <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-slate-600"}`}>{title}</p>
      <p className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

export default function Reportes({ darkMode }) {
  const [filtros, setFiltros] = useState({ rango: "30d", tipo: "ventas" });
  const stats = [
    { title: "Ventas (30d)", value: "$120.500" },
    { title: "Tickets promedio", value: "$2.150" },
    { title: "Clientes nuevos", value: 45 },
    { title: "Products top", value: 8 },
  ];

  const setFiltro = (name, value) => setFiltros((prev) => ({ ...prev, [name]: value }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Reportes</h1>
          <p className={`${darkMode ? "text-gray-400" : "text-slate-600"}`}>Resumen analítico y métricas clave</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${darkMode ? "border-gray-600 bg-gray-800" : "border-slate-300 bg-white"}`}>
            <FunnelIcon className="w-4 h-4" />
            <select
              className={`bg-transparent focus:outline-none text-sm ${darkMode ? "text-gray-200" : "text-slate-700"}`}
              value={filtros.rango}
              onChange={(e) => setFiltro("rango", e.target.value)}
            >
              <option value="7d">7 días</option>
              <option value="30d">30 días</option>
              <option value="90d">90 días</option>
              <option value="ytd">YTD</option>
            </select>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${darkMode ? "border-gray-600 bg-gray-800" : "border-slate-300 bg-white"}`}>
            <ChartBarIcon className="w-4 h-4" />
            <select
              className={`bg-transparent focus:outline-none text-sm ${darkMode ? "text-gray-200" : "text-slate-700"}`}
              value={filtros.tipo}
              onChange={(e) => setFiltro("tipo", e.target.value)}
            >
              <option value="ventas">Ventas</option>
              <option value="compras">Compras</option>
              <option value="clientes">Clientes</option>
              <option value="inventario">Inventario</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 text-white text-sm hover:bg-pink-700">
            <ArrowDownTrayIcon className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => <Stat key={i} {...s} darkMode={darkMode} />)}
      </div>

      {/* Grillas de secciones */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 p-6 rounded-lg shadow-sm border h-72 flex items-center justify-center text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-slate-200 text-slate-600"}`}>
          Gráfico principal ({filtros.tipo}) – placeholder
        </div>
        <div className={`p-6 rounded-lg shadow-sm border h-72 flex flex-col gap-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
          <h3 className={`font-semibold ${darkMode ? "text-gray-100" : "text-slate-800"}`}>Actividad reciente</h3>
          <ul className={`space-y-2 text-sm ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
            <li className="flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Venta #1043 registrada</li>
            <li className="flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Producto nuevo agregado</li>
            <li className="flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Actualización de stock</li>
            <li className="flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Cliente premium creado</li>
            <li className="flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Pedido en proceso</li>
          </ul>
        </div>
      </div>

      {/* Tabla resumen */}
      <div className={`mt-6 rounded-lg shadow-sm border overflow-x-auto ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-slate-700"}>
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Concepto</th>
              <th className="px-4 py-2 text-left">Categoría</th>
              <th className="px-4 py-2 text-left">Monto</th>
              <th className="px-4 py-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {[1,2,3,4,5].map((i) => (
              <tr key={i} className={darkMode ? "border-t border-gray-700" : "border-t border-slate-200"}>
                <td className="px-4 py-2">#{1000+i}</td>
                <td className="px-4 py-2">Transacción demo {i}</td>
                <td className="px-4 py-2">{i % 2 === 0 ? "Venta" : "Compra"}</td>
                <td className="px-4 py-2">${(Math.random()*500+50).toFixed(2)}</td>
                <td className="px-4 py-2">2025-10-03</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
