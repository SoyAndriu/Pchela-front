import React, { useEffect, useState } from 'react';
import { useEmpleados } from '../../hooks/useEmpleados';

const ROLES = [
  { value: 'gerente', label: 'Gerente' },
  { value: 'empleado', label: 'Empleado' },
  { value: 'cajero', label: 'Cajero' },
];

export default function EmpleadoFormModal({ visible, onClose, initialData, onSaved, darkMode }) {
  const { create, update } = useEmpleados();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    contacto_emergencia: '',
    numero_contacto_emergencia: '',
    direccion: '',
    fecha_nacimiento: '',
    role: '',
    activo: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setForm({
          nombre: initialData.nombre || '',
          apellido: initialData.apellido || '',
          dni: initialData.dni || '',
          email: initialData.email || '',
          telefono: initialData.telefono || '',
          contacto_emergencia: initialData.contacto_emergencia || '',
          numero_contacto_emergencia: initialData.numero_contacto_emergencia || '',
          direccion: initialData.direccion || '',
          fecha_nacimiento: initialData.fecha_nacimiento || '',
          role: initialData.role || '',
          // password eliminado
          activo: initialData.activo ?? true,
        });
      } else {
        setForm({
          nombre: '', apellido: '', dni: '', email: '', telefono: '', contacto_emergencia: '', numero_contacto_emergencia: '', direccion: '', fecha_nacimiento: '', role: '', activo: true
        });
      }
    }
  }, [visible, initialData]);

  if (!visible) return null;

  const input = darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // No enviar password nunca
      const { password, ...payload } = form;
      if (initialData && initialData.id) {
        await update(initialData.id, payload);
      } else {
        await create(payload);
      }
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      alert(err.message || 'Error guardando empleado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-2xl mx-auto rounded-xl shadow-lg p-6 border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-slate-200 text-gray-700'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{initialData ? 'Actualizar empleado' : 'Registrar empleado'}</h3>
          <button onClick={onClose} className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}>Cerrar</button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Apellido</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.apellido} onChange={e=>setForm(f=>({...f,apellido:e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">DNI</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.dni} onChange={e=>setForm(f=>({...f,dni:e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className={`w-full p-2 rounded border ${input}`} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Contacto de emergencia</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.contacto_emergencia} onChange={e=>setForm(f=>({...f,contacto_emergencia:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Número de contacto de emergencia</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.numero_contacto_emergencia} onChange={e=>setForm(f=>({...f,numero_contacto_emergencia:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Dirección</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Fecha de nacimiento</label>
            <input type="date" className={`w-full p-2 rounded border ${input}`} value={form.fecha_nacimiento} onChange={e=>setForm(f=>({...f,fecha_nacimiento:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Rol</label>
            <select className={`w-full p-2 rounded border ${input}`} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} required>
              <option value="">Seleccionar rol</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className={`px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}>Cancelar</button>
            <button type="submit" disabled={saving} className={`px-3 py-2 rounded ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}>{saving ? 'Guardando…' : (initialData ? 'Actualizar' : 'Guardar')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
