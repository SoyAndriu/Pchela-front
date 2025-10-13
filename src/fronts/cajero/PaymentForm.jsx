import { useEffect, useState } from "react";
import useCaja from "../../hooks/useCaja";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon, CalculatorIcon } from "@heroicons/react/24/outline";
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

  // Estados de venta
  const [clienteSel, setClienteSel] = useState(null);
  const [items, setItems] = useState([]);
  const [medioPago, setMedioPago] = useState('EFECTIVO');

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
  }, [getSesionAbierta]);

  useEffect(() => {
    if (!cajaLoading && !cajaOpen && !cajaErr) {
      setToastType("info");
      setToastMsg("Abrí la caja para procesar cobros");
    }
  }, [cajaLoading, cajaOpen, cajaErr]);

  return (
    <div className={`p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}>
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg("")} />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CalculatorIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Cobro en Caja</h2>
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

        {/* Cliente y Carrito */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className={`md:col-span-2 rounded border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="font-semibold mb-3">Cliente</h3>
            <SearchableClientSelect value={clienteSel} onSelect={setClienteSel} darkMode={darkMode} />
            <div className="mt-4">
              <Cart value={items} onChange={setItems} darkMode={darkMode} />
            </div>
          </div>
          <div className={`rounded border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <PaymentMethodSelect value={medioPago} onChange={setMedioPago} darkMode={darkMode} />
            <div className="mt-4 text-sm opacity-80">Caja: {cajaOpen ? 'Abierta' : 'Cerrada'}</div>
            <button
              onClick={async () => {
                if (!cajaOpen) { setToastType('info'); setToastMsg('Abrí la caja para confirmar'); return; }
                if (items.length === 0) { setToastType('info'); setToastMsg('Agregá al menos un producto'); return; }
                const payload = {
                  cliente_id: clienteSel?.usuario ?? null,
                  items: items.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad, precio_unitario: i.precio_unitario })),
                  medio_pago: medioPago,
                  notas: 'POS Cajero',
                  idempotency_key: `venta-${Date.now()}`,
                };
                const useApi = !!settings?.sales?.enableVentasApi;
                try {
                  if (useApi) {
                    await createVenta(payload);
                  }
                  setToastType('success');
                  setToastMsg('Venta registrada correctamente');
                  setItems([]);
                  setClienteSel(null);
                } catch (e) {
                  const msg = e?.message || '';
                  if (msg.includes('409') || msg.toLowerCase().includes('caja')) {
                    setToastType('error'); setToastMsg('Caja no abierta para operar ventas');
                  } else {
                    setToastType('error'); setToastMsg(msg || 'No se pudo registrar la venta');
                  }
                }
              }}
              disabled={!cajaOpen || saving}
              className={`mt-4 w-full px-4 py-3 rounded ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'} disabled:opacity-60`}
            >
              <CheckCircleIcon className="h-5 w-5 inline-block mr-2" />
              {saving ? 'Procesando…' : (settings?.sales?.enableVentasApi ? 'Confirmar venta' : 'Confirmar (demo)')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}