import { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useVentas } from "../../hooks/useVentas";
import useSettings from "../../hooks/useSettings";
import SaleDetailModal from "../../components/ventas/SaleDetailModal";

export default function SalesHistory({ darkMode }) {
  const { listVentas, loading } = useVentas();
  const { settings } = useSettings();

  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [medioPago, setMedioPago] = useState("all");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const range = useMemo(() => {
    const now = new Date();
    const pad = (n) => `${n}`.padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const startOfWeek = () => {
      const dup = new Date(now); const day = dup.getDay() || 7; // lunes como 1
      dup.setHours(0,0,0,0);
      dup.setDate(dup.getDate() - (day - 1));
      return dup;
    };
    const startOfMonth = () => { const d = new Date(now.getFullYear(), now.getMonth(), 1); d.setHours(0,0,0,0); return d; };
    const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
    if (dateFilter === 'custom') {
      // Si ambos están definidos y from > to, intercambiar
      let from = customFrom;
      let to = customTo;
      if (from && to && from > to) {
        [from, to] = [to, from];
      }
      const s = from ? from : fmt(startOfToday());
      const e = to ? to : fmt(now);
      return { start: s, end: e };
    } else {
      const s = dateFilter === 'today' ? startOfToday() : dateFilter === 'week' ? startOfWeek() : startOfMonth();
      const e = now;
      return { start: fmt(s), end: fmt(e) };
    }
  }, [dateFilter, customFrom, customTo]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setErrorMsg("");
        if (!settings?.sales?.enableVentasApi) {
          setSales([]); setCount(0); return;
        }
        const { items, count: c } = await listVentas({
          search: searchTerm || undefined,
          startDate: range.start,
          endDate: range.end,
          medioPago,
          page,
        });
        if (!active) return;
        setSales(items);
        setCount(c ?? items.length);
      } catch (e) {
        if (!active) return;
        setSales([]); setCount(0);
        setErrorMsg(e?.message || "No se pudo cargar el historial.");
      }
    })();
    return () => { active = false; };
  }, [listVentas, searchTerm, range.start, range.end, medioPago, page, settings]);

  const totalSales = sales.reduce((sum, sale) => sum + (Number(sale.total)||0), 0);
  const totalTransactions = sales.length;

  const getPaymentIcon = (method) => {
    return method === "cash" 
      ? <BanknotesIcon className="h-4 w-4 text-green-600" />
      : <CreditCardIcon className="h-4 w-4 text-blue-600" />;
  };

  const filteredSales = sales; // filtrado se hace en el backend

  return (
    <div className={`p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white"}`}>
      {!settings?.sales?.enableVentasApi && (
        <div className={`mb-4 p-3 rounded border text-sm ${darkMode ? 'bg-yellow-900/30 border-yellow-700 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
          El historial real de ventas está desactivado en configuración. Activá “API de ventas” para ver datos del backend.
        </div>
      )}
      {!!errorMsg && (
        <div className={`mb-4 p-3 rounded border text-sm ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="font-medium">{errorMsg}</div>
          {errorMsg.includes('Method "GET" not allowed') && (
            <div className={`mt-1 ${darkMode ? 'text-red-200/80' : 'text-red-700/80'}`}>
              El backend no expone un listado de ventas por GET. Intenté rutas alternativas y POST de búsqueda.
              Si persiste, habilitá un endpoint de listado (GET /ventas/ o similar) o uno de búsqueda (POST /ventas/search/).
            </div>
          )}
        </div>
      )}
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
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
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
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              darkMode 
                ? "bg-gray-800 border-gray-600 text-white" 
                : "bg-white border-gray-300"
            }`}
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">Desde</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">Hasta</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); setPage(1); }}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">Pago</span>
          <select
            value={medioPago}
            onChange={(e) => { setMedioPago(e.target.value); setPage(1); }}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              darkMode 
                ? "bg-gray-800 border-gray-600 text-white" 
                : "bg-white border-gray-300"
            }`}
          >
            <option value="all">Todos</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>
      </div>

      {/* Lista de ventas */}
      {loading && (
        <div className={`p-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cargando…</div>
      )}
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
                    {sale.paymentMethod === "cash" ? "Efectivo" : sale.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-bold text-lg">${sale.total.toFixed(2)}</div>
                <button
                  onClick={() => { setSelectedSale(sale); setOpenDetail(true); }}
                  className={`px-3 py-1 text-sm rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                >Ver detalle</button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span>Productos: </span>
              <span>{sale.items.join(", ")}</span>
            </div>
          </div>
        ))}
        {!loading && filteredSales.length === 0 && (
          <div className={`p-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sin resultados.</div>
        )}
      </div>

      {/* Paginación simple */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className={`opacity-70 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Resultados: {count}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded border ${darkMode ? 'border-gray-600 text-gray-200 disabled:opacity-50' : 'border-gray-300 text-gray-700 disabled:opacity-50'}`}
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            className={`px-3 py-1 rounded border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}
          >
            Siguiente
          </button>
        </div>
      </div>

      <SaleDetailModal
        open={openDetail}
        onClose={() => { setOpenDetail(false); setSelectedSale(null); }}
        sale={selectedSale}
        darkMode={darkMode}
      />
    </div>
  );
}