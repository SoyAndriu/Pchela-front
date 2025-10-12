import React, { useEffect } from 'react';
import useLotes from '../../hooks/useLotes';
import useProveedores from '../../hooks/useProveedores';
import { useToast } from '../ToastProvider';

export default function HistorialLotesModal({ visible, onClose, producto, darkMode, onAfterChange }) {
  const { lotes, fetchLotes, loading, error, deleteLote, updateLote, computeFinalUnitCost } = useLotes();
  const { proveedores, fetchProveedores } = useProveedores();
  const toast = useToast();

  useEffect(() => {
    if (visible && producto) {
      fetchLotes(producto.id);
      fetchProveedores();
    }
  }, [visible, producto, fetchLotes, fetchProveedores]);

  if (!visible || !producto) return null;

  const baseBox = darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-slate-200 text-gray-700';

  const handleDelete = async (l) => {
    if (!window.confirm('¿Eliminar lote? Esta acción no se puede deshacer.')) return;
    try {
      await deleteLote(l.id);
      onAfterChange && onAfterChange();
      fetchLotes(producto.id);
    } catch {
      toast.error('Error eliminando');
    }
  };

  // Edición mínima de cantidad_disponible (para anular parte, etc.)
  const handleEditDisponible = async (l) => {
    const nuevo = prompt('Nueva cantidad disponible', l.cantidad_disponible);
    if (nuevo === null) return;
    const val = Number(nuevo);
    if (isNaN(val) || val < 0) { toast.info('Valor inválido'); return; }
    try {
      await updateLote(l.id, { cantidad_disponible: val });
      onAfterChange && onAfterChange();
      fetchLotes(producto.id);
    } catch {
      toast.error('Error actualizando');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-4xl mx-auto rounded-xl shadow-lg p-6 border ${baseBox}`}> 
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Historial de Lotes - {producto.nombre}</h3>
          <button onClick={onClose} className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}>Cerrar</button>
        </div>
        {loading && <p className="text-sm opacity-70">Cargando...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && lotes.length === 0 && <p className="text-sm opacity-70">Sin lotes.</p>}
        {lotes.length > 0 && (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                <tr className={darkMode ? 'border-b border-gray-700' : 'border-b border-slate-200'}>
                  <th className="py-2 px-2 text-left">Lote</th>
                  <th className="py-2 px-2 text-left">Cantidad Inicial</th>
                  <th className="py-2 px-2 text-left">Disponible</th>
                  <th className="py-2 px-2 text-left">Costo Unit.</th>
                  <th className="py-2 px-2 text-left">Desc.</th>
                  <th className="py-2 px-2 text-left">Costo Final</th>
                  <th className="py-2 px-2 text-left">Fecha</th>
                  <th className="py-2 px-2 text-left">Proveedor</th>
                  <th className="py-2 px-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map(l => {
                  const finalCost = l.costo_unitario_final ?? computeFinalUnitCost(l);
                  // Buscar el proveedor por ID (l.proveedor puede ser id o objeto)
                  let proveedorNombre = '—';
                  if (l.proveedor) {
                    if (typeof l.proveedor === 'object' && l.proveedor.nombre) {
                      proveedorNombre = l.proveedor.nombre;
                    } else {
                      const p = proveedores.find(pr => pr.id === l.proveedor);
                      if (p) proveedorNombre = p.nombre;
                    }
                  }
                  return (
                    <tr key={l.id} className={darkMode ? 'border-b border-gray-700 hover:bg-gray-700/50' : 'border-b border-slate-100 hover:bg-slate-50'}>
                      <td className="py-1 px-2 font-medium">{l.numero_lote || '—'}</td>
                      <td className="py-1 px-2">{l.cantidad_inicial}</td>
                      <td className="py-1 px-2">{l.cantidad_disponible}</td>
                      <td className="py-1 px-2">${Number(l.costo_unitario).toFixed(2)}</td>
                      <td className="py-1 px-2">{l.descuento_tipo ? `${l.descuento_tipo} ${l.descuento_valor}` : '—'}</td>
                      <td className="py-1 px-2">${Number(finalCost).toFixed(2)}</td>
                      <td className="py-1 px-2 whitespace-nowrap">{l.fecha_compra}</td>
                      <td className="py-1 px-2">{proveedorNombre}</td>
                      <td className="py-1 px-2 flex gap-2">
                        <button onClick={() => handleEditDisponible(l)} className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}>Cant</button>
                        <button onClick={() => handleDelete(l)} className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}>X</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}