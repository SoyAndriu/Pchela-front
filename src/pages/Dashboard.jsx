import React from "react";

function StatCard({ title, value, darkMode }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm border transition-shadow hover:shadow-md ${
      darkMode 
        ? "bg-gray-800 text-white border-gray-700" 
        : "bg-white text-gray-900 border-pink-100"
    }`}>
      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-pink-600"}`}>{title}</p>
      <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-700"}`}>{value}</p>
    </div>
  );
}

export default function Dashboard({darkMode}) {
  // Datos de prueba
  const stats = [
    { title: "Ventas hoy", value: "$1.200" },
    { title: "Ingresos este mes", value: "$24.500" },
    { title: "Productos con stock bajo", value: 5 },
    { title: "Pedidos pendientes", value: 2 },
    { title: "Clientes activos", value: 120 },
    {title: "Nuevos clientes este mes", value: 15},
    {title: "Total de productos", value: 58},
    {title: "Devoluciones este mes", value: 1},
  ];
  const estiloGraficos = `p-6 rounded-lg shadow-sm border h-64 flex items-center justify-center ${
    darkMode 
      ? "bg-gray-800 border-gray-700 text-gray-300" 
      : "bg-white border-pink-100 text-pink-600"
  }`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Inicio</h2>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={i} {...s} darkMode={darkMode} />)}
      </div>

      {/* Espacios para gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={estiloGraficos}>Gráfico de ventas (placeholder)</div>
        <div className={estiloGraficos}>Productos más vendidos (placeholder)</div>
      </div>
    </div>
  );
}
