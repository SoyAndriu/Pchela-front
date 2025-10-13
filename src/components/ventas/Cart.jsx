import React, { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';

export default function Cart({ value, onChange, darkMode }) {
  const { productos, fetchProducts } = useProducts();
  useEffect(() => {
    if (!Array.isArray(productos) || productos.length === 0) {
      fetchProducts();
    }
  }, [productos, fetchProducts]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = Array.isArray(productos) ? productos : [];
    if (!s) return list.slice(0, 20);
    return list.filter(p => (p.nombre || '').toLowerCase().includes(s));
  }, [search, productos]);

  const addItem = (p) => {
    const exists = value.find(i => i.producto_id === p.id);
    if (exists) onChange(value.map(i => i.producto_id === p.id ? { ...i, cantidad: i.cantidad + 1, precio_unitario: i.precio_unitario || Number(p.precio) } : i));
    else onChange([...value, { producto_id: p.id, cantidad: 1, precio_unitario: Number(p.precio) }]);
  };

  const updateQty = (id, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    onChange(value.map(i => i.producto_id === id ? { ...i, cantidad: q } : i));
  };

  const removeItem = (id) => onChange(value.filter(i => i.producto_id !== id));

  const total = useMemo(() => value.reduce((s, i) => s + Number(i.precio_unitario || 0) * Number(i.cantidad || 0), 0), [value]);

  return (
    <div className={`rounded border p-4 ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
      <h3 className="font-semibold mb-3">Carrito</h3>
      <div className="mb-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar producto..." className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-auto">
          {filtered.map(p => (
            <button key={p.id} onClick={()=>addItem(p)} className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} p-2 rounded border text-left`}>
              <div className="font-medium text-sm">{p.nombre}</div>
              <div className="text-xs opacity-70">${Number(p.precio).toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y border-t">
        {value.length === 0 && <div className="py-4 text-sm opacity-70">Sin productos.</div>}
        {value.map(i => (
          <div key={i.producto_id} className="flex items-center gap-2 py-2">
            <div className="flex-1">
              <div className="font-medium">#{i.producto_id}</div>
              <div className="text-xs opacity-70">${Number(i.precio_unitario || 0).toFixed(2)}</div>
            </div>
            <input type="number" min={1} value={i.cantidad} onChange={e=>updateQty(i.producto_id, e.target.value)} className={`w-20 p-1 rounded border text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
            <div className="w-20 text-right">${(Number(i.precio_unitario||0)*Number(i.cantidad||0)).toFixed(2)}</div>
            <button onClick={()=>removeItem(i.producto_id)} className={`${darkMode ? 'text-red-300 hover:underline' : 'text-red-600 hover:underline'} text-sm`}>Quitar</button>
          </div>
        ))}
      </div>
      <div className="pt-3 flex justify-between font-semibold">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
