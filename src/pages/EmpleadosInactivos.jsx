import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpleados } from '../hooks/useEmpleados';
import UsuarioVinculadoModal from '../components/empleados/UsuarioVinculadoModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';

function EmpleadosInactivosContent({ darkMode }) {
  const navigate = useNavigate();
  const { items, loading, error, fetchAll, reactivate } = useEmpleados();
  const [showUsuario, setShowUsuario] = useState(false);
  const [usuarioData, setUsuarioData] = useState(null);
  const [confirmReactivar, setConfirmReactivar] = useState(null);
  const toast = useToast();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const inactivos = Array.isArray(items) ? items.filter(e => e.activo === false) : [];

  return (
    <div className={`space-y-8 p-6 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4">Empleados Inactivos</h1>
        <button
          onClick={() => navigate('/gerente/config/empleados')}
          className={`px-4 py-2 rounded font-semibold shadow transition ${darkMode ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}
        >
          Ver empleados activos
        </button>
      </div>

      {loading && <div className="text-center text-gray-400">Cargando empleados…</div>}
      {error && <div className="text-center text-red-500">{error}</div>}

      <div className={`overflow-x-auto border rounded-lg shadow-sm ${darkMode ? "border-gray-700" : "border-slate-200"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-slate-800"}>
            <tr>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Apellido</th>
              <th className="px-4 py-2 text-left">DNI</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Rol</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inactivos.length === 0 ? (
              <tr>
                <td colSpan="6" className={`px-4 py-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No hay empleados inactivos
                </td>
              </tr>
            ) : (
              inactivos.map((emp, idx) => (
                <tr key={emp.id || `row-${idx}`} className={darkMode ? "border-t border-gray-700" : "border-t border-slate-200"}>
                  <td className="px-4 py-2">{emp.nombre || '-'}</td>
                  <td className="px-4 py-2">{emp.apellido || '-'}</td>
                  <td className="px-4 py-2">{emp.dni || '-'}</td>
                  <td className="px-4 py-2 max-w-[180px] truncate">{emp.email || '-'}</td>
                  <td className="px-4 py-2">{emp.role || emp.nombre_tipo_usuario || '-'}</td>
                  <td className="px-4 py-2 text-right space-x-2 min-w-[120px] flex justify-end items-center gap-2">

                    <button
                      title="Ver usuario vinculado"
                      onClick={() => {
                        setUsuarioData({
                          username: emp.username,
                          email: emp.email,
                          role: emp.role || emp.nombre_tipo_usuario
                        });
                        setShowUsuario(true);
                      }}
                      className={`${darkMode
                        ? "p-2 rounded border border-gray-600 text-gray-200 hover:bg-gray-700"
                        : "p-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>

                    <button
                      onClick={() => setConfirmReactivar(emp)}
                      className={`${darkMode
                        ? "px-3 py-1 rounded border border-green-500 text-green-400 hover:bg-green-900/20"
                        : "px-3 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50"}`}
                    >
                      Reactivar
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MODALES FUERA DE LA TABLA */}
      <ConfirmModal
        open={!!confirmReactivar}
        title="Reactivar empleado"
        message={confirmReactivar ? `¿Seguro que deseas reactivar a ${confirmReactivar.nombre} ${confirmReactivar.apellido}?` : ''}
        confirmText="Reactivar"
        darkMode={darkMode}
        onConfirm={async () => {
          if (confirmReactivar) {
            try {
              await reactivate(confirmReactivar.id);
              toast.success('Empleado reactivado correctamente');
            } catch {
              toast.error('No se pudo reactivar el empleado');
            } finally {
              fetchAll();
              setConfirmReactivar(null);
            }
          }
        }}
        onCancel={() => setConfirmReactivar(null)}
      />

      <UsuarioVinculadoModal
        open={showUsuario}
        onClose={() => setShowUsuario(false)}
        usuario={usuarioData}
        darkMode={darkMode}
      />
    </div>
  );
}

export default EmpleadosInactivosContent;
