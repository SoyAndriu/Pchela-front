import React, { useEffect, useState } from 'react';
import { useToast } from '../ToastProvider'; // o useAlert si preferís
import useProveedores from '../../hooks/useProveedores';

export default function ProveedorModal({ visible, onClose, onSave, proveedor, darkMode }) {
  const { existsProveedor, createProveedor, updateProveedor } = useProveedores();
  const toast = useToast();

  const [form, setForm] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    cuil: '',
    direccion: '',
    localidad: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      setForm(proveedor || {
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        cuil: '',
        direccion: '',
        localidad: '',
        notas: '',
      });
      setErrors({});
    }
  }, [visible, proveedor]);

  if (!visible) return null;

  const baseClass = `w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 ${
    darkMode
      ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
      : 'bg-white border-gray-300 placeholder-gray-400'
  }`;

  const formatCuil = (cuil) => {
    const digits = (cuil || '').replace(/\D+/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length > 2 && digits.length < 10) return digits.slice(0,2) + '-' + digits.slice(2);
    if (digits.length === 10) return digits.slice(0,2) + '-' + digits.slice(2,9) + '-' + digits.slice(9);
    if (digits.length === 11) return digits.slice(0,2) + '-' + digits.slice(2,10) + '-' + digits.slice(10);
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));

    // validaciones rápidas inline
    if (field === 'telefono') {
      const telClean = value.replace(/\D+/g, '');
      if (!/^\d*$/.test(value)) setErrors(prev => ({ ...prev, telefono: 'Solo números' }));
      else if (telClean.length > 0 && telClean < 8) setErrors(prev => ({ ...prev, telefono: 'Mínimo 8 dígitos' }));
      else if (telClean.length > 15) setErrors(prev => ({ ...prev, telefono: 'Máximo 15 dígitos' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // campos obligatorios
    if (!form.nombre.trim()) newErrors.nombre = 'Nombre obligatorio';
    if (!form.localidad.trim()) newErrors.localidad = 'Localidad obligatoria';
    if (!form.telefono.replace(/\D+/g, '')) newErrors.telefono = 'Teléfono obligatorio';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Email inválido';

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setSaving(true);
    try {
      // validación de duplicados
      const dup = await existsProveedor({ nombre: form.nombre, email: form.email, cuil: form.cuil });
      if (dup && (!proveedor || dup.id !== proveedor.id)) {
        toast.info(`Ya existe un proveedor con ese ${dup.cuil ? 'CUIL' : dup.email ? 'email' : 'nombre'}`);
        setSaving(false);
        return;
      }

      if (proveedor) {
        await updateProveedor(proveedor.id, form);
        toast.success('Proveedor actualizado');
      } else {
        await createProveedor(form);
        toast.success('Proveedor creado');
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Error guardando proveedor');
    } finally {
      setSaving(false);
    }
  };

  const camposObligatorios = ['nombre','telefono','localidad'];
  const incompletos = camposObligatorios.some(campo => !form[campo]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-md mx-2 my-4 rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-slate-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {proveedor ? 'Editar' : 'Nuevo'} Proveedor
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nombre */}
          <div>
            <label className="text-xs font-medium block mb-1">Nombre</label>
            <input value={form.nombre} onChange={e => handleChange('nombre', e.target.value)} className={baseClass} />
            {errors.nombre && <div className="text-xs text-red-500 mt-1">{errors.nombre}</div>}
          </div>

          {/* Contacto */}
          <div>
            <label className="text-xs font-medium block mb-1">Contacto</label>
            <input value={form.contacto} onChange={e => handleChange('contacto', e.target.value)} className={baseClass} />
          </div>

          {/* CUIL */}
          <div>
            <label className="text-xs font-medium block mb-1">CUIL/CUIT</label>
            <input
              value={formatCuil(form.cuil)}
              onChange={e => handleChange('cuil', e.target.value.replace(/\D+/g, '').slice(0,11))}
              className={baseClass}
              inputMode="numeric"
              maxLength={14}
              placeholder="20-12345678-3"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="text-xs font-medium block mb-1">Dirección</label>
            <input value={form.direccion} onChange={e => handleChange('direccion', e.target.value)} className={baseClass} />
          </div>

          {/* Localidad */}
          <div>
            <label className="text-xs font-medium block mb-1">Localidad</label>
            <input value={form.localidad} onChange={e => handleChange('localidad', e.target.value)} className={baseClass} />
            {errors.localidad && <div className="text-xs text-red-500 mt-1">{errors.localidad}</div>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-xs font-medium block mb-1">Teléfono</label>
            <input value={form.telefono} onChange={e => handleChange('telefono', e.target.value)} className={baseClass} />
            {errors.telefono && <div className="text-xs text-red-500 mt-1">{errors.telefono}</div>}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium block mb-1">Email</label>
            <input value={form.email} onChange={e => handleChange('email', e.target.value)} className={baseClass} />
            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-medium block mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => handleChange('notas', e.target.value)} rows={2} className={baseClass} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
              Cancelar
            </button>
            <button type="submit" disabled={saving || incompletos} className={`px-4 py-2 rounded text-sm font-medium ${saving || incompletos ? 'opacity-60 cursor-not-allowed' : ''} ${darkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
