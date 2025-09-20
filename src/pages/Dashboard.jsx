import React from "react";

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  // Datos de prueba
  const stats = [
    { title: "Ventas hoy", value: "$1.200" },
    { title: "Ingresos este mes", value: "$24.500" },
    { title: "Productos con stock bajo", value: 5 },
    { title: "Pedidos pendientes", value: 2 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Inicio</h2>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Espacios para gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow h-64">Gráfico de ventas (placeholder)</div>
        <div className="bg-white p-4 rounded shadow h-64">Productos más vendidos (placeholder)</div>
      </div>
    </div>
  );
}
