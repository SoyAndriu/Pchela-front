import React, { useEffect, useMemo, useState } from "react";
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
  const [pagePreset, setPagePreset] = useState("balanced"); // fast|balanced|deep

  // Datos de ventas agregadas
  const [ventasRango, setVentasRango] = useState({ total: 0, tickets: 0 });
  const [ultimasVentas, setUltimasVentas] = useState([]);
  const [seriesDias, setSeriesDias] = useState([]); // [{date, total}]
  const [topProductosRango, setTopProductosRango] = useState([]); // [{nombre, cantidad, total}]

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const ymd = (d) => {
      const iso = new Date(d).toISOString();
      return iso.slice(0, 10);
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

        const presetToPages = (preset) => {
          if (preset === "fast") return 2;
          if (preset === "deep") return 10;
          return 6; // balanced
        };
        const maxPages = presetToPages(pagePreset);

        let page = 1; let itemsAll = []; let total = 0; let tickets = 0; let next = null;
        do {
          const { items, next: nxt } = await listVentas({ startDate, endDate, page });
          const safe = Array.isArray(items) ? items : [];
          itemsAll = itemsAll.concat(safe);
          total += safe.reduce((s, v) => s + amountFromVenta(v), 0);
          tickets += safe.length;
          next = nxt; page += 1;
        } while (next && page <= maxPages);

        if (!mounted) return;
        setVentasRango({ total, tickets });

        const base = itemsAll || [];
        const sorted = [...base].sort((a, b) => {
          const da = `${a.date || ""} ${a.time || ""}`;
          const db = `${b.date || ""} ${b.time || ""}`;
          return db.localeCompare(da);
        });
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

        const mapDia = new Map();
        base.forEach(v => {
          const d = v.date || ""; const t = amountFromVenta(v);
          mapDia.set(d, (mapDia.get(d) || 0) + t);
        });
        const dias = Array.from(mapDia.entries()).map(([date, total]) => ({ date, total }))
          .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        setSeriesDias(dias);
      } catch (e) {
        if (mounted) setError(e?.message || "No se pudo cargar ventas del rango");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadVentas();
    return () => { mounted = false; };
  }, [filterMode, customStart, customEnd, pagePreset, listVentas]);

  // KPIs y derivados
  const { productosStockBajo } = useMemo(() => calculateStats(productos || []), [productos]);
  const tiles = [
    { title: "Ventas (rango)", value: fmtMoney(ventasRango.total), Icon: BanknotesIcon },
    { title: "Tickets (rango)", value: ventasRango.tickets, Icon: ClipboardDocumentListIcon },
    { title: "Productos", value: productos?.length || 0, Icon: ShoppingBagIcon },
    { title: "Clientes", value: clientes?.length || 0, Icon: UsersIcon },
    { title: "Proveedores", value: proveedores?.length || 0, Icon: TruckIcon },
  ];

  const cardBase = `p-4 rounded-lg shadow-sm border ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-slate-200"}`;

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

          <div className="flex items-center gap-2">
            <span className={`text-sm ${darkMode ? "text-gray-300" : "text-slate-600"}`}>Precisión:</span>
            <select
              value={pagePreset}
              onChange={(e) => setPagePreset(e.target.value)}
              className={`px-2 py-1.5 rounded border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-slate-300 text-slate-800"}`}
              title="Controla cuántas páginas de ventas se recorren para sumar totales"
            >
              <option value="fast">Rápido</option>
              <option value="balanced">Equilibrado</option>
              <option value="deep">Completo</option>
            </select>
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className={`${cardBase}`}>
              <h3 className="text-lg font-semibold mb-3">Ventas por día</h3>
              {seriesDias.length === 0 || Math.max(...seriesDias.map(d => Number(d.total || 0)), 0) <= 0 ? (
                <p className={`${darkMode ? "text-gray-300" : "text-slate-600"}`}>Sin datos en el rango</p>
              ) : (
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seriesDias} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                      <XAxis dataKey="date" tickFormatter={(v) => (v ? String(v).slice(5) : v)} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} />
                      <YAxis tickFormatter={(v) => `${Math.round(v/1000)}k`} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} />
                      <Tooltip formatter={(value) => fmtMoney(value)} labelFormatter={(l) => `Fecha: ${l}`} contentStyle={{ background: darkMode ? '#111827' : '#ffffff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#e5e7eb' : '#111827' }} />
                      <Bar dataKey="total" fill={darkMode ? "#ec4899" : "#db2777"} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

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
          </div>

          <div className={`${cardBase}`}>
            <h3 className="text-lg font-semibold mb-3">Top productos (rango)</h3>
            {topProductosRango.length === 0 ? (
              <p className={`${darkMode ? "text-gray-300" : "text-slate-600"}`}>Aún sin datos del rango</p>
            ) : (
              <div className="w-full h-64">
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

          <div className={`${cardBase}`}>
            <h3 className="text-lg font-semibold mb-2">Inventario</h3>
            <p
              className={`text-sm ${
                productosStockBajo > 0
                  ? darkMode
                    ? "text-yellow-300"
                    : "text-yellow-700"
                  : darkMode
                  ? "text-green-300"
                  : "text-green-700"
              }`}
            >
              {productosStockBajo > 0 ? `${productosStockBajo} producto(s) con stock bajo` : "Sin productos con stock bajo"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, Icon, darkMode }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm border ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-slate-200"}`}>
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
