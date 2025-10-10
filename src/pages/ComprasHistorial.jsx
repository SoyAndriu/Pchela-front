import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from "../config/productConfig";
import { getHeaders } from "../utils/productUtils";
import { useProducts } from "../hooks/useProducts";
import useProveedores from "../hooks/useProveedores";
import useMarcas from "../hooks/useMarcas";
import useLotes from "../hooks/useLotes";
import HistorialLotesModal from "../components/products/HistorialLotesModal";

export default function ComprasHistorial({ darkMode }) {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchProducts();
    fetchProveedores();
    fetchMarcas();
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/lotes/`, { headers: getHeaders() });
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
      return matchesSearch && matchesBrand && matchesProv && matchesDate;
    });
  }, [rows, productos, search, marcaFiltro, proveedorFiltro, fechaDesde, fechaHasta]);

  // Export helpers bound to current filters
  const exportCSV = () => {
    try {
      const csv = toCSV(filtered, productos, proveedores);
      const ts = new Date().toISOString().slice(0,10);
      downloadFile(`historial_lotes_${ts}.csv`, csv, 'text/csv;charset=utf-8;');
    } catch (e) {
      alert('No se pudo exportar CSV');
    }
  };

  const exportXLS = () => {
    try {
      const html = toXLS(filtered, productos, proveedores, darkMode);
      const ts = new Date().toISOString().slice(0,10);
      downloadFile(`historial_lotes_${ts}.xls`, html, 'application/vnd.ms-excel');
    } catch (e) {
      alert('No se pudo exportar Excel');
    }
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
          <button onClick={() => exportCSV()} className={`${darkMode ? 'bg-pink-700 hover:bg-pink-600 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'} px-3 py-2 rounded text-sm`}>Exportar CSV</button>
          <button onClick={() => exportXLS()} className={`${darkMode ? 'bg-pink-700 hover:bg-pink-600 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'} px-3 py-2 rounded text-sm`}>Exportar Excel</button>
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow mb-4 ${card}`}>
        <div className="grid md:grid-cols-5 gap-3">
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
                {filtered.map(l => {
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
                  return (
                    <tr key={l.id} className={darkMode ? 'border-b border-gray-700 hover:bg-gray-700/50' : 'border-b border-slate-100 hover:bg-slate-50'}>
                      <td className="py-1 px-2">{prod?.nombre || `#${prodId}`}</td>
                      <td className="py-1 px-2">{marcaNombre || '—'}</td>
                      <td className="py-1 px-2">{l.numero_lote || '—'}</td>
                      <td className="py-1 px-2">{l.cantidad_inicial}</td>
                      <td className="py-1 px-2">{l.cantidad_disponible}</td>
                      <td className="py-1 px-2">${Number(l.costo_unitario).toFixed(2)}</td>
                      <td className="py-1 px-2">{proveedorNombre}</td>
                      <td className="py-1 px-2 whitespace-nowrap">{l.fecha_compra || '—'}</td>
                      <td className="py-1 px-2 flex gap-2">
                        <button
                          onClick={async () => {
                            const nuevo = prompt('Nueva cantidad disponible', l.cantidad_disponible);
                            if (nuevo === null) return;
                            const val = Number(nuevo);
                            if (Number.isNaN(val) || val < 0) { alert('Valor inválido'); return; }
                            try {
                              const updated = await updateLote(l.id, { cantidad_disponible: val });
                              setRows(prev => prev.map(r => r.id === l.id ? { ...r, cantidad_disponible: updated.cantidad_disponible } : r));
                            } catch (e) {
                              alert('Error actualizando');
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
                            } catch (e) {
                              alert('Error eliminando');
                            }
                          }}
                          className={`${darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'} px-2 py-1 rounded text-xs`}
                        >X</button>
                        <button
                          onClick={() => navigate('/gerente/compras', { state: { productId: prodId } })}
                          className={`${darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-100 hover:bg-green-200 text-green-700'} px-2 py-1 rounded text-xs`}
                        >Ingresar</button>
                        <button
                          onClick={() => {
                            if (!prod) return alert('Producto no encontrado');
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

// Helpers de exportación
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows, productos, proveedores) {
  const header = ['Producto','Marca','Lote','Cant Inicial','Disponible','Costo Unit','Proveedor','Fecha'];
  const prodList = Array.isArray(productos) ? productos : [];
  const provList = Array.isArray(proveedores) ? proveedores : [];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map(l => {
    const prodId = typeof l.producto === 'object' ? l.producto.id : l.producto;
    const prod = prodList.find(p => p.id === prodId);
    const marcaNombre = prod?.marca_nombre || (typeof prod?.marca === 'object' ? (prod.marca?.nombre ?? prod.marca?.nombre_marca) : '');
    let proveedorNombre = '';
    if (l.proveedor) {
      if (typeof l.proveedor === 'object' && l.proveedor.nombre) proveedorNombre = l.proveedor.nombre;
      else {
        const p = provList.find(pr => pr.id === l.proveedor);
        if (p) proveedorNombre = p.nombre;
      }
    }
    return [
      prod?.nombre || `#${prodId}`,
      marcaNombre,
      l.numero_lote || '',
      l.cantidad_inicial,
      l.cantidad_disponible,
      Number(l.costo_unitario).toFixed(2),
      proveedorNombre,
      l.fecha_compra || ''
    ].map(escape).join(',');
  });
  return [header.join(','), ...lines].join('\n');
}

function toXLS(rows, productos, proveedores, darkMode) {
  // Exportación sencilla como tabla HTML compatible con Excel
  const prodList = Array.isArray(productos) ? productos : [];
  const provList = Array.isArray(proveedores) ? proveedores : [];
  const cell = (v) => `<td>${String(v ?? '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>`;
  const header = `<tr><th>Producto</th><th>Marca</th><th>Lote</th><th>Cant Inicial</th><th>Disponible</th><th>Costo Unit</th><th>Proveedor</th><th>Fecha</th></tr>`;
  const body = rows.map(l => {
    const prodId = typeof l.producto === 'object' ? l.producto.id : l.producto;
    const prod = prodList.find(p => p.id === prodId);
    const marcaNombre = prod?.marca_nombre || (typeof prod?.marca === 'object' ? (prod.marca?.nombre ?? prod.marca?.nombre_marca) : '');
    let proveedorNombre = '';
    if (l.proveedor) {
      if (typeof l.proveedor === 'object' && l.proveedor.nombre) proveedorNombre = l.proveedor.nombre;
      else {
        const p = provList.find(pr => pr.id === l.proveedor);
        if (p) proveedorNombre = p.nombre;
      }
    }
    return `<tr>${[
      prod?.nombre || `#${prodId}`,
      marcaNombre,
      l.numero_lote || '',
      l.cantidad_inicial,
      l.cantidad_disponible,
      Number(l.costo_unitario).toFixed(2),
      proveedorNombre,
      l.fecha_compra || ''
    ].map(cell).join('')}</tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table>${header}${body}</table></body></html>`;
  return html;
}

