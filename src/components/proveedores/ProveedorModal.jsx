import React, { useEffect, useState } from 'react';
import useProveedores from '../../hooks/useProveedores';

export default function ProveedorModal({ visible, onClose, onSave, proveedor, darkMode }) {
  const { existsProveedor } = useProveedores();
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', cuil: '', direccion: '', localidad: '', notas: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [duplicateError, setDuplicateError] = useState(null);

  useEffect(() => {
    if (visible) {
      setForm(proveedor || { nombre: '', contacto: '', telefono: '', email: '', cuil: '', direccion: '', localidad: '', notas: '' });
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

  const handleChange = async (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    // Validación en vivo de duplicados para nombre, email y cuil
    if (field === 'nombre' && value.trim()) {
      const exists = await existsProveedor({ nombre: value });
      setErrors((prev) => ({ ...prev, nombre: exists && (!proveedor || exists.id !== proveedor.id) ? 'Ya existe un proveedor con ese nombre' : undefined }));
    }
    if (field === 'email' && value.trim()) {
      const exists = await existsProveedor({ email: value });
      setErrors((prev) => ({ ...prev, email: exists && (!proveedor || exists.id !== proveedor.id) ? 'Ya existe un proveedor con ese email' : undefined }));
    }
    if (field === 'cuil' && value.replace(/\D+/g, '').length === 11) {
      const exists = await existsProveedor({ cuil: value });
      setErrors((prev) => ({ ...prev, cuil: exists && (!proveedor || exists.id !== proveedor.id) ? 'Ya existe un proveedor con ese CUIL' : undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const cuilClean = form.cuil.replace(/\D+/g, '');
    if (!(cuilClean.length === 10 || cuilClean.length === 11)) newErrors.cuil = 'El CUIL debe tener 10 u 11 números';
    if (duplicateError) newErrors.general = duplicateError;
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!form.localidad?.trim()) newErrors.localidad = 'La localidad es obligatoria';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Email inválido';
    const telClean = form.telefono.replace(/\D+/g, '');
    if (form.telefono && (telClean.length < 8 || !/^\d+$/.test(telClean))) newErrors.telefono = 'El teléfono debe tener al menos 8 números y solo contener números';
    if (form.contacto && form.contacto.trim().length < 3) newErrors.contacto = 'El contacto debe tener al menos 3 caracteres';
    if (form.direccion && form.direccion.trim().length < 5) newErrors.direccion = 'La dirección debe tener al menos 5 caracteres';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setErrors({ general: err.message || 'Error guardando proveedor' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-md rounded-xl shadow-lg p-6 ${
          darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-slate-200'
        }`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {proveedor ? 'Editar' : 'Nuevo'} Proveedor
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nombre */}
          <div>
            <label className="text-xs font-medium block mb-1">Nombre (Empresa)</label>
            <input value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} className={baseClass} />
            {errors.nombre && <div className="text-xs text-red-500 mt-1">{errors.nombre}</div>}
          </div>

          {/* Contacto */}
          <div>
            <label className="text-xs font-medium block mb-1">Contacto</label>
            <input value={form.contacto} onChange={(e) => handleChange('contacto', e.target.value)} className={baseClass} />
            {errors.contacto && <div className="text-xs text-red-500 mt-1">{errors.contacto}</div>}
          </div>

          {/* CUIL */}
          <div>
            <label className="text-xs font-medium block mb-1">CUIL/CUIT</label>
            <input
              value={formatCuil(form.cuil)}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D+/g, '').slice(0, 11);
                handleChange('cuil', raw);
              }}
              className={baseClass}
              inputMode="numeric"
              maxLength={14}
              placeholder="20-12345678-3"
            />
            {errors.cuil && <div className="text-xs text-red-500 mt-1">{errors.cuil}</div>}
            {form.cuil.replace(/\D+/g, '').length > 0 &&
              form.cuil.replace(/\D+/g, '').length < 10 && (
                <div className="text-xs text-gray-400 mt-1">Debe tener 11 o 10 números</div>
              )}
          </div>

          {/* Dirección */}
          <div>
            <label className="text-xs font-medium block mb-1">Dirección</label>
            <input value={form.direccion} onChange={(e) => handleChange('direccion', e.target.value)} className={baseClass} />
            {errors.direccion && <div className="text-xs text-red-500 mt-1">{errors.direccion}</div>}
          </div>

          {/* Localidad */}
          <div>
            <label className="text-xs font-medium block mb-1">Localidad</label>
            <input value={form.localidad} onChange={(e) => handleChange('localidad', e.target.value)} className={baseClass} />
            {errors.localidad && <div className="text-xs text-red-500 mt-1">{errors.localidad}</div>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-xs font-medium block mb-1">Teléfono</label>
            <input value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} className={baseClass} />
            {errors.telefono && <div className="text-xs text-red-500 mt-1">{errors.telefono}</div>}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium block mb-1">Email</label>
            <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={baseClass} />
            {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-medium block mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              rows={2}
              className={baseClass}
            />
            {errors.notas && <div className="text-xs text-red-500 mt-1">{errors.notas}</div>}
          </div>

          {errors.general && <p className="text-xs text-red-500">{errors.general}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded text-sm ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              type="submit"
              className={`px-4 py-2 rounded text-sm font-medium ${
                saving ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                darkMode
                  ? 'bg-pink-600 hover:bg-pink-700 text-white'
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
              }`}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
