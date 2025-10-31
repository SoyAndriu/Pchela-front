import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../ToastProvider';
import { useClientes } from '../../hooks/useClientes';
import { useClientesCatalogos } from '../../hooks/useClientesCatalogos';
import { API_BASE } from '../../config/productConfig';
import { apiFetch } from '../../utils/productUtils';

const IVA_FALLBACK = [
  { value: 'CF', label: 'Consumidor Final' },
  { value: 'RI', label: 'Responsable Inscripto' },
  { value: 'MT', label: 'Monotributo' },
  { value: 'EX', label: 'Exento' },
  { value: 'NR', label: 'No Responsable' },
];

export default function ClienteFormModal({ visible, onClose, initialData = null, darkMode, onSaved }) {
  const toast = useToast();
  const { create, update, uniqueCheck } = useClientes();
  const { condicionIva } = useClientesCatalogos();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    dni: '',
    fecha_nacimiento: '',
    condicion_iva: '',
    notas: '',
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setForm({
          nombre: initialData.nombre || '',
          apellido: initialData.apellido || '',
          email: initialData.email || '',
          telefono: initialData.telefono || '',
          direccion: initialData.direccion || '',
          dni: initialData.dni || '',
          fecha_nacimiento: initialData.fecha_nacimiento || '',
          condicion_iva: initialData.condicion_iva || '',
          notas: initialData.notas || '',
          activo: initialData.activo ?? true,
        });
      } else {
        setForm({ nombre: '', apellido: '', email: '', telefono: '', direccion: '', dni: '', fecha_nacimiento: '', condicion_iva: '', notas: '', activo: true });
      }
      setErrors({});
    }
  }, [visible, initialData]);

  // IMPORTANTE: los hooks deben declararse siempre antes de cualquier return condicional
  const IVA_OPTIONS = useMemo(() => {
    if (Array.isArray(condicionIva) && condicionIva.length > 0) {
      return condicionIva.map(o => ({ value: o.code, label: o.label }));
    }
    return IVA_FALLBACK;
  }, [condicionIva]);

  if (!visible) return null;

  const baseBox = darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-slate-200 text-gray-700';
  const input = darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300';

  // Validación por campo
  const validateField = (field, value) => {
    const hoy = new Date().toISOString().slice(0, 10);
    let msg = '';
    if (field === 'nombre' && !String(value).trim()) msg = 'El nombre es obligatorio.';
    if (field === 'apellido' && !String(value).trim()) msg = 'El apellido es obligatorio.';
    if (field === 'email' && value) {
      const emailTrim = String(value).trim();
      if (emailTrim && !/.+@.+\..+/.test(emailTrim)) msg = 'El email no es válido.';
    }
    if (field === 'dni' && value) {
      const clean = String(value).replace(/\D+/g, '');
      if (!(clean.length === 7 || clean.length === 8)) msg = 'El DNI debe tener 7 u 8 dígitos.';
    }
    if (field === 'fecha_nacimiento' && value && value > hoy) msg = 'La fecha no puede ser futura.';
    setErrors(prev => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || submittingRef.current) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!form.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio.';
    if (form.fecha_nacimiento && form.fecha_nacimiento > hoy) newErrors.fecha_nacimiento = 'La fecha de nacimiento no puede ser en el futuro.';
    // Normalizar DNI a solo dígitos si viene con puntos/espacios
    const cleanDni = form.dni ? String(form.dni).replace(/\D+/g, '') : '';
    // Requerir al menos uno: email válido o DNI válido
    const emailTrim = form.email ? form.email.trim() : '';
    const emailOk = emailTrim ? /.+@.+\..+/.test(emailTrim) : false;
    const dniOk = cleanDni ? (cleanDni.length === 7 || cleanDni.length === 8) : false;
    if (!emailOk && !dniOk) {
      newErrors.email = 'Ingresá un Email válido o';
      newErrors.dni = 'un DNI válido (7-8 dígitos).';
    } else {
      if (emailTrim && !emailOk) newErrors.email = 'El email no es válido.';
      if (cleanDni && !dniOk) newErrors.dni = 'El DNI debe tener 7 u 8 dígitos.';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    const payload = { ...form, email: form.email ? form.email.toLowerCase().trim() : '', dni: cleanDni };
    setSaving(true);
    submittingRef.current = true;
    try {
      // Pre-chequeo de duplicados (endpoint único) y fallback por listado
      if (!(initialData && initialData.usuario)) {
        if (payload.email || payload.dni) {
          try {
            const chk = await uniqueCheck({ email: payload.email, dni: payload.dni });
            if ((chk.email && chk.email.exists) || (chk.dni && chk.dni.exists)) {
              // 1) Intento de usar datos extendidos si el backend los provee
              const extended = chk.email?.cliente || chk.dni?.cliente;
              if (extended) {
                toast.info('Ese cliente ya existe. (sin fetch extra)');
                onSaved && onSaved(extended);
                onClose && onClose();
                return;
              }
              // 2) Fallback al fetch actual si no hay datos extendidos
              const params = new URLSearchParams();
              if (payload.email && chk.email.exists) params.set('email', payload.email);
              if (payload.dni && chk.dni.exists) params.set('dni', payload.dni);
              const resChk = await apiFetch(`${API_BASE}/clientes/?${params.toString()}`);
              if (resChk.ok) {
                const data = await resChk.json();
                const list = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
                const match = list.find(c => (payload.email && c.email && c.email.toLowerCase() === payload.email) || (payload.dni && c.dni && String(c.dni) === String(payload.dni)));
                if (match) {
                  toast.info('Ese cliente ya existe. Lo seleccionamos para continuar.');
                  onSaved && onSaved(match);
                  onClose && onClose();
                  return;
                }
              }
            }
          } catch {
            // Si unique-check falla, continuamos con el flujo normal
          }
        }
      }
      let result;
      if (initialData && initialData.usuario) {
        if (initialData.id === 1) {
          toast.info('El cliente especial no puede ser editado.');
          setSaving(false);
          submittingRef.current = false;
          return;
        }
        result = await update(initialData.usuario, payload);
        toast.success('Cliente actualizado');
      } else {
        result = await create(payload);
        toast.success('Cliente creado');
      }
      onSaved && onSaved(result);
      onClose && onClose();
    } catch (err) {
      toast.error(err?.message || 'Error guardando cliente');
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-2xl mx-auto rounded-xl shadow-lg p-6 border ${baseBox}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{initialData ? 'Actualizar cliente' : 'Registrar cliente'}</h3>
          <button onClick={onClose} className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}>Cerrar</button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.nombre} onChange={e=>handleChange('nombre', e.target.value)} required />
            {errors.nombre && <div className="text-xs text-red-500 mt-1">{errors.nombre}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">Apellido</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.apellido} onChange={e=>handleChange('apellido', e.target.value)} required />
            {errors.apellido && <div className="text-xs text-red-500 mt-1">{errors.apellido}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">Email (opcional)</label>
            <input type="email" className={`w-full p-2 rounded border ${input}`} value={form.email} onChange={e=>handleChange('email', e.target.value)} />
            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">DNI</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.dni} onChange={e=>handleChange('dni', e.target.value)} />
            {errors.dni && <div className="text-xs text-red-500 mt-1">{errors.dni}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Dirección</label>
            <input className={`w-full p-2 rounded border ${input}`} value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Fecha de nacimiento</label>
            <input type="date" className={`w-full p-2 rounded border ${input}`} value={form.fecha_nacimiento} onChange={e=>handleChange('fecha_nacimiento', e.target.value)} />
            {errors.fecha_nacimiento && <div className="text-xs text-red-500 mt-1">{errors.fecha_nacimiento}</div>}
          </div>
          <div>
            <label className="block text-sm mb-1">Condición IVA</label>
            <select className={`w-full p-2 rounded border ${input}`} value={form.condicion_iva} onChange={e=>setForm(f=>({...f,condicion_iva:e.target.value}))}>
              <option value="">-</option>
              {IVA_OPTIONS.map(o=> (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Notas</label>
            <textarea className={`w-full p-2 rounded border ${input}`} value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))} rows={3} />
          </div>
          <div className="md:col-span-2 text-xs opacity-70 -mt-2">
            Ingresá al menos un Email válido o un DNI.
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className={`px-3 py-2 rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}>Cancelar</button>
            <button type="submit" disabled={saving || Object.values(errors).some(Boolean) || !form.nombre.trim() || !form.apellido.trim()} className={`px-3 py-2 rounded ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'} ${saving || Object.values(errors).some(Boolean) || !form.nombre.trim() || !form.apellido.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}>{saving ? 'Guardando…' : (initialData ? 'Actualizar' : 'Guardar')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
