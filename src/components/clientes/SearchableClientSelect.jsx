import React, { useEffect, useState } from 'react';
import { useClientes } from '../../hooks/useClientes';
import ClienteFormModal from './ClienteFormModal';

export default function SearchableClientSelect({ value, onSelect, darkMode }) {
  const { items, loading, error, search } = useClientes();

  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [consumidorFinal, setConsumidorFinal] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => { if (term.trim().length >= 2) search(term); }, 300);
    return () => clearTimeout(id);
  }, [term, search]);

  // Evitamos toasts ruidosos; el error se mostrará inline en el dropdown
  useEffect(() => {}, [error]);

  const input = darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300';

  return (
    <div className="relative">
      <label className="block text-sm mb-1">Cliente (buscar por Nombre, DNI o Email)</label>
      <div className="flex gap-2 items-start">
        {value && (value.id || value.usuario) ? (
          <div className="w-full flex items-center gap-2">
            <input
              className={`w-full p-2 rounded border bg-gray-100 text-gray-700 cursor-not-allowed ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'border-gray-300'}`}
              value={value.nombre_completo + ' - ' + value.email}
              readOnly
              disabled
              tabIndex={-1}
            />
            <button
              type="button"
              className="ml-1 px-2 py-1 rounded-full bg-transparent hover:bg-red-100"
              title="Quitar cliente"
              onClick={()=>{
                onSelect && onSelect(null);
                setTerm('');
                setOpen(false);
              }}
            >
              <span className="text-red-600 text-lg font-bold">×</span>
            </button>
          </div>
        ) : (
          <>
            <input
              className={`w-full p-2 rounded border ${input}`}
              placeholder="Ej: 30123456 o ana@example.com"
              value={term}
              onChange={(e)=>{ setTerm(e.target.value); setOpen(true); setConsumidorFinal(false); onSelect && onSelect(null); }}
              onFocus={()=> setOpen(true)}
              disabled={consumidorFinal}
            />
            <div className={`px-2 py-2 rounded border text-xs ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}> 
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={consumidorFinal} onChange={(e)=>{
                  const checked = e.target.checked;
                  setConsumidorFinal(checked);
                  if (checked) { setEditData(null); setShowModal(false); setTerm(''); onSelect && onSelect(null); }
                }} />
                <span>Consumidor final</span>
              </label>
            </div>
          </>
        )}
      </div>
      {open && term.trim().length >= 2 && (
        <div className={`absolute z-40 w-full mt-1 rounded border shadow ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-slate-200 text-gray-800'}`}>
          {loading && <div className="p-2 text-sm opacity-70">Buscando…</div>}
          {!loading && error && (
            <div className="p-2 text-xs text-amber-600">
              {error}
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="p-2 text-sm">
              <div>No se encontraron coincidencias.</div>
              <button className={`${darkMode ? 'text-pink-300 hover:underline' : 'text-pink-600 hover:underline'} mt-1`} onClick={()=>{ setEditData(null); setShowModal(true); }}>Registrar este cliente</button>
            </div>
          )}
          {!loading && items.length > 0 && (
            <ul className="max-h-60 overflow-auto">
              {items.map(c => (
                <li
                  key={c.id || c.dni || c.email || c.usuario}
                  className={`px-3 py-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  onClick={()=>{ onSelect && onSelect(c); setTerm(c.nombre_completo + ' - ' + c.email); setOpen(false); }}
                >
                  <div className="font-medium">{c.nombre_completo}</div>
                  <div className="text-xs opacity-80">{c.email}{c.dni ? ` • DNI ${c.dni}` : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {(!consumidorFinal) && value && value.usuario && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="opacity-80">Seleccionado:</span>
          <span className="font-medium">{value.nombre_completo}</span>
          <button className={`${darkMode ? 'text-blue-300 hover:underline' : 'text-blue-600 hover:underline'}`} onClick={()=>{ setEditData(value); setShowModal(true); }}>Actualizar datos</button>
          <button className={`${darkMode ? 'text-gray-300 hover:underline' : 'text-gray-600 hover:underline'}`} onClick={()=> onSelect && onSelect(null)}>Quitar</button>
        </div>
      )}
      {consumidorFinal && (
        <div className="mt-2 text-sm opacity-80">Venta a consumidor final (sin cliente asociado)</div>
      )}

      <ClienteFormModal
        visible={showModal}
        onClose={()=> setShowModal(false)}
        initialData={editData}
        darkMode={darkMode}
        onSaved={(c)=>{
          setConsumidorFinal(false);
          onSelect && onSelect(c);
          setTerm(c.nombre_completo + ' - ' + c.email);
          setOpen(false); // Cierra el dropdown y oculta el cartel
        }}
      />
    </div>
  );
}
