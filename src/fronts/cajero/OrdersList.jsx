import { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function OrdersList({ darkMode }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Simulando datos de pedidos de cosméticos
    setOrders([
      { 
        id: 1, 
        cliente: "Ana García", 
        items: ["Labial Rouge", "Base líquida"], 
        total: 45.50, 
        status: "pending" 
      },
      { 
        id: 2, 
        cliente: "María López", 
        items: ["Crema antiarrugas", "Sérum vitamina C"], 
        total: 78.00, 
        status: "ready" 
      },
      { 
        id: 3, 
        cliente: "Sofia Martín", 
        items: ["Perfume floral", "Desmaquillante bifásico"], 
        total: 92.75, 
        status: "completed" 
      },
      { 
        id: 4, 
        cliente: "Carmen Ruiz", 
        items: ["Kit de uñas", "Esmalte gel"], 
        total: 35.90, 
        status: "pending" 
      },
    ]);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "ready":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "completed":
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Preparando";
      case "ready": return "Listo para entrega";
      case "completed": return "Entregado";
      default: return "Desconocido";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "ready": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pedidos de Clientes</h2>
        <div className="text-sm text-gray-500">
          {orders.length} pedidos en total
        </div>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`border rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold">{order.cliente}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg">${order.total.toFixed(2)}</span>
                <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  <EyeIcon className="h-4 w-4" />
                  Ver detalles
                </button>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">Productos: </span>
              <span className="text-sm">{order.items.join(", ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}