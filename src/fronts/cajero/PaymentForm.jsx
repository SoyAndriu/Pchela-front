import { useState } from "react";
import {
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline";

export default function PaymentForm({ darkMode }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [orderTotal] = useState(25.50);

  const handlePayment = (e) => {
    e.preventDefault();
    alert("Pago procesado exitosamente");
  };

  const change = amount ? parseFloat(amount) - orderTotal : 0;

  return (
    <div className={`p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CalculatorIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Procesar Pago</h2>
        </div>

        {/* Resumen del pedido */}
        <div className={`border rounded-lg p-4 mb-6 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
        }`}>
          <h3 className="font-semibold mb-2">Resumen del Pedido</h3>
          <div className="flex justify-between items-center">
            <span>Mesa 5 - Pizza, Coca Cola</span>
            <span className="font-bold text-xl">${orderTotal.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium mb-3">Método de Pago</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                  paymentMethod === "cash"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : darkMode
                    ? "border-gray-600 hover:border-gray-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <BanknotesIcon className="h-6 w-6" />
                <span className="font-medium">Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                  paymentMethod === "card"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : darkMode
                    ? "border-gray-600 hover:border-gray-500"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <CreditCardIcon className="h-6 w-6" />
                <span className="font-medium">Tarjeta</span>
              </button>
            </div>
          </div>

          {/* Monto recibido (solo para efectivo) */}
          {paymentMethod === "cash" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Monto Recibido
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode 
                    ? "bg-gray-800 border-gray-600 text-white" 
                    : "bg-white border-gray-300"
                }`}
                placeholder="0.00"
                required
              />
              {amount && change >= 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="font-medium">
                      Cambio: ${change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              {amount && change < 0 && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-800 font-medium">
                    Monto insuficiente
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botón de procesar */}
          <button
            type="submit"
            disabled={paymentMethod === "cash" && (!amount || change < 0)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Procesar Pago
          </button>
        </form>
      </div>
    </div>
  );
}