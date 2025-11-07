import React, { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, CalendarDaysIcon, ArrowDownTrayIcon, EyeIcon } from "@heroicons/react/24/outline";
import { useVentas } from "../hooks/useVentas";
import SaleDetailModal from "../components/ventas/SaleDetailModal";
import { useEmpleados } from "../hooks/useEmpleados";
import EmpleadoDetailModal from "../components/empleados/EmpleadoDetailModal";

export default function Ventas({ darkMode }) {
  const { listVentas, loading } = useVentas();
  const empleadosHook = useEmpleados();
  const { items: empleados, fetchAll: fetchEmpleados, getById: getEmpleadoById } = empleadosHook;

  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [medioPago, setMedioPago] = useState("all");
  const [empleadoId, setEmpleadoId] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [empOpen, setEmpOpen] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState("");
  const [empData, setEmpData] = useState(null);

  useEffect(() => {
    // cargar empleados una vez para el filtro
    fetchEmpleados?.();
  }, [fetchEmpleados]);

  const openEmpleadoModal = async (id) => {
    if (!id) return;
    setEmpOpen(true);
    setEmpLoading(true);
    setEmpError("");
    setEmpData(null);
    try {
      const data = await getEmpleadoById(id);
      setEmpData(data);
    } catch (e) {
      setEmpError(e?.message || 'No se pudo cargar el empleado');
    } finally {
      setEmpLoading(false);
    }
  };

  const range = useMemo(() => {
    const now = new Date();
    const pad = (n) => `${n}`.padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const startOfWeek = () => {
      const dup = new Date(now); const day = dup.getDay() || 7; // lunes=1
      dup.setHours(0,0,0,0);
      dup.setDate(dup.getDate() - (day - 1));
      return dup;
    };
    const startOfMonth = () => { const d = new Date(now.getFullYear(), now.getMonth(), 1); d.setHours(0,0,0,0); return d; };
    const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
    if (dateFilter === 'custom') {
      let from = customFrom;
      let to = customTo;
      if (from && to && from > to) [from, to] = [to, from];
      const s = from || fmt(startOfToday());
      const e = to || fmt(now);
      return { start: s, end: e };
    }
    const s = dateFilter === 'today' ? startOfToday() : dateFilter === 'week' ? startOfWeek() : startOfMonth();
    const e = now;
    return { start: fmt(s), end: fmt(e) };
  }, [dateFilter, customFrom, customTo]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setErrorMsg("");
        const { items, count: c } = await listVentas({
          search: searchTerm || undefined,
          startDate: range.start,
          endDate: range.end,
          medioPago,
          empleadoId: empleadoId ? Number(empleadoId) : undefined,
          page,
        });
        if (!active) return;
        setSales(items);
        setCount(c ?? items.length);
      } catch (e) {
        if (!active) return;
        setSales([]); setCount(0);
        setErrorMsg(e?.message || "No se pudo cargar ventas.");
      }
    })();
    return () => { active = false; };
  }, [listVentas, searchTerm, range.start, range.end, medioPago, empleadoId, page]);

  const kpi = useMemo(() => {
    const sum = (arr, key) => arr.reduce((s, it) => s + (Number(it?.[key]) || 0), 0);
    const total = sum(sales, 'total');
    const bruto = sum(sales, 'bruto');
    const descuento = sum(sales, 'descuento');
    const ticket = sales.length ? total / sales.length : 0;
    return { total, bruto, descuento, ticket, cantidad: sales.length };
  }, [sales]);

  const pmLabel = (method) => {
    const m = (method || '').toString().toLowerCase();
    if (m === 'cash' || m.includes('efec')) return 'Efectivo';
    if (m === 'transfer' || m.includes('transfer')) return 'Transferencia';
    return m ? (m[0].toUpperCase() + m.slice(1)) : '-';
  };

  const exportCSV = () => {
    const headers = ['Fecha','Hora','Número','Cliente','Empleado','Medio','Bruto','Descuento','Total'];
    const rows = sales.map(s => [
      s.date || '',
      s.time || '',
      s.numero || '',
      s.cliente || '',
      s.empleado || '',
      pmLabel(s.paymentMethod),
      (s.bruto ?? '').toString().replace('.',','),
      (s.descuento ?? '').toString().replace('.',','),
      (s.total ?? '').toString().replace('.',','),
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${(x ?? '').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas_${range.start}_a_${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ventas (Gerencia)</h1>
        <button onClick={exportCSV} className={`flex items-center gap-2 px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
          <ArrowDownTrayIcon className="h-5 w-5" />
          Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
          <div className="text-sm opacity-70">Total vendido</div>
          <div className="text-2xl font-bold text-blue-600">${kpi.total.toFixed(2)}</div>
        </div>
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-green-50 border-green-200'}`}>
          <div className="text-sm opacity-70">Cantidad de ventas</div>
          <div className="text-2xl font-bold text-green-600">{kpi.cantidad}</div>
        </div>
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-purple-200'}`}>
          <div className="text-sm opacity-70">Ticket promedio</div>
          <div className="text-2xl font-bold text-purple-600">${kpi.ticket.toFixed(2)}</div>
        </div>
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-amber-50 border-amber-200'}`}>
          <div className="text-sm opacity-70">Descuentos</div>
          <div className="text-2xl font-bold text-amber-600">${kpi.descuento.toFixed(2)}</div>
        </div>
      </div>

      {/* Filtros */}
      {errorMsg && (
        <div className={`mb-3 p-3 rounded border text-sm ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>{errorMsg}</div>
      )}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, producto o número…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className={`w-full pl-10 pr-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e)=>{ setDateFilter(e.target.value); setPage(1); }}
            className={`px-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">Desde</span>
              <input type="date" value={customFrom} onChange={(e)=>{ setCustomFrom(e.target.value); setPage(1); }} className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">Hasta</span>
              <input type="date" value={customTo} onChange={(e)=>{ setCustomTo(e.target.value); setPage(1); }} className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">Pago</span>
          <select
            value={medioPago}
            onChange={(e)=>{ setMedioPago(e.target.value); setPage(1); }}
            className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="all">Todos</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">Empleado</span>
          <select
            value={empleadoId}
            onChange={(e)=>{ setEmpleadoId(e.target.value); setPage(1); }}
            className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="">Todos</option>
            {(empleados || []).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nombre_completo || [emp.nombre, emp.apellido].filter(Boolean).join(' ') || `Empleado #${emp.id}`}</option>
            ))}
          </select>
        </div>
        <div>
          <button onClick={()=>{ setSearchTerm(""); setDateFilter('today'); setCustomFrom(""); setCustomTo(""); setMedioPago('all'); setEmpleadoId(""); setPage(1); }} className={`px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      <div className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`w-full overflow-auto`}>
          <table className="min-w-[900px] w-full text-sm">
            <thead className={darkMode ? 'bg-gray-900/40 text-gray-300' : 'bg-gray-50 text-gray-700'}>
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">N°</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Empleado</th>
                <th className="text-left px-4 py-3">Medio</th>
                <th className="text-right px-4 py-3">Bruto</th>
                <th className="text-right px-4 py-3">Desc.</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-4 opacity-70">Cargando…</td></tr>
              )}
              {!loading && sales.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-4 opacity-70">Sin resultados.</td></tr>
              )}
              {sales.map(s => (
                <tr key={s.id} className={darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}>
                  <td className="px-4 py-2 whitespace-nowrap">{s.date} {s.time}</td>
                  <td className="px-4 py-2">{s.numero ?? s.id ?? '-'}</td>
                  <td className="px-4 py-2">{s.cliente}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span>{s.empleado || '-'}</span>
                      {s.empleado_id && (
                        <button
                          type="button"
                          onClick={()=> openEmpleadoModal(s.empleado_id)}
                          className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          title="Ver empleado"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">{pmLabel(s.paymentMethod)}</td>
                  <td className="px-4 py-2 text-right">{s.bruto != null ? `$${Number(s.bruto).toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-2 text-right">{s.descuento != null ? `-$${Math.abs(Number(s.descuento)).toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-2 text-right font-medium">${Number(s.total).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={()=>{ setSelectedSale(s); setOpenDetail(true); }} className={`px-3 py-1 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="px-4 py-3 flex items-center justify-between text-sm">
          <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Resultados: {count}</div>
          <div className="flex gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className={`px-3 py-1 rounded border ${darkMode ? 'border-gray-600 text-gray-200 disabled:opacity-50' : 'border-gray-300 text-gray-700 disabled:opacity-50'}`}>Anterior</button>
            <button onClick={()=>setPage(p=>p+1)} className={`px-3 py-1 rounded border ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}>Siguiente</button>
          </div>
        </div>
      </div>

      <SaleDetailModal open={openDetail} onClose={()=>{ setOpenDetail(false); setSelectedSale(null); }} sale={selectedSale} darkMode={darkMode} />
      <EmpleadoDetailModal open={empOpen} onClose={()=>{ setEmpOpen(false); setEmpData(null); setEmpError(""); }} empleado={empData} loading={empLoading} error={empError} darkMode={darkMode} />
    </div>
  );
}