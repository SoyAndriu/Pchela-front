import React, { useEffect, useMemo, useState } from "react";
import { FunnelIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import useVentas from "../hooks/useVentas";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const fmtMoney = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(n || 0));

function Stat({ title, value, darkMode }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm border transition hover:shadow-md ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
      <p className={`text-sm mb-1 ${darkMode ? "text-gray-300" : "text-slate-600"}`}>{title}</p>
      <p className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

export default function Reportes({ darkMode }) {
  const { listVentas } = useVentas();
  const [filterMode, setFilterMode] = useState("30d"); // 7d | 30d | 90d | ytd | custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [medioPago, setMedioPago] = useState("all"); // all|cash|card|transfer

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [pageIndex, setPageIndex] = useState(0); // paginación UI
  const pageSize = 10;

  // Carga de ventas según filtros
  useEffect(() => {
    let mounted = true;
    const ymd = (d) => new Date(d).toISOString().slice(0, 10);
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const now = new Date();
        let startDate, endDate;
        if (filterMode === "7d") {
          const a = new Date(now); a.setDate(now.getDate() - 6); startDate = ymd(a); endDate = ymd(now);
        } else if (filterMode === "30d") {
          const a = new Date(now); a.setDate(now.getDate() - 29); startDate = ymd(a); endDate = ymd(now);
        } else if (filterMode === "90d") {
          const a = new Date(now); a.setDate(now.getDate() - 89); startDate = ymd(a); endDate = ymd(now);
        } else if (filterMode === "ytd") {
          startDate = ymd(new Date(now.getFullYear(), 0, 1)); endDate = ymd(now);
        } else {
          startDate = customStart || ymd(now); endDate = customEnd || ymd(now);
        }
        const MAX_PAGES = 30;
        let page = 1, all = [], next = null;
        do {
          const { items, next: nxt } = await listVentas({ startDate, endDate, page, medioPago });
          const safe = Array.isArray(items) ? items : [];
          all = all.concat(safe);
          next = nxt; page += 1;
        } while (next && page <= MAX_PAGES);
        if (!mounted) return;
        setVentas(all);
        setPageIndex(0); // reset a la primera página al cambiar filtros
      } catch (e) {
        if (mounted) setError(e?.message || "No se pudo cargar reportes");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [filterMode, customStart, customEnd, medioPago, listVentas]);

  // Agregaciones
  const kpis = useMemo(() => {
    const total = ventas.reduce((s, v) => s + Number(v.total || 0), 0);
    const tickets = ventas.length;
    const avg = tickets ? total / tickets : 0;
    return { total, tickets, avg };
  }, [ventas]);

  const seriesDias = useMemo(() => {
    const map = new Map();
    ventas.forEach(v => {
      map.set(v.date, (map.get(v.date) || 0) + Number(v.total || 0));
    });
    return Array.from(map.entries()).map(([date, total]) => ({ date, total }))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [ventas]);

  const topProductos = useMemo(() => {
    const agg = new Map();
    ventas.forEach(v => (v.lineItems || []).forEach(li => {
      const name = li.producto_nombre || 'Producto';
      const qty = Number(li.cantidad || 0);
      const subtotal = Number(li.subtotal || (li.precio_unitario || 0) * qty || 0);
      const cur = agg.get(name) || { nombre: name, cantidad: 0, total: 0 };
      cur.cantidad += qty; cur.total += subtotal; agg.set(name, cur);
    }));
    return Array.from(agg.values()).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [ventas]);

  const distPago = useMemo(() => {
    const map = new Map();
    ventas.forEach(v => map.set(v.paymentMethod || 'otro', (map.get(v.paymentMethod || 'otro') || 0) + Number(v.total || 0)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [ventas]);

  const COLORS = ["#db2777", "#0ea5e9", "#22c55e", "#f59e0b", "#a78bfa", "#ef4444"]; // pie colors

  const exportCSV = () => {
    const headers = ["id","fecha","hora","cliente","medio","total"];
    const rows = ventas.map(v => [v.id, v.date, v.time, v.cliente, v.paymentMethod, v.total]);
    const csv = [headers.join(','), ...rows.map(r => r.map(x => typeof x === 'string' ? `"${x.replace(/"/g, '""')}"` : x).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ventas_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Derivados de paginación
  const totalPages = useMemo(() => Math.max(1, Math.ceil((ventas?.length || 0) / pageSize)), [ventas?.length]);
  const pageVentas = useMemo(() => {
    const start = pageIndex * pageSize;
    return ventas.slice(start, start + pageSize);
  }, [ventas, pageIndex]);
  useEffect(() => {
    if (pageIndex > totalPages - 1) setPageIndex(0);
  }, [totalPages, pageIndex]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Reportes</h1>
          <p className={`${darkMode ? "text-gray-400" : "text-slate-600"}`}>Análisis por rango, top productos y medios de pago</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${darkMode ? "border-gray-600 bg-gray-800" : "border-slate-300 bg-white"}`}>
            <FunnelIcon className="w-4 h-4" />
            <select className={`bg-transparent focus:outline-none text-sm ${darkMode ? "text-gray-200" : "text-slate-700"}`} value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
              <option value="7d">7 días</option>
              <option value="30d">30 días</option>
              <option value="90d">90 días</option>
              <option value="ytd">Año en curso</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          {filterMode === 'custom' && (
            <div className="flex items-center gap-2">
              <label className="text-sm">Desde</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={`px-2 py-1.5 rounded border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-slate-300 text-slate-700'}`} />
              <label className="text-sm">Hasta</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={`px-2 py-1.5 rounded border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-slate-300 text-slate-700'}`} />
            </div>
          )}
          <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${darkMode ? "border-gray-600 bg-gray-800" : "border-slate-300 bg-white"}`}>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Medio:</span>
            <select className={`bg-transparent focus:outline-none text-sm ${darkMode ? "text-gray-200" : "text-slate-700"}`} value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
              <option value="all">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded bg-pink-600 text-white text-sm hover:bg-pink-700">
            <ArrowDownTrayIcon className="w-4 h-4" /> Exportar ventas (CSV)
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Ventas (rango)" value={fmtMoney(kpis.total)} darkMode={darkMode} />
        <Stat title="Tickets" value={kpis.tickets} darkMode={darkMode} />
        <Stat title="Ticket promedio" value={fmtMoney(kpis.avg)} darkMode={darkMode} />
        <Stat title="Días con ventas" value={seriesDias.length} darkMode={darkMode} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ventas por día */}
        <div className={`xl:col-span-2 p-4 rounded-lg shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
          <h3 className="text-lg font-semibold mb-3">Ventas por día</h3>
          <div style={{ height: Math.max(240, 160 + seriesDias.length * 8) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seriesDias} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="date" tickFormatter={(v) => (v ? String(v).slice(5) : v)} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} angle={-30} textAnchor="end" height={40} />
                <YAxis tickFormatter={(v) => `${Math.round(v/1000)}k`} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} />
                <Tooltip formatter={(value) => fmtMoney(value)} labelFormatter={(l) => `Fecha: ${l}`} contentStyle={{ background: darkMode ? '#111827' : '#ffffff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#e5e7eb' : '#111827' }} />
                <Bar dataKey="total" fill={darkMode ? "#ec4899" : "#db2777"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por medio de pago */}
        <div className={`p-4 rounded-lg shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
          <h3 className="text-lg font-semibold mb-3">Medios de pago</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distPago} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} label>
                  {distPago.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [fmtMoney(v), n]} contentStyle={{ background: darkMode ? '#111827' : '#ffffff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#e5e7eb' : '#111827' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top productos */}
      <div className={`p-4 rounded-lg shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <h3 className="text-lg font-semibold mb-3">Top productos por importe</h3>
        <div style={{ height: Math.max(240, 100 + topProductos.length * 36) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...topProductos].reverse()} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
              <XAxis type="number" tickFormatter={(v) => fmtMoney(v)} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} />
              <YAxis type="category" dataKey="nombre" width={160} stroke={darkMode ? "#d1d5db" : "#374151"} fontSize={12} />
              <Tooltip formatter={(value) => fmtMoney(value)} contentStyle={{ background: darkMode ? '#111827' : '#ffffff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#e5e7eb' : '#111827' }} />
              <Bar dataKey="total" fill={darkMode ? "#ec4899" : "#db2777"} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className={`mt-2 rounded-lg shadow-sm border overflow-x-auto ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-slate-700"}>
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Medio</th>
              <th className="px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {pageVentas.map((v) => (
              <tr key={v.id} className={darkMode ? "border-t border-gray-700" : "border-t border-slate-200"}>
                <td className="px-4 py-2">#{v.id}</td>
                <td className="px-4 py-2">{v.date} {v.time}</td>
                <td className="px-4 py-2">{v.cliente}</td>
                <td className="px-4 py-2">{v.paymentMethod}</td>
                <td className="px-4 py-2">{fmtMoney(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Paginación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3">
          <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
            {ventas.length === 0 ? (
              <>Sin resultados</>
            ) : (
              <>Mostrando {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, ventas.length)} de {ventas.length}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1.5 rounded border text-sm ${darkMode ? 'border-gray-700 text-gray-200' : 'border-slate-300 text-slate-700'} disabled:opacity-50`}
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
            >
              « Primero
            </button>
            <button
              className={`px-3 py-1.5 rounded border text-sm ${darkMode ? 'border-gray-700 text-gray-200' : 'border-slate-300 text-slate-700'} disabled:opacity-50`}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              ‹ Anterior
            </button>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Página {pageIndex + 1} de {totalPages}</span>
            <button
              className={`px-3 py-1.5 rounded border text-sm ${darkMode ? 'border-gray-700 text-gray-200' : 'border-slate-300 text-slate-700'} disabled:opacity-50`}
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
            >
              Siguiente ›
            </button>
            <button
              className={`px-3 py-1.5 rounded border text-sm ${darkMode ? 'border-gray-700 text-gray-200' : 'border-slate-300 text-slate-700'} disabled:opacity-50`}
              onClick={() => setPageIndex(totalPages - 1)}
              disabled={pageIndex >= totalPages - 1}
            >
              Última »
            </button>
          </div>
        </div>
        {loading && <div className="px-4 py-3 text-sm">Cargando…</div>}
        {error && !loading && <div className="px-4 py-3 text-sm text-red-500">{String(error)}</div>}
      </div>
    </div>
  );
}
