import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from "../config/productConfig";
import { apiFetch } from "../utils/productUtils";
import { useProducts } from "../hooks/useProducts";
import useProveedores from "../hooks/useProveedores";
import useMarcas from "../hooks/useMarcas";
import useLotes from "../hooks/useLotes";
import HistorialLotesModal from "../components/products/HistorialLotesModal";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { exportTablePDF } from "../utils/pdfExport";
import Pagination from "../components/Pagination";

export default function ComprasHistorial({ darkMode }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { productos, fetchProducts } = useProducts();
  const { proveedores, fetchProveedores } = useProveedores();
  const { marcas, fetchMarcas } = useMarcas();
  const { deleteLote, updateLote } = useLotes();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [proveedorFiltro, setProveedorFiltro] = useState('');
  const [showHistorial, setShowHistorial] = useState(false);
  const [productoHistorial, setProductoHistorial] = useState(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [soloActivos, setSoloActivos] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchProveedores();
    fetchMarcas();
    load();
  }, [fetchProducts, fetchProveedores, fetchMarcas]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
  const res = await apiFetch(`${API_BASE}/lotes/`);
      if (!res.ok) throw new Error('Error cargando historial');
      const data = await res.json();
      const items = Array.isArray(data.results) ? data.results : data;
      setRows(items);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    const prodList = Array.isArray(productos) ? productos : [];
    return list.filter(l => {
      const prodId = typeof l.producto === 'object' ? l.producto.id : l.producto;
      const prod = prodList.find(p => p.id === prodId);
      const name = (prod?.nombre || '').toLowerCase();
      const matchesSearch = !search || name.includes(search.toLowerCase());
      const brandId = prod?.marca_id ?? (typeof prod?.marca === 'object' ? prod.marca?.id : prod?.marca);
      const matchesBrand = !marcaFiltro || String(brandId) === String(marcaFiltro);
      let loteProvId = null;
      if (l.proveedor) {
        if (typeof l.proveedor === 'object') loteProvId = l.proveedor.id;
        else loteProvId = l.proveedor;
      }
      const matchesProv = !proveedorFiltro || String(loteProvId) === String(proveedorFiltro);
      // Filtro por rango de fechas (l.fecha_compra)
      const ts = l.fecha_compra ? new Date(l.fecha_compra).getTime() : NaN;
      let matchesDate = true;
      if (fechaDesde) {
        const d = new Date(fechaDesde + 'T00:00:00').getTime();
        if (!Number.isNaN(ts)) matchesDate = matchesDate && ts >= d; else matchesDate = false;
      }
      if (fechaHasta) {
        const h = new Date(fechaHasta + 'T23:59:59').getTime();
        if (!Number.isNaN(ts)) matchesDate = matchesDate && ts <= h; else matchesDate = false;
      }
      const matchesActivo = !soloActivos || Number(l.cantidad_disponible || 0) > 0;
      return matchesSearch && matchesBrand && matchesProv && matchesDate && matchesActivo;
    });
  }, [rows, productos, search, marcaFiltro, proveedorFiltro, fechaDesde, fechaHasta, soloActivos]);

  // Paginación client-side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);
  useEffect(() => { setPage(1); }, [search, marcaFiltro, proveedorFiltro, fechaDesde, fechaHasta, soloActivos, pageSize]);

  const exportPDF = () => {
    const columns = ['Producto','Marca','Lote','Cant Inicial','Disponible','Costo Unit','Proveedor','Fecha'];
    const prodList = Array.isArray(productos) ? productos : [];
    const provList = Array.isArray(proveedores) ? proveedores : [];
    const rows = filtered.map(l => {
      const prodId = typeof l.producto === 'object' ? l.producto.id : l.producto;
      const prod = prodList.find(p => p.id === prodId);
      const marcaNombre = prod?.marca_nombre || (typeof prod?.marca === 'object' ? (prod.marca?.nombre ?? prod.marca?.nombre_marca) : '');
      let proveedorNombre = '';
      if (l.proveedor) {
        if (typeof l.proveedor === 'object' && l.proveedor.nombre) proveedorNombre = l.proveedor.nombre;
        else {
          const p = provList.find(pr => pr.id === l.proveedor); if (p) proveedorNombre = p.nombre;
        }
      }
      return [
        prod?.nombre || `#${prodId}`,
        marcaNombre || '—',
        l.numero_lote || '—',
        l.cantidad_inicial,
        l.cantidad_disponible,
        `$${Number(l.costo_unitario).toFixed(2)}`,
        proveedorNombre || '—',
        l.fecha_compra || '—'
      ];
    });
    // Meta e indicadores
    const sum = (arr, fn) => arr.reduce((acc, it) => acc + (Number(fn(it)) || 0), 0);
    const totalLotes = filtered.length;
    const unidadesIniciales = sum(filtered, it => it.cantidad_inicial);
    const unidadesDisponibles = sum(filtered, it => it.cantidad_disponible);
    const costoInicial = sum(filtered, it => (Number(it.cantidad_inicial) || 0) * (Number(it.costo_unitario) || 0));
    const costoDisponible = sum(filtered, it => (Number(it.cantidad_disponible) || 0) * (Number(it.costo_unitario) || 0));
    const marcaObj = (marcas || []).find(m => String(m.id) === String(marcaFiltro));
    const proveedorObj = (proveedores || []).find(p => String(p.id) === String(proveedorFiltro));
    const hoy = new Date();
    const pad = (n) => `${n}`.padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const rango = (fechaDesde || fechaHasta) ? `${fechaDesde || 'inicio'} a ${fechaHasta || fmt(hoy)}` : 'Todos';
    exportTablePDF({
      title: 'Historial de lotes',
      columns,
      rows,
      fileName: `historial_lotes_${fechaDesde || 'inicio'}_a_${fechaHasta || fmt(hoy)}`,
      orientation: 'landscape',
      meta: {
        Rango: rango,
        Marca: marcaObj ? (marcaObj.nombre || marcaObj.nombre_marca || `#${marcaObj.id}`) : 'Todas',
        Proveedor: proveedorObj ? (proveedorObj.nombre || `#${proveedorObj.id}`) : 'Todos',
        'Solo activos': soloActivos ? 'Sí' : 'No',
        Búsqueda: search || undefined,
        Lotes: totalLotes,
        'Unidades iniciales': unidadesIniciales,
        'Unidades disponibles': unidadesDisponibles,
        'Costo inicial': `$${costoInicial.toFixed(2)}`,
        'Costo disponible': `$${costoDisponible.toFixed(2)}`,
      }
    });
  };

  const card = darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800";
  const input = darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300";

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-pink-300' : 'text-pink-600'}`}>Historial de lotes</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/gerente/compras')} className={`${darkMode ? 'border-pink-700 text-pink-300 hover:bg-pink-900/30' : 'border-pink-200 text-pink-600 hover:bg-pink-50'} px-3 py-2 rounded text-sm border`}>Volver a compras</button>
          <button onClick={load} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} px-3 py-2 rounded text-sm`}>Refrescar</button>
          <button onClick={() => exportPDF()} className={`${darkMode ? 'bg-pink-700 hover:bg-pink-600 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'} px-3 py-2 rounded text-sm`}>Exportar PDF</button>
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow mb-4 ${card}`}>
        <div className="grid md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="text-sm block mb-1">Buscar por producto</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} className={`w-full p-2 rounded border ${input}`} placeholder="Nombre de producto..." />
          </div>
          <div>
            <label className="text-sm block mb-1">Filtrar por marca</label>
            <select value={marcaFiltro} onChange={e=>setMarcaFiltro(e.target.value)} className={`w-full p-2 rounded border ${input}`}>
              <option value="">Todas</option>
              {marcas?.map(m => <option key={m.id} value={m.id}>{m.nombre || m.nombre_marca}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Proveedor</label>
            <select value={proveedorFiltro} onChange={e=>setProveedorFiltro(e.target.value)} className={`w-full p-2 rounded border ${input}`}>
              <option value="">Todos</option>
              {proveedores?.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Desde</label>
            <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} className={`w-full p-2 rounded border ${input}`} />
          </div>
          <div>
            <label className="text-sm block mb-1">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} className={`w-full p-2 rounded border ${input}`} />
          </div>
          <div className="flex items-center gap-2">
            <input id="soloActivos" type="checkbox" checked={soloActivos} onChange={e=>setSoloActivos(e.target.checked)} />
            <label htmlFor="soloActivos" className="text-sm">Solo activos</label>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      {loading ? (
        <p className="text-sm opacity-70">Cargando...</p>
      ) : (
        <div className={`p-4 rounded-lg shadow ${card}`}>
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                <tr className={darkMode ? 'border-b border-gray-700' : 'border-b border-slate-200'}>
                  <th className="py-2 px-2 text-left">Producto</th>
                  <th className="py-2 px-2 text-left">Marca</th>
                  <th className="py-2 px-2 text-left">Lote</th>
                  <th className="py-2 px-2 text-left">Cant. Inicial</th>
                  <th className="py-2 px-2 text-left">Disponible</th>
                  <th className="py-2 px-2 text-left">Costo Unit.</th>
                  <th className="py-2 px-2 text-left">Proveedor</th>
                  <th className="py-2 px-2 text-left">Fecha</th>
                  <th className="py-2 px-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {current.map(l => {
                  const prodId = typeof l.producto === 'object' ? l.producto.id : l.producto;
                  const prod = (Array.isArray(productos) ? productos : []).find(p => p.id === prodId);
                  const marcaNombre = prod?.marca_nombre || (typeof prod?.marca === 'object' ? (prod.marca?.nombre ?? prod.marca?.nombre_marca) : '—');
                  let proveedorNombre = '—';
                  if (l.proveedor) {
                    if (typeof l.proveedor === 'object' && l.proveedor.nombre) proveedorNombre = l.proveedor.nombre;
                    else {
                      const p = (proveedores || []).find(pr => pr.id === l.proveedor);
                      if (p) proveedorNombre = p.nombre;
                    }
                  }
                  const isCerrado = Number(l.cantidad_disponible || 0) === 0;
                  const canManage = (user?.role === 'gerente');
                  return (
                    <tr key={l.id} className={darkMode ? 'border-b border-gray-700 hover:bg-gray-700/50' : 'border-b border-slate-100 hover:bg-slate-50'}>
                      <td className="py-1 px-2">{prod?.nombre || `#${prodId}`}</td>
                      <td className="py-1 px-2">{marcaNombre || '—'}</td>
                      <td className="py-1 px-2">{l.numero_lote || '—'}</td>
                      <td className="py-1 px-2">{l.cantidad_inicial}</td>
                      <td className="py-1 px-2">
                        <span>{l.cantidad_disponible}</span>
                        {isCerrado && (
                          <span title="Lote cerrado" className={`${darkMode ? 'bg-gray-600 text-gray-100' : 'bg-gray-200 text-gray-700'} ml-2 px-2 py-0.5 rounded-full text-[10px] align-middle`}>Cerrado</span>
                        )}
                      </td>
                      <td className="py-1 px-2">${Number(l.costo_unitario).toFixed(2)}</td>
                      <td className="py-1 px-2">{proveedorNombre}</td>
                      <td className="py-1 px-2 whitespace-nowrap">{l.fecha_compra || '—'}</td>
                      <td className="py-1 px-2 flex gap-2">
                        {canManage && (
                          <>
                            <button
                              onClick={async () => {
                                const nuevo = prompt('Nueva cantidad disponible', l.cantidad_disponible);
                                if (nuevo === null) return;
                                const val = Number(nuevo);
                                if (Number.isNaN(val) || val < 0) { toast.info('Valor inválido'); return; }
                                const motivo = prompt('Motivo del ajuste (se registrará en notas)');
                                if (motivo === null) return;
                                const notas = [l.notas, `Ajuste ${new Date().toLocaleString()}: ${motivo}`].filter(Boolean).join(' | ');
                                try {
                                  const updated = await updateLote(l.id, { cantidad_disponible: val, notas });
                                  setRows(prev => prev.map(r => r.id === l.id ? { ...r, cantidad_disponible: updated.cantidad_disponible, notas: updated.notas ?? notas } : r));
                                } catch {
                                  toast.error('Error actualizando');
                                }
                              }}
                              className={`${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'} px-2 py-1 rounded text-xs`}
                            >Cant</button>
                            <button
                              onClick={async () => {
                                if (!window.confirm('¿Eliminar lote? Esta acción no se puede deshacer.')) return;
                                try {
                                  await deleteLote(l.id);
                                  setRows(prev => prev.filter(r => r.id !== l.id));
                                } catch {
                                  toast.error('Error eliminando');
                                }
                              }}
                              className={`${darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'} px-2 py-1 rounded text-xs`}
                            >X</button>
                          </>
                        )}
                        <button
                          onClick={() => navigate('/gerente/compras', { state: { productId: prodId } })}
                          className={`${darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-100 hover:bg-green-200 text-green-700'} px-2 py-1 rounded text-xs`}
                        >Ingresar</button>
                        <button
                          onClick={() => {
                            if (!prod) { toast.error('Producto no encontrado'); return; }
                            setProductoHistorial(prod);
                            setShowHistorial(true);
                          }}
                          className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-2 py-1 rounded text-xs`}
                        >Ver/editar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p)=> setPage(Math.min(Math.max(1,p), totalPages))}
        onPageSizeChange={(s)=> setPageSize(s)}
        darkMode={darkMode}
        className="mt-4"
      />

      <HistorialLotesModal
        visible={showHistorial}
        onClose={() => { setShowHistorial(false); setProductoHistorial(null); load(); }}
        producto={productoHistorial}
        darkMode={darkMode}
        onAfterChange={load}
      />
    </div>
  );
}

// Se eliminan exportaciones CSV/Excel; ahora solo PDF

