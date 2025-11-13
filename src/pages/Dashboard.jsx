import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UsersIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useProducts } from "../hooks/useProducts";
import { useClientes } from "../hooks/useClientes";
import useProveedores from "../hooks/useProveedores";
import useVentas from "../hooks/useVentas";
import useCaja from "../hooks/useCaja";
import { calculateStats } from "../utils/productUtils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const fmtMoney = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n || 0));

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const hasDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    setDarkMode(!!hasDark);
  }, []);

  const { productos, fetchProducts } = useProducts();
  const { items: clientes, fetchAll: fetchClientes } = useClientes();
  const { proveedores, fetchProveedores } = useProveedores();
  const { listVentas } = useVentas();
  const { getSesionAbierta } = useCaja();

  // Caja
  const [cajaAbierta, setCajaAbierta] = useState(null); // true | false | null (desconocido)
  // Filtros y precision
  const [filterMode, setFilterMode] = useState("today"); // today | week | month | custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Datos de ventas agregadas
  const [ventasRango, setVentasRango] = useState({ total: 0, tickets: 0 });
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [seriesDias, setSeriesDias] = useState([]); // [{date, total}]
  const [topProductosRango, setTopProductosRango] = useState([]); // [{nombre, cantidad, total}]

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preferencias de gráfico
  const [chartCompact, setChartCompact] = useState(true);
  const navigate = useNavigate();

  // Cargar catálogos base y estado de caja al montar
  useEffect(() => {
    fetchProducts();
    fetchClientes();
    fetchProveedores();
    (async () => {
      try {
        const s = await getSesionAbierta();
        setCajaAbierta(!!s?.open);
      } catch {
        setCajaAbierta(null);
      }
    })();
  }, [fetchProducts, fetchClientes, fetchProveedores, getSesionAbierta]);

  // Efecto para cargar ventas según rango y precisión
  useEffect(() => {
    let mounted = true;
    const pad = (n) => String(n).padStart(2, '0');
    const ymd = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`; // fecha local (no UTC)
    };
    const amountFromVenta = (v) => {
      let t = Number(v?.total);
      if (!Number.isFinite(t) || t <= 0) {
        const lines = Array.isArray(v?.lineItems) ? v.lineItems : [];
        if (lines.length) {
          t = lines.reduce(
            (s, li) => s + Number(li?.subtotal ?? (Number(li?.precio_unitario || 0) * Number(li?.cantidad || 0))),
            0
          );
        } else {
          t = 0;
        }
      }
      return t;
    };
    const loadVentas = async () => {
      setLoading(true); setError(null);
      try {
        const now = new Date();
        let startDate, endDate;
        if (filterMode === "today") {
          startDate = ymd(now); endDate = ymd(now);
        } else if (filterMode === "week") {
          const w = new Date(now); w.setDate(now.getDate() - 6);
          startDate = ymd(w); endDate = ymd(now);
        } else if (filterMode === "month") {
          startDate = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
          endDate = ymd(now);
        } else {
          startDate = customStart || ymd(now);
          endDate = customEnd || ymd(now);
        }

        const MAX_PAGES = 15; // límite de seguridad por si el backend tiene muchísimas páginas

        let page = 1; let itemsAll = []; let total = 0; let tickets = 0; let next = null;
        do {
          const { items, next: nxt } = await listVentas({ startDate, endDate, page });
          const safe = Array.isArray(items) ? items : [];
          itemsAll = itemsAll.concat(safe);
          total += safe.reduce((s, v) => s + amountFromVenta(v), 0);
          tickets += safe.length;
          next = nxt; page += 1;
  } while (next && page <= MAX_PAGES);

        if (!mounted) return;
        setVentasRango({ total, tickets });

        const base = itemsAll || [];
        const parseForSort = (d, t) => {
          const time = (t || '00:00').slice(0,5);
          if (!d) return 0;
          if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
            const [dd, mm, yyyy] = d.split('-');
            return Date.parse(`${yyyy}-${mm}-${dd}T${time}:00`) || 0;
          }
          return Date.parse(`${d}T${time}:00`) || 0;
        };
        const sorted = [...base].sort((a, b) => parseForSort(b.dateKey || a.date, b.time) - parseForSort(a.dateKey || a.date, a.time));
        setUltimasVentas(sorted.slice(0, 8));

        const agg = new Map();
        base.forEach(v => {
          (v.lineItems || []).forEach(li => {
            const name = li.producto_nombre || "Producto";
            const qty = Number(li.cantidad || 0);
            const subtotal = Number(li.subtotal || (li.precio_unitario || 0) * qty || 0);
            const cur = agg.get(name) || { nombre: name, cantidad: 0, total: 0 };
            cur.cantidad += qty; cur.total += subtotal;
            agg.set(name, cur);
          });
        });
        const top = Array.from(agg.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
        setTopProductosRango(top);

        if (filterMode === 'today') {
          // Serie por hora (HH:00)
          const mapHour = new Map();
          base.forEach(v => {
            const h = String((v.time || '00:00').slice(0,2));
            const t = amountFromVenta(v);
            mapHour.set(h, (mapHour.get(h) || 0) + t);
          });
          let horas;
          if (chartCompact) {
            horas = Array.from(mapHour.entries())
              .sort((a,b) => Number(a[0]) - Number(b[0]))
              .map(([h, total]) => ({ date: `${h}:00`, total }));
          } else {
            // Rellenar 00..23 con ceros donde no hay ventas
            horas = Array.from({ length: 24 }, (_, i) => {
              const h = pad(i);
              return { date: `${h}:00`, total: Number(mapHour.get(h) || 0) };
            });
          }
          setSeriesDias(horas);
        } else {
          // Serie por día (DMY en etiqueta, orden por YMD)
          const mapDia = new Map();
          const toYMD = (key) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
            if (/^\d{2}-\d{2}-\d{4}$/.test(key)) { const [dd,mm,yyyy]=key.split('-'); return `${yyyy}-${mm}-${dd}`; }
            return key;
          };
          base.forEach(v => {
            const raw = v.dateKey || v.date || ""; const t = amountFromVenta(v);
            const ykey = toYMD(String(raw));
            mapDia.set(ykey, (mapDia.get(ykey) || 0) + t);
          });
          let diasEntries;
          if (chartCompact) {
            diasEntries = Array.from(mapDia.entries())
              .sort((a,b) => (a[0]||'').localeCompare(b[0]||''));
          } else {
            // Rellenar todos los días del rango startDate..endDate
            const start = new Date(`${startDate}T00:00:00`);
            const end = new Date(`${endDate}T00:00:00`);
            const days = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
              const key = ymd(d);
              days.push([key, Number(mapDia.get(key) || 0)]);
            }
            diasEntries = days;
          }
          const dias = diasEntries
            .map(([key, total]) => ({ date: `${key.slice(8,10)}-${key.slice(5,7)}-${key.slice(0,4)}`, total }))
          ;
          setSeriesDias(dias);
        }
      } catch (e) {
        if (mounted) setError(e?.message || "No se pudo cargar ventas del rango");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadVentas();
    return () => { mounted = false; };
  }, [filterMode, customStart, customEnd, listVentas, chartCompact]);

  // KPIs y derivados
  const { productosStockBajo } = useMemo(() => calculateStats(productos || []), [productos]);
  const tiles = [
    { title: "Ventas (rango)", value: fmtMoney(ventasRango.total), Icon: BanknotesIcon, onClick: () => navigate('/gerente/ventas') },
    { title: "Tickets (rango)", value: ventasRango.tickets, Icon: ClipboardDocumentListIcon, onClick: () => navigate('/gerente/ventas') },
    { title: "Productos", value: productos?.length || 0, Icon: ShoppingBagIcon, onClick: () => navigate('/gerente/productos') },
    { title: "Clientes", value: clientes?.length || 0, Icon: UsersIcon, onClick: () => navigate('/gerente/clientes') },
    { title: "Proveedores", value: proveedores?.length || 0, Icon: TruckIcon, onClick: () => navigate('/gerente/proveedores') },
    { title: "Stock bajo", value: productosStockBajo, Icon: ExclamationTriangleIcon, onClick: () => navigate('/gerente/productos?stock=bajo', { state: { stockFilter: 'bajo' } }) },
  ];

  const cardBase = `p-4 rounded-lg shadow-sm border ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-slate-200"}`;

  // Dimensiones reactivas para gráficos según cantidad de puntos
  const chartDims = useMemo(() => {
    const n = Array.isArray(seriesDias) ? seriesDias.length : 0;
    // Altura base 220px, crece 8px por barra, sin tope superior para ocupar el espacio necesario
    const height = Math.max(220, 180 + n * 8);
    return { height };
  }, [seriesDias]);

  // Ajustes de barras y etiquetas para evitar scroll horizontal
  const barTuning = useMemo(() => {
    const n = Array.isArray(seriesDias) ? seriesDias.length : 0;
    const compactBase = n > 60 ? '1%' : n > 40 ? '3%' : n > 25 ? '6%' : '10%';
    const spacedBase = n > 60 ? '4%' : n > 40 ? '6%' : n > 25 ? '10%' : '16%';
    const gap = chartCompact ? compactBase : spacedBase;
    // Queremos aprox. 10-12 etiquetas visibles
    const interval = n > 0 ? Math.max(0, Math.ceil(n / 12) - 1) : 0;
    const maxBarSize = chartCompact ? 22 : 32; // Compacto vs espaciado
    return { gap, interval, maxBarSize };
  }, [seriesDias, chartCompact]);

  // Serie directa (sin escala log)
  const seriesDiasForChart = seriesDias;
  const chartTitle = filterMode === 'today' ? 'Ventas por hora (hoy)' : 'Ventas por día';
  const xTickFormatter = useMemo(() => {
    if (filterMode === 'today') return (v) => v;
    return (v) => {
      const s = String(v || '');
      if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s.slice(0, 5); // dd-mm
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(5);    // mm-dd
      return s;
    };
  }, [filterMode]);
  const tooltipLabel = useMemo(() => filterMode === 'today' ? (l) => `Hora: ${l}` : (l) => `Fecha: ${l}`, [filterMode]);
  const chartKey = useMemo(() => {
    const first = seriesDias[0]?.date || '';
    const last = seriesDias[seriesDias.length - 1]?.date || '';
    return `${filterMode}-${chartCompact}-${first}-${last}-${seriesDias.length}`;
  }, [filterMode, chartCompact, seriesDias]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Panel General</h2>
        <p className={`${darkMode ? "text-gray-300" : "text-slate-600"}`}>Resumen del sistema</p>
      </div>

      <div className={`p-4 rounded-lg shadow-sm border mb-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm ${darkMode ? "text-gray-300" : "text-slate-600"}`}>Rango:</span>
            <div className="flex items-center gap-1">
              {[
                { k: "today", label: "Hoy" },
                { k: "week", label: "Semana" },
                { k: "month", label: "Mes" },
                { k: "custom", label: "Personalizado" },
              ].map(({ k, label }) => (
                <button
                  key={k}
                  onClick={() => setFilterMode(k)}
                  className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                    filterMode === k
                      ? (darkMode ? "bg-pink-600 text-white border-pink-600" : "bg-pink-500 text-white border-pink-500")
                      : (darkMode ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50")
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filterMode === "custom" && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm">Desde</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={`px-2 py-1.5 rounded border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-slate-300 text-slate-800"}`}
              />
              <label className="text-sm">Hasta</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={`px-2 py-1.5 rounded border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-slate-300 text-slate-800"}`}
              />
            </div>
          )}

          {/* Selector de precisión removido por simplicidad */}
        </div>
      </div>

      {loading && <div className={`${cardBase}`}>Cargando datos…</div>}
      {error && !loading && (
        <div className={`${cardBase} border-red-400 ${darkMode ? "text-red-300" : "text-red-700"}`}>
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {tiles.map((s, i) => (
              <StatCard key={i} {...s} darkMode={darkMode} />
            ))}
          </div>

          <div className={`${cardBase} mb-6`}>
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-slate-600"}`}>Estado de caja</p>
              <p
                className={`text-xl font-semibold ${
                  cajaAbierta ? (darkMode ? "text-green-400" : "text-green-700") : (darkMode ? "text-red-300" : "text-red-600")
                }`}
              >
                {cajaAbierta == null ? "—" : cajaAbierta ? "Abierta" : "Cerrada"}
              </p>
            </div>
          </div>

          {/* Gráfico principal */}
          <div className={`${cardBase} mb-8`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{chartTitle}</h3>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={chartCompact} onChange={(e) => setChartCompact(e.target.checked)} />
                    <span>Compacto</span>
                  </label>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {seriesDias.length === 0 || Math.max(...seriesDias.map(d => Number(d.total || 0)), 0) <= 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`${darkMode ? "text-gray-300" : "text-slate-600"}`}
                  >
                    Sin datos en el rango
                  </motion.p>
                ) : (
                  <motion.div
                    key={chartKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="w-full"
                    style={{ height: chartDims.height }}
                  >
                    <ResponsiveContainer width="100%" height={chartDims.height}>
                      <BarChart data={seriesDiasForChart} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} barCategoryGap={barTuning.gap} barGap={0} maxBarSize={barTuning.maxBarSize}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={xTickFormatter}
                          stroke={darkMode ? "#d1d5db" : "#374151"}
                          fontSize={12}
                          angle={-30}
                          textAnchor="end"
                          height={40}
                          interval={barTuning.interval}
                        />
                        <YAxis tickFormatter={(v) => `${Math.round(v/1000)}k`} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} />
                        <Tooltip
                          formatter={(value) => fmtMoney(value)}
                          labelFormatter={tooltipLabel}
                          contentStyle={{ background: darkMode ? '#111827' : '#ffffff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#e5e7eb' : '#111827' }}
                        />
                        <Bar dataKey="total" fill={darkMode ? "#ec4899" : "#db2777"} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={350} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          <div className={`${cardBase}`}>
            <h3 className="text-lg font-semibold mb-3">Top productos (rango)</h3>
            {topProductosRango.length === 0 ? (
              <p className={`${darkMode ? "text-gray-300" : "text-slate-600"}`}>Aún sin datos del rango</p>
            ) : (
              <div className="w-full" style={{ height: Math.max(200, 80 + topProductosRango.length * 36) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...topProductosRango].reverse()} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis type="number" tickFormatter={(v) => fmtMoney(v)} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} />
                    <YAxis type="category" dataKey="nombre" width={140} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} />
                    <Tooltip formatter={(value) => fmtMoney(value)} contentStyle={{ background: darkMode ? '#111827' : '#ffffff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#e5e7eb' : '#111827' }} />
                    <Bar dataKey="total" fill={darkMode ? "#ec4899" : "#db2777"} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Últimas ventas debajo de Top productos */}
          <div className={`${cardBase}`}>
            <h3 className="text-lg font-semibold mb-3">Últimas ventas</h3>
            {ultimasVentas.length === 0 ? (
              <p className={`${darkMode ? "text-gray-300" : "text-slate-600"}`}>Sin ventas recientes</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {ultimasVentas.map((v, i) => (
                  <li key={i} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{v.cliente}</p>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                        {v.date} {v.time} • {v.paymentMethod}
                      </p>
                    </div>
                    <div className="text-sm font-semibold">{fmtMoney((() => { const a = Number(v?.total); if (Number.isFinite(a) && a > 0) return a; const l = Array.isArray(v?.lineItems) ? v.lineItems : []; return l.reduce((s, li) => s + Number(li?.subtotal ?? (Number(li?.precio_unitario || 0) * Number(li?.cantidad || 0))), 0); })())}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* La alerta de inventario ahora forma parte de las tarjetas superiores como 'Stock bajo' */}
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, Icon, darkMode, onClick }) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      className={`p-4 rounded-lg shadow-sm border transition ${
        darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-slate-200"
      } ${clickable ? (darkMode ? 'hover:bg-gray-750 cursor-pointer' : 'hover:bg-slate-50 cursor-pointer') : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-slate-600"}`}>{title}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
        {Icon && <Icon className="w-7 h-7 opacity-80" />}
      </div>
    </div>
  );
}
