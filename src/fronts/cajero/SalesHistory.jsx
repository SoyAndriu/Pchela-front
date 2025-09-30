import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function SalesHistory({ darkMode }) {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today");

  useEffect(() => {
    // Simulando datos de ventas de cosméticos
    setSales([
      { 
        id: 1, 
        date: "2024-01-15", 
        time: "14:30", 
        cliente: "Ana García", 
        items: ["Labial Rouge", "Base de maquillaje"], 
        total: 45.50, 
        paymentMethod: "cash" 
      },
      { 
        id: 2, 
        date: "2024-01-15", 
        time: "15:15", 
        cliente: "María López", 
        items: ["Crema facial", "Máscara de pestañas"], 
        total: 32.00, 
        paymentMethod: "card" 
      },
      { 
        id: 3, 
        date: "2024-01-15", 
        time: "16:00", 
        cliente: "Sofia Martín", 
        items: ["Perfume floral", "Desmaquillante"], 
        total: 68.75, 
        paymentMethod: "cash" 
      },
      { 
        id: 4, 
        date: "2024-01-15", 
        time: "16:30", 
        cliente: "Carmen Ruiz", 
        items: ["Kit de uñas", "Esmalte rojo"], 
        total: 25.90, 
        paymentMethod: "card" 
      },
    ]);
  }, []);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;

  const getPaymentIcon = (method) => {
    return method === "cash" 
      ? <BanknotesIcon className="h-4 w-4 text-green-600" />
      : <CreditCardIcon className="h-4 w-4 text-blue-600" />;
  };

  const filteredSales = sales.filter(sale =>
    sale.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}>
      <div className="flex items-center gap-3 mb-6">
        <ChartBarIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold">Historial de Ventas</h2>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-blue-50 border-blue-200"
        }`}>
          <div className="text-2xl font-bold text-blue-600">${totalSales.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Ventas</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-green-50 border-green-200"
        }`}>
          <div className="text-2xl font-bold text-green-600">{totalTransactions}</div>
          <div className="text-sm text-gray-600">Transacciones</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-purple-50 border-purple-200"
        }`}>
          <div className="text-2xl font-bold text-purple-600">${(totalSales / totalTransactions || 0).toFixed(2)}</div>
          <div className="text-sm text-gray-600">Promedio por venta</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              darkMode 
                ? "bg-gray-800 border-gray-600 text-white" 
                : "bg-white border-gray-300"
            }`}
          />
        </div>
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              darkMode 
                ? "bg-gray-800 border-gray-600 text-white" 
                : "bg-white border-gray-300"
            }`}
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="space-y-3">
        {filteredSales.map((sale) => (
          <div
            key={sale.id}
            className={`border rounded-lg p-4 transition-shadow hover:shadow-md ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {sale.date} - {sale.time}
                </div>
                <div className="font-semibold">{sale.cliente}</div>
                <div className="flex items-center gap-1">
                  {getPaymentIcon(sale.paymentMethod)}
                  <span className="text-sm capitalize">
                    {sale.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}
                  </span>
                </div>
              </div>
              <div className="font-bold text-lg">${sale.total.toFixed(2)}</div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span>Productos: </span>
              <span>{sale.items.join(", ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}