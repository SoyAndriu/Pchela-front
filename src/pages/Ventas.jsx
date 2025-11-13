import React, { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, CalendarDaysIcon, ArrowDownTrayIcon, EyeIcon } from "@heroicons/react/24/outline";
import { useVentas } from "../hooks/useVentas";
import SaleDetailModal from "../components/ventas/SaleDetailModal";
import { useEmpleados } from "../hooks/useEmpleados";
import EmpleadoDetailModal from "../components/empleados/EmpleadoDetailModal";
import Pagination from "../components/Pagination";
import { exportTablePDF } from "../utils/pdfExport";

export default function Ventas({ darkMode }) {
  const { listVentas, loading } = useVentas();
  const empleadosHook = useEmpleados();
  const { items: empleados, fetchAll: fetchEmpleados, getById: getEmpleadoById } = empleadosHook;

  const [allSales, setAllSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [medioPago, setMedioPago] = useState("all");
  const [empleadoId, setEmpleadoId] = useState("");
  // Paginación client-side
  const [uiPage, setUiPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [empOpen, setEmpOpen] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState("");
  const [empData, setEmpData] = useState(null);
  // Ordenamiento: una sola columna activa
  const [sortKey, setSortKey] = useState(null); // 'id' | 'fecha' | 'bruto' | 'descuento' | 'total'
  const [sortDir, setSortDir] = useState('asc');

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
        const MAX_PAGES = 30;
        let page = 1; let all = []; let next = null;
        do {
          const { items, next: nxt } = await listVentas({
            search: searchTerm || undefined,
            startDate: range.start,
            endDate: range.end,
            medioPago,
            empleadoId: empleadoId ? Number(empleadoId) : undefined,
            page,
          });
          const safe = Array.isArray(items) ? items : [];
          all = all.concat(safe);
          next = nxt; page += 1;
        } while (next && page <= MAX_PAGES);
        if (!active) return;
        setAllSales(all);
        setUiPage(1);
      } catch (e) {
        if (!active) return;
        setAllSales([]);
        setErrorMsg(e?.message || "No se pudo cargar ventas.");
      }
    })();
    return () => { active = false; };
  }, [listVentas, searchTerm, range.start, range.end, medioPago, empleadoId]);

  const kpi = useMemo(() => {
    const sum = (arr, key) => arr.reduce((s, it) => s + (Number(it?.[key]) || 0), 0);
    const total = sum(allSales, 'total');
    const bruto = sum(allSales, 'bruto');
    const descuento = sum(allSales, 'descuento');
    const ticket = allSales.length ? total / allSales.length : 0;
    return { total, bruto, descuento, ticket, cantidad: allSales.length };
  }, [allSales]);

  const pmLabel = (method) => {
    const m = (method || '').toString().toLowerCase();
    if (m === 'cash' || m.includes('efec')) return 'Efectivo';
    if (m === 'transfer' || m.includes('transfer')) return 'Transferencia';
    return m ? (m[0].toUpperCase() + m.slice(1)) : '-';
  };

  // Derivar ventas ordenadas (local a la página)
  const sortedAllSales = useMemo(() => {
    if (!sortKey) return allSales;
    const arr = [...allSales];
    const parseForSort = (d, t) => {
      const time = (t || '00:00').slice(0,5);
      if (!d) return 0;
      if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
        const [dd, mm, yyyy] = d.split('-');
        return Date.parse(`${yyyy}-${mm}-${dd}T${time}:00`) || 0;
      }
      return Date.parse(`${d}T${time}:00`) || 0;
    };
    const getVal = (s) => {
      switch (sortKey) {
        case 'id': return Number(s.id) || 0;
        case 'fecha': return s.dateKey ? parseForSort(s.dateKey, s.time) : parseForSort(s.date, s.time);
        case 'bruto': return s.bruto != null ? Number(s.bruto) : -Infinity;
        case 'descuento': return s.descuento != null ? Number(s.descuento) : -Infinity;
        case 'total': return s.total != null ? Number(s.total) : -Infinity;
        default: return 0;
      }
    };
    arr.sort((a,b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (va === vb) return 0;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return arr;
  }, [allSales, sortKey, sortDir]);

  // Slice por página
  const totalItems = allSales.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageSales = useMemo(() => {
    const src = sortKey ? sortedAllSales : allSales;
    const start = (uiPage - 1) * pageSize;
    return src.slice(start, start + pageSize);
  }, [sortedAllSales, allSales, sortKey, uiPage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key) => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? '▲' : '▼';
  };

  const exportPDF = () => {
    const headers = ['Fecha','Hora','Número','Cliente','Empleado','Medio','Bruto','Descuento','Total'];
    const src = sortKey ? sortedAllSales : allSales;
    const rows = src.map(s => [
      s.date || '',
      s.time || '',
      s.numero || '',
      s.cliente || '',
      s.empleado || '',
      pmLabel(s.paymentMethod),
      (s.bruto != null ? `$${Number(s.bruto).toFixed(2)}` : '-'),
      (s.descuento != null ? `$${Number(s.descuento).toFixed(2)}` : '-'),
      `$${Number(s.total || 0).toFixed(2)}`,
    ]);
    exportTablePDF({
      title: 'Ventas (Gerencia)',
      columns: headers,
      rows,
      fileName: `ventas_${range.start}_a_${range.end}`,
      orientation: 'landscape',
      meta: { Rango: `${range.start} a ${range.end}`, Total: `$${kpi.total.toFixed(2)}`, Ticket: `$${kpi.ticket.toFixed(2)}`, Cantidad: kpi.cantidad }
    });
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ventas (Gerencia)</h1>
        <button onClick={exportPDF} className={`flex items-center gap-2 px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
          <ArrowDownTrayIcon className="h-5 w-5" />
          Exportar PDF
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
            onChange={(e) => { setSearchTerm(e.target.value); setUiPage(1); }}
            className={`w-full pl-10 pr-3 py-2 rounded border focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e)=>{ setDateFilter(e.target.value); setUiPage(1); }}
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
              <input type="date" value={customFrom} onChange={(e)=>{ setCustomFrom(e.target.value); setUiPage(1); }} className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">Hasta</span>
              <input type="date" value={customTo} onChange={(e)=>{ setCustomTo(e.target.value); setUiPage(1); }} className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">Pago</span>
          <select
            value={medioPago}
            onChange={(e)=>{ setMedioPago(e.target.value); setUiPage(1); }}
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
            onChange={(e)=>{ setEmpleadoId(e.target.value); setUiPage(1); }}
            className={`px-3 py-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value="">Todos</option>
            {(empleados || []).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nombre_completo || [emp.nombre, emp.apellido].filter(Boolean).join(' ') || `Empleado #${emp.id}`}</option>
            ))}
          </select>
        </div>
        <div>
          <button onClick={()=>{ setSearchTerm(""); setDateFilter('today'); setCustomFrom(""); setCustomTo(""); setMedioPago('all'); setEmpleadoId(""); setUiPage(1); }} className={`px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      <div className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`w-full overflow-auto`}>
          <table className="min-w-[900px] w-full text-sm">
            <thead className={darkMode ? 'bg-gray-900/40 text-gray-300' : 'bg-gray-50 text-gray-700'}>
              <tr>
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={()=>handleSort('fecha')}>Fecha {sortIndicator('fecha')}</th>
                <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={()=>handleSort('id')}>N° {sortIndicator('id')}</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Empleado</th>
                <th className="text-left px-4 py-3">Medio</th>
                <th className="text-right px-4 py-3 cursor-pointer select-none" onClick={()=>handleSort('bruto')}>Bruto {sortIndicator('bruto')}</th>
                <th className="text-right px-4 py-3 cursor-pointer select-none" onClick={()=>handleSort('descuento')}>Desc. {sortIndicator('descuento')}</th>
                <th className="text-right px-4 py-3 cursor-pointer select-none" onClick={()=>handleSort('total')}>Total {sortIndicator('total')}</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-4 opacity-70">Cargando…</td></tr>
              )}
              {!loading && allSales.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-4 opacity-70">Sin resultados.</td></tr>
              )}
              {(sortKey ? pageSales : pageSales).map(s => (
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
        {/* Paginación client-side */}
        <div className="px-4 py-3">
          <Pagination
            currentPage={uiPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p)=> setUiPage(Math.min(Math.max(1,p), totalPages))}
            onPageSizeChange={(s)=> { setPageSize(s); setUiPage(1); }}
            darkMode={darkMode}
          />
        </div>
      </div>

      <SaleDetailModal open={openDetail} onClose={()=>{ setOpenDetail(false); setSelectedSale(null); }} sale={selectedSale} darkMode={darkMode} />
      <EmpleadoDetailModal open={empOpen} onClose={()=>{ setEmpOpen(false); setEmpData(null); setEmpError(""); }} empleado={empData} loading={empLoading} error={empError} darkMode={darkMode} />
    </div>
  );
}