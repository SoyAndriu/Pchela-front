import React, { useEffect, useState } from 'react';

export default function MarcaModal({ visible, onClose, onSave, marca, darkMode, existingMarcas = [] }) {
  const [form, setForm] = useState({ nombre: '', notas: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setForm(marca || { nombre: '', notas: '' });
      setError(null);
    }
  }, [visible, marca]);

  if (!visible) return null;
  const baseClass = `w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-400'}`;

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const normalizeName = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    // Validación de duplicados (case-insensitive, ignora espacios extra); excluye la misma marca en edición
    const nombreNorm = normalizeName(form.nombre);
    const isDuplicate = existingMarcas.some(m => normalizeName(m?.nombre) === nombreNorm && (!marca || m.id !== marca.id));
    if (isDuplicate) { setError('La marca ya existe'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Error guardando marca');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{marca ? 'Editar' : 'Nueva'} Marca</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Nombre</label>
            <input value={form.nombre} onChange={e=>handleChange('nombre',e.target.value)} className={baseClass} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Notas</label>
            <textarea value={form.notas} onChange={e=>handleChange('notas',e.target.value)} rows={2} className={baseClass} />
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
