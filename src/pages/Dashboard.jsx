import React from "react";
import {
  UsersIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

function StatCard({ title, value, Icon, darkMode }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm border transition-shadow hover:shadow-md ${
      darkMode 
        ? "bg-gray-800 text-white border-gray-700" 
        : "bg-white text-gray-900 border-slate-200"
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-slate-600"}`}>{title}</p>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{value}</p>
        </div>
        {Icon && <Icon className={`w-8 h-8 ${darkMode ? "text-pink-300" : "text-pink-600"}`} />}
      </div>
    </div>
  );
}

export default function Dashboard({darkMode}) {

  // Datos de demo para stats
  const stats = [
    { title: "Clientes", value: 120, Icon: UsersIcon },
    { title: "Ventas (mes)", value: "$45.000", Icon: BanknotesIcon },
    { title: "Productos", value: 320, Icon: ShoppingBagIcon },
    { title: "Compras (semana)", value: 15, Icon: ShoppingCartIcon },
    { title: "Reportes", value: "Ver más", Icon: ChartBarIcon },
  ];
  const estiloGraficos = `p-6 rounded-lg shadow-sm border h-64 flex items-center justify-center ${
    darkMode 
      ? "bg-gray-800 border-gray-700 text-gray-300" 
      : "bg-white border-slate-200 text-slate-600"
  }`;

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Panel General</h2>
        <p className={`${darkMode ? "text-gray-300" : "text-slate-600"}`}>Resumen del sistema</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={i} {...s} darkMode={darkMode} />)}
      </div>

      {/* Espacios para gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className={estiloGraficos}>Gráfico de ventas (placeholder)</div>
        <div className={estiloGraficos}>Productos más vendidos (placeholder)</div>
      </div>

      {/* Sección de usuarios eliminada: ya existe en Usuarios.jsx */}
    </div>
  );
}
