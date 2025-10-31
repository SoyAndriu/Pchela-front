import React, { useEffect, useState } from 'react';
import { useEmpleados } from '../../hooks/useEmpleados';
import { useToast } from '../ToastProvider';

const ROLES = [
  { value: 'gerente', label: 'Gerente' },
  { value: 'empleado', label: 'Empleado' },
  { value: 'cajero', label: 'Cajero' },
];

export default function EmpleadoFormModal({ visible, onClose, initialData, onSaved, darkMode }) {
  const { create, update, existsEmpleadoEmail, items } = useEmpleados();
  const toast = useToast();
  const [errors, setErrors] = useState({});
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

  // Validación en vivo mejorada para email duplicado
  const validateField = (field, value) => {
    let error = '';
    const hoy = new Date().toISOString().slice(0, 10);
    if (field === 'nombre' && !value.trim()) error = 'El nombre es obligatorio.';
    if (field === 'apellido' && !value.trim()) error = 'El apellido es obligatorio.';
    if (field === 'dni' && !/^\d{7,8}$/.test(value)) error = 'El DNI debe tener 7 u 8 dígitos.';
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'El email no es válido.';
    if (field === 'fecha_nacimiento' && value && value > hoy) error = 'No puede nacer en el futuro.';
    if (field === 'role' && !value) error = 'Selecciona un rol.';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Validar email duplicado usando los empleados ya cargados
  const validateEmailDuplicado = (email) => {
    // items viene del hook useEmpleados y ya tiene todos los empleados activos
    if (!email) return false;
    // Si estamos editando, ignorar el email del propio empleado
    return items.some(emp => emp.email === email && (!initialData || emp.id !== initialData.id));
  };

  // En el handleSubmit, usar la función local en vez de la API
  const handleSubmit = async (e) => {
    e.preventDefault();
    const hoy = new Date().toISOString().slice(0, 10);
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!form.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio.';
    if (form.fecha_nacimiento && form.fecha_nacimiento > hoy) newErrors.fecha_nacimiento = 'No puede nacer en el futuro.';
    if (!/^\d{7,8}$/.test(form.dni)) newErrors.dni = 'El DNI debe tener 7 u 8 dígitos.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'El email no es válido.';
    if (form.email && !newErrors.email && validateEmailDuplicado(form.email)) {
      newErrors.email = 'El correo ya está registrado en otro empleado.';
    }
    if (!form.role) newErrors.role = 'Selecciona un rol.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      setSaving(false); // Asegura que el modal no quede bloqueado si hay errores
      return;
    }
    setSaving(true);
    try {
      // No enviar password nunca
      const { password, ...payload } = form;
      if (initialData && initialData.id) {
        await update(initialData.id, payload);
        toast.success('Empleado actualizado correctamente');
      } else {
        await create(payload);
        toast.success('Empleado creado correctamente');
      }
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      // Si la respuesta es un objeto con errores por campo, los mostramos debajo del campo correspondiente
      let apiErrors = {};
      if (err && err.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (typeof parsed === 'object' && parsed !== null) {
            Object.entries(parsed).forEach(([key, val]) => {
              if (Array.isArray(val)) apiErrors[key] = val.join(' ');
              else apiErrors[key] = String(val);
            });
          }
        } catch {
          // Si no es JSON, mostrar como error general
          apiErrors.submit = err.message;
        }
      }
      setErrors(prev => ({ ...prev, ...apiErrors }));
      // Además de los errores de campo, mostramos un toast general
      const general = apiErrors.submit || 'Ocurrió un error al guardar';
      if (general) toast.error(general);
    } finally {
      setSaving(false);
    }
  };

  //

  // Render
  const isFormInvalid = Object.values(errors).some(e => e) || !form.nombre.trim() || !form.apellido.trim() || !form.dni.trim() || !form.role;
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
            <input className={`w-full p-2 rounded border ${input}`} value={form.nombre} onChange={e=>{setForm(f=>({...f,nombre:e.target.value}));validateField('nombre',e.target.value);}} required />
            {errors.nombre && <div className="text-xs text-red-500 mt-1">{errors.nombre}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">Apellido</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.apellido} onChange={e=>{setForm(f=>({...f,apellido:e.target.value}));validateField('apellido',e.target.value);}} required />
            {errors.apellido && <div className="text-xs text-red-500 mt-1">{errors.apellido}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">DNI</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.dni} onChange={e=>{setForm(f=>({...f,dni:e.target.value}));validateField('dni',e.target.value);}} required />
            {errors.dni && <div className="text-xs text-red-500 mt-1">{errors.dni}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className={`w-full p-2 rounded border ${input}`} value={form.email} onChange={e=>{setForm(f=>({...f,email:e.target.value}));validateField('email',e.target.value);}} required />
            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Nombre contacto de emergencia</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.contacto_emergencia} onChange={e=>setForm(f=>({...f,contacto_emergencia:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Número contacto de emergencia</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.numero_contacto_emergencia} onChange={e=>setForm(f=>({...f,numero_contacto_emergencia:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Dirección</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Fecha de nacimiento</label>
            <input type="date" className={`w-full p-2 rounded border ${input}`} value={form.fecha_nacimiento} onChange={e=>{setForm(f=>({...f,fecha_nacimiento:e.target.value}));validateField('fecha_nacimiento',e.target.value);}} />
            {errors.fecha_nacimiento && <div className="text-xs text-red-500 mt-1">{errors.fecha_nacimiento}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">Rol</label>
            <select className={`w-full p-2 rounded border ${input}`} value={form.role} onChange={e=>{setForm(f=>({...f,role:e.target.value}));validateField('role',e.target.value);}} required>
              <option value="">Seleccionar rol</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {errors.role && <div className="text-xs text-red-500 mt-1">{errors.role}</div>}
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className={`px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}>Cancelar</button>
            <button
              type="submit"
              disabled={saving || isFormInvalid}
              className={`px-3 py-2 rounded transition-colors
                ${saving || isFormInvalid
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : darkMode
                    ? 'bg-pink-600 hover:bg-pink-700 text-white'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'}
              `}
            >
              {saving ? 'Guardando…' : (initialData ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
          {/* Mostrar error de submit si existe */}
          {errors.submit && <div className="text-xs text-red-500 mb-2">{errors.submit}</div>}
        </form>
      </div>
    </div>
  );
}
