import React, { useEffect, useState } from 'react';
import { useEmpleados } from '../../hooks/useEmpleados';

const ROLES_MAP = {
  gerente: 2,   // ID en la tabla auth_group
  empleado: 3,
  cajero: 1
};

const ROLES = [
  { label: 'Gerente', value: 'gerente' },
  { label: 'Empleado', value: 'empleado' },
  { label: 'Cajero', value: 'cajero' },
];

export default function EmpleadoFormModal({ visible, onClose, initialData, onSaved, darkMode }) {
  const { create, update, getById } = useEmpleados();

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
    id: null,
  });

  const [saving, setSaving] = useState(false);

  // Cargar datos iniciales y asegurarse de tener el id correcto
  useEffect(() => {
    if (visible) {
      if (initialData?.id) {
        // Precargar desde API para tener la info más reciente
        getById(initialData.id).then(data => {
          setForm({
            nombre: data.profile?.nombre || '',
            apellido: data.profile?.apellido || '',
            dni: data.profile?.dni || '',
            email: data.email || '',
            telefono: data.profile?.telefono || '',
            contacto_emergencia: data.profile?.contacto_emergencia || '',
            numero_contacto_emergencia: data.profile?.numero_contacto_emergencia || '',
            direccion: data.profile?.direccion || '',
            fecha_nacimiento: data.profile?.fecha_nacimiento || '',
            role: data.profile?.role || '',
            activo: data.profile?.activo ?? true,
            id: data.id, // <-- aseguramos id correcto
          });
        });
      } else {
        setForm({
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
          id: null,
        });
      }
    }
  }, [visible, initialData, getById]);

  if (!visible) return null;

  const inputClass = darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Generar username único
      const timestamp = Date.now().toString().slice(-4);
      const username = initialData?.username || `${form.nombre}_${form.dni}_${timestamp}`;

      // Generar numero_empleado secuencial
      const numero_empleado = initialData?.profile?.numero_empleado || `EMP${Date.now().toString().slice(-6)}`;

      const payload = {
        username,
        email: form.email,
        password: form.dni, // contraseña igual al DNI
        groups: [ROLES_MAP[form.role]],
        profile: {
          nombre: form.nombre,
          apellido: form.apellido,
          dni: form.dni,
          numero_empleado,
          telefono: form.telefono,
          contacto_emergencia: form.contacto_emergencia,
          numero_contacto_emergencia: form.numero_contacto_emergencia,
          direccion: form.direccion,
          fecha_nacimiento: form.fecha_nacimiento,
          role: form.role,
          activo: form.activo,
        },
      };

      if (form.id) {
        await update(form.id, payload);
      } else {
        await create(payload);
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error('Error creando/actualizando empleado:', err);
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
          <h3 className="text-lg font-semibold">{form.id ? 'Actualizar empleado' : 'Registrar empleado'}</h3>
          <button onClick={onClose} className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}>Cerrar</button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Nombre', key: 'nombre', type: 'text' },
            { label: 'Apellido', key: 'apellido', type: 'text' },
            { label: 'DNI', key: 'dni', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Teléfono', key: 'telefono', type: 'text' },
            { label: 'Contacto de emergencia', key: 'contacto_emergencia', type: 'text' },
            { label: 'Número de contacto de emergencia', key: 'numero_contacto_emergencia', type: 'text' },
            { label: 'Dirección', key: 'direccion', type: 'text' },
            { label: 'Fecha de nacimiento', key: 'fecha_nacimiento', type: 'date' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm mb-1">{field.label}</label>
              <input
                type={field.type}
                className={`w-full p-2 rounded border ${inputClass}`}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                required={['telefono', 'contacto_emergencia', 'numero_contacto_emergencia', 'direccion'].indexOf(field.key) === -1}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm mb-1">Rol</label>
            <select
              className={`w-full p-2 rounded border ${inputClass}`}
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              required
            >
              <option value="">Seleccionar rol</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className={`px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}>Cancelar</button>
            <button type="submit" disabled={saving} className={`px-3 py-2 rounded ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}>
              {saving ? 'Guardando…' : (form.id ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
