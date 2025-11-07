import React from "react";

export default function EmpleadoDetailModal({ open, onClose, empleado, loading, error, darkMode }) {
  if (!open) return null;

  const overlayClass = "fixed inset-0 bg-black/50 z-40";
  const modalClass = `fixed z-50 inset-0 flex items-center justify-center px-4 py-6`;
  const panelClass = `w-full max-w-md rounded-lg shadow-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`;

  const fullName = empleado?.nombre_completo
    || [empleado?.nombre, empleado?.apellido].filter(Boolean).join(' ').trim()
    || empleado?.display_name
    || '-';

  const email = empleado?.user?.email || empleado?.email || null;
  const telefono = empleado?.telefono || empleado?.phone || null;
  const documento = empleado?.documento || empleado?.dni || empleado?.cedula || null;
  const activo = empleado?.activo;

  return (
    <>
      <div className={overlayClass} onClick={onClose} />
      <div className={modalClass}>
        <div className={panelClass}>
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Empleado</h3>
              <button
                className={`px-3 py-1 text-sm rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}
                onClick={onClose}
              >Cerrar</button>
            </div>
          </div>
          <div className="p-4 space-y-3 text-sm">
            {loading && (
              <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Cargando…</div>
            )}
            {!!error && (
              <div className={`p-2 rounded border ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>{error}</div>
            )}
            {!loading && !error && (
              <>
                <div className="flex items-center justify-between">
                  <div className="opacity-70">Nombre</div>
                  <div className="font-medium">{fullName}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="opacity-70">ID</div>
                  <div>#{empleado?.id ?? '-'}</div>
                </div>
                {email && (
                  <div className="flex items-center justify-between">
                    <div className="opacity-70">Email</div>
                    <div>{email}</div>
                  </div>
                )}
                {telefono && (
                  <div className="flex items-center justify-between">
                    <div className="opacity-70">Teléfono</div>
                    <div>{telefono}</div>
                  </div>
                )}
                {documento && (
                  <div className="flex items-center justify-between">
                    <div className="opacity-70">Documento</div>
                    <div>{documento}</div>
                  </div>
                )}
                {typeof activo === 'boolean' && (
                  <div className="flex items-center justify-between">
                    <div className="opacity-70">Estado</div>
                    <div className={activo ? 'text-green-600' : 'text-red-600'}>{activo ? 'Activo' : 'Inactivo'}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
