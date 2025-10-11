import { useEffect, useState } from "react";
import useCaja from "../../hooks/useCaja";
import { useNavigate } from "react-router-dom";
import {
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  CalculatorIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/Toast";

export default function PaymentForm({ darkMode }) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [orderTotal] = useState(45.50);
  const [selectedOrder] = useState({
    cliente: "Ana García",
    items: ["Labial Rouge", "Base líquida"],
    total: 45.50
  });
  // Registro automático en caja según método de pago
  const [saving, setSaving] = useState(false);

  const { getSesionAbierta, crearMovimiento } = useCaja();

  // Gate de caja
  const [cajaLoading, setCajaLoading] = useState(true);
  const [cajaOpen, setCajaOpen] = useState(false);
  const [cajaErr, setCajaErr] = useState("");

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");

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
  }, []);

  useEffect(() => {
    if (!cajaLoading && !cajaOpen && !cajaErr) {
      // Muestra un toast suave al entrar si no hay caja
      setToastType("info");
      setToastMsg("Abrí la caja para procesar pagos");
    }
  }, [cajaLoading, cajaOpen, cajaErr]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (paymentMethod === "cash" && (!amount || parseFloat(amount) < orderTotal)) {
      return;
    }
    setSaving(true);
    try {
      // Simular creación de venta y obtener un id
      const ventaId = Math.floor(Date.now() / 1000);

      // Registrar en caja automáticamente según método de pago
      const mapMedio = {
        cash: 'EFECTIVO',
        card: 'TARJETA',
      };
      if (paymentMethod === "cash" || paymentMethod === "card") {
        try {
          const s = await getSesionAbierta();
          if (s?.open) {
            await crearMovimiento({
              tipo_movimiento: "INGRESO",
              origen: "VENTA",
              ref_type: "venta",
              ref_id: ventaId,
              monto: Number(orderTotal),
              medio_pago: mapMedio[paymentMethod],
              descripcion: `POS: ${selectedOrder.cliente}`,
            });
          } else {
            setToastType("error");
            setToastMsg("No hay una caja abierta. Se registró el pago, pero no el movimiento de caja.");
          }
        } catch (err) {
          setToastType("error");
          setToastMsg((err?.message || "Error registrando en caja") + ". El pago continúa registrado.");
        }
      }

      setToastType("success");
      setToastMsg("Pago procesado exitosamente");
      setAmount("");
    } finally {
      setSaving(false);
    }
  };

  const change = amount ? parseFloat(amount) - orderTotal : 0;

  return (
    <div className={`p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg("")} />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CalculatorIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Procesar Pago</h2>
        </div>

        {/* Gate Caja */}
        {cajaLoading ? (
          <div className={`p-4 rounded-lg border mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            Verificando estado de caja…
          </div>
        ) : !cajaOpen ? (
          <div className={`p-5 rounded-lg border mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold mb-2">Caja no abierta</h3>
            <p className="text-sm opacity-80 mb-4">Debés abrir la caja para poder procesar pagos. {cajaErr && (<span className="block mt-2 text-red-500">{cajaErr}</span>)}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/cajero/caja')}
                className={`px-4 py-2 rounded ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
              >
                Ir a Caja
              </button>
              <button
                type="button"
                onClick={async () => {
                  setCajaLoading(true);
                  try { const s = await getSesionAbierta(); setCajaOpen(!!s?.open); setCajaErr(""); } catch (e) { setCajaOpen(false); setCajaErr(e?.message || 'No se pudo verificar la caja'); } finally { setCajaLoading(false); }
                }}
                className={`px-4 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : null}

        {/* Resumen del pedido */}
        <div className={`border rounded-lg p-4 mb-6 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
        }`}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Resumen del Pedido
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Cliente:</span>
              <span>{selectedOrder.cliente}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="font-medium">Productos:</span>
              <div className="text-right">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="text-sm">{item}</div>
                ))}
              </div>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-xl">${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
          {/* La caja se registra automáticamente según el método de pago */}
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
                      Cambio a devolver: ${change.toFixed(2)}
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
            disabled={!cajaOpen || (paymentMethod === "cash" && (!amount || change < 0)) || saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <CheckCircleIcon className="h-5 w-5" />
            {saving ? "Procesando…" : (!cajaOpen ? "Abrí la caja para continuar" : "Procesar Pago de Cosmética")}
          </button>
        </form>
      </div>
    </div>
  );
}