import React, { useEffect, useState } from 'react';
import useCategories from '../../hooks/useCategories';
import useProveedores from '../../hooks/useProveedores';

// Modal para ingresar stock (crear lote)
// Props: visible, onClose, producto, onSaved, darkMode, createLote
export default function ModalIngresoStock({ visible, onClose, producto, onSaved, darkMode, createLote }) {
  const { categories } = useCategories();
  const { proveedores, fetchProveedores } = useProveedores();
  const [cantidad, setCantidad] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [confirmNumeroLote, setConfirmNumeroLote] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [descuentoTipo, setDescuentoTipo] = useState(''); // 'porc' | 'valor'
  const [descuentoValor, setDescuentoValor] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [proveedorId, setProveedorId] = useState('');
  useEffect(() => {
    if (visible) fetchProveedores();
    if (!visible) {
      setCantidad('');
      setNumeroLote('');
      setCostoUnitario('');
      setDescuentoTipo('');
      setDescuentoValor('');
      setNotas('');
      setError(null);
      setConfirmNumeroLote('');
      setProveedorId('');
    }
  }, [visible, fetchProveedores]);

  if (!visible || !producto) return null;

  const baseClass = `w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-400'}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!cantidad || Number(cantidad) <= 0) {
      setError('Cantidad inválida');
      return;
    }
    if (!costoUnitario || Number(costoUnitario) <= 0) {
      setError('Costo unitario inválido');
      return;
    }
    if (!numeroLote.trim()) {
      setError('Debes ingresar el número de lote');
      return;
    }
    if (numeroLote.trim() !== confirmNumeroLote.trim()) {
      setError('La confirmación del número de lote no coincide');
      return;
    }
    const payload = {
      producto: producto.id,
      numero_lote: numeroLote || null,
      cantidad_inicial: Number(cantidad),
      cantidad_disponible: Number(cantidad),
      costo_unitario: costoUnitario,
      descuento_tipo: descuentoTipo || null,
      descuento_valor: descuentoValor ? Number(descuentoValor) : null,
      proveedor: proveedorId || null,
      notas: notas || null
    };
    try {
      setSaving(true);
      const nuevo = await createLote(payload);
      onSaved && onSaved(nuevo);
      onClose();
    } catch (err) {
      setError(err.message || 'Error guardando lote');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ingreso de Stock</h3>
        <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Producto: <span className="font-medium">{producto.nombre}</span></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Cantidad</label>
            <input type="number" value={cantidad} onChange={e=>setCantidad(e.target.value)} className={baseClass} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Proveedor</label>
            <select value={proveedorId} onChange={e=>setProveedorId(e.target.value)} className={baseClass}>
              <option value="">Selecciona proveedor</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Costo Unitario</label>
            <input type="number" step="0.01" value={costoUnitario} onChange={e=>setCostoUnitario(e.target.value)} className={baseClass} />
          </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium block mb-1">Tipo Descuento</label>
                <select value={descuentoTipo} onChange={e=>setDescuentoTipo(e.target.value)} className={baseClass}>
                  <option value="">Ninguno</option>
                  <option value="porc">% Porcentaje</option>
                  <option value="valor">Valor total</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Descuento</label>
                <input type="number" step="0.01" value={descuentoValor} onChange={e=>setDescuentoValor(e.target.value)} className={baseClass} disabled={!descuentoTipo} />
              </div>
            </div>
          <div>
            <label className="text-xs font-medium block mb-1">Número de Lote</label>
            <input value={numeroLote} onChange={e=>setNumeroLote(e.target.value)} className={baseClass} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Confirmar Número de Lote</label>
            <input value={confirmNumeroLote} onChange={e=>setConfirmNumeroLote(e.target.value)} className={baseClass} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Notas</label>
            <textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3} className={baseClass} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>Cancelar</button>
            <button disabled={saving} type="submit" className={`px-4 py-2 rounded text-sm font-medium ${saving ? 'opacity-60 cursor-not-allowed' : ''} ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}