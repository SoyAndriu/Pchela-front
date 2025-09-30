import { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function OrdersList({ darkMode }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Simulando datos de pedidos
    setOrders([
      { id: 1, table: 5, items: ["Pizza", "Coca Cola"], total: 25.50, status: "pending" },
      { id: 2, table: 3, items: ["Hamburguesa", "Papas"], total: 18.00, status: "ready" },
      { id: 3, table: 8, items: ["Ensalada", "Agua"], total: 12.75, status: "completed" },
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
      case "pending": return "Pendiente";
      case "ready": return "Listo";
      case "completed": return "Completado";
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
        <h2 className="text-2xl font-bold">Lista de Pedidos</h2>
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
                  <span className="font-semibold">Mesa {order.table}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg">${order.total.toFixed(2)}</span>
                <button className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  <EyeIcon className="h-4 w-4" />
                  Ver
                </button>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">Items: </span>
              <span className="text-sm">{order.items.join(", ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}