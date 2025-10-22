import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useCaja from "../../hooks/useCaja";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Toast from "../../components/Toast";
import SearchableClientSelect from "../../components/clientes/SearchableClientSelect";
import Cart from "../../components/ventas/Cart";
import PaymentMethodSelect from "../../components/ventas/PaymentMethodSelect";
import { useVentas } from "../../hooks/useVentas";
import useSettings from "../../hooks/useSettings";

export default function PaymentForm({ darkMode }) {
  const navigate = useNavigate();
  const { createVenta, saving } = useVentas();
  const { settings } = useSettings();
  const { getSesionAbierta } = useCaja();

  const [clienteSel, setClienteSel] = useState(null);
  const [items, setItems] = useState([]);
  const [medioPago, setMedioPago] = useState("EFECTIVO");

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
    return () => {
      active = false;
    };
  }, [getSesionAbierta]);

  useEffect(() => {
    if (!cajaLoading && !cajaOpen && !cajaErr) {
      setToastType("info");
      setToastMsg("Abrí la caja para procesar cobros");
    }
  }, [cajaLoading, cajaOpen, cajaErr]);

  const fadeIn = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeIn}
      className={`p-6 min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg("")} />

      <motion.div
        className="max-w-3xl mx-auto space-y-6"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div
          variants={fadeIn}
          className={`rounded-xl p-5 flex items-center gap-3 shadow-lg ${
            darkMode
              ? "bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700"
              : "bg-gradient-to-r from-white to-pink-50 border border-pink-100"
          }`}
        >
          <CalculatorIcon
            className={`h-9 w-9 ${
              darkMode ? "text-pink-400" : "text-pink-600"
            } animate-pulse`}
          />
          <h2 className="text-2xl font-bold tracking-tight">Cobro en Caja</h2>
        </motion.div>

        {/* Estado de Caja */}
        <AnimatePresence mode="wait">
          {cajaLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`p-4 flex items-center gap-3 rounded-xl shadow-sm text-sm ${
                darkMode
                  ? "bg-gray-800 border border-gray-700 text-gray-300"
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              <ArrowPathIcon className="h-5 w-5 animate-spin text-pink-500" />
              Verificando estado de caja…
            </motion.div>
          ) : !cajaOpen ? (
            <motion.div
              key="closed"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className={`p-5 rounded-xl shadow-sm border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-gray-200"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                <h3 className="font-semibold text-lg">Caja no abierta</h3>
              </div>
              <p className="text-sm opacity-80 mb-4 leading-relaxed">
                Debés abrir la caja para poder procesar pagos.
                {cajaErr && (
                  <span className="block mt-2 text-red-500 font-medium">
                    {cajaErr}
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/cajero/caja")}
                  className={`px-4 py-2 rounded-lg font-semibold shadow-sm transition-all ${
                    darkMode
                      ? "bg-pink-600 hover:bg-pink-700 text-white"
                      : "bg-pink-500 hover:bg-pink-600 text-white"
                  }`}
                >
                  Ir a Caja
                </button>
                <button
                  onClick={async () => {
                    setCajaLoading(true);
                    try {
                      const s = await getSesionAbierta();
                      setCajaOpen(!!s?.open);
                      setCajaErr("");
                    } catch (e) {
                      setCajaOpen(false);
                      setCajaErr(e?.message || "No se pudo verificar la caja");
                    } finally {
                      setCajaLoading(false);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold border shadow-sm transition-all ${
                    darkMode
                      ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                      : "border-gray-300 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  Reintentar
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Cuerpo principal */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-3 gap-6"
        >
          {/* Cliente + Carrito */}
          <motion.div
            variants={fadeIn}
            className={`md:col-span-2 rounded-xl border p-5 shadow-sm ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h3 className="font-semibold mb-3 text-lg">Cliente</h3>
            <SearchableClientSelect
              value={clienteSel}
              onSelect={setClienteSel}
              darkMode={darkMode}
            />
            <div className="mt-6">
              <Cart value={items} onChange={setItems} darkMode={darkMode} />
            </div>
          </motion.div>

          {/* Panel derecho */}
          <motion.div
            variants={fadeIn}
            className={`rounded-xl border p-5 flex flex-col justify-between shadow-sm ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div>
              <PaymentMethodSelect
                value={medioPago}
                onChange={setMedioPago}
                darkMode={darkMode}
              />
              <div className="mt-4 text-sm opacity-80">
                Caja:{" "}
                <span
                  className={`font-semibold ${
                    cajaOpen ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {cajaOpen ? "Abierta" : "Cerrada"}
                </span>
              </div>
            </div>

            {/* Botón Confirmar */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={async () => {
                if (!cajaOpen) {
                  setToastType("info");
                  setToastMsg("Abrí la caja para confirmar");
                  return;
                }
                if (items.length === 0) {
                  setToastType("info");
                  setToastMsg("Agregá al menos un producto");
                  return;
                }
                const payload = {
                  cliente_id: clienteSel?.id ?? clienteSel?.usuario ?? null,
                  items: items.map((i) => ({
                    producto_id: i.producto_id ?? i.id ?? null,
                    lotes_asignados: Array.isArray(i.lotes_asignados) ? i.lotes_asignados.map(lote => ({
                      lote_id: lote.lote_id,
                      cantidad: lote.cantidad,
                      precio_unitario: lote.precio_unitario,
                      descuento_por_item: lote.descuento_por_item
                    })) : [],
                  })),
                  medio_pago: medioPago,
                  notas: "POS Cajero",
                  idempotency_key: `venta-${Date.now()}`,
                };
                const useApi = !!settings?.sales?.enableVentasApi;
                try {
                  if (useApi) await createVenta(payload);
                  setToastType("success");
                  setToastMsg("Venta registrada correctamente");
                  setItems([]);
                  setClienteSel(null); // Vacía el select de cliente tras venta
                } catch (e) {
                  const msg = e?.message || "";
                  if (msg.includes("409") || msg.toLowerCase().includes("caja")) {
                    setToastType("error");
                    setToastMsg("Caja no abierta para operar ventas");
                  } else {
                    setToastType("error");
                    setToastMsg(msg || "No se pudo registrar la venta");
                  }
                }
              }}
              disabled={!cajaOpen || saving}
              className={`mt-6 w-full px-4 py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 shadow-md transition-all ${
                darkMode
                  ? "bg-pink-600 hover:bg-pink-700 text-white"
                  : "bg-pink-500 hover:bg-pink-600 text-white"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <CheckCircleIcon
                className={`h-6 w-6 ${
                  saving ? "animate-spin text-white/70" : "text-white"
                }`}
              />
              {saving
                ? "Procesando…"
                : settings?.sales?.enableVentasApi
                ? "Confirmar venta"
                : "Confirmar (demo)"}
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
