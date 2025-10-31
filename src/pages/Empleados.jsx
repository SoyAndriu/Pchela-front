import React, { useEffect, useState } from 'react';
import { useEmpleados } from '../hooks/useEmpleados';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';
import EmpleadoFormModal from '../components/empleados/EmpleadoFormModal';
import UsuarioVinculadoModal from '../components/empleados/UsuarioVinculadoModal';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';

function EmpleadosContent({ darkMode }) {
  const { items, loading, error, fetchAll, remove, reactivate } = useEmpleados();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showUsuario, setShowUsuario] = useState(false);
  const [usuarioData, setUsuarioData] = useState(null);
  const [confirmInactivar, setConfirmInactivar] = useState(null); // empleado a inactivar
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNew = () => { setEditing(null); setShowModal(true); };

  const openEdit = (empleado) => {
    let id = null;
    if (empleado.id !== undefined && empleado.id !== null) id = empleado.id;
    else if (empleado.user_id !== undefined && empleado.user_id !== null) id = empleado.user_id;
    else if (empleado.pk !== undefined && empleado.pk !== null) id = empleado.pk;
    else if (empleado.ID !== undefined && empleado.ID !== null) id = empleado.ID;
    else {
      const posibleId = Object.entries(empleado).find(([k, v]) =>
        (k.toLowerCase().includes('id') && (typeof v === 'number' || typeof v === 'string'))
      );
      if (posibleId) id = posibleId[1];
    }
    setEditing({ ...empleado, id });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); fetchAll(); };

  // Función para reenviar credenciales (usando API_BASE + headers con token)
  const reenviarCredenciales = async (id) => {
    try {
      const res = await apiFetch(`${API_BASE}/empleados/${id}/reenviar-credenciales/`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.detail || 'Correo reenviado correctamente.');
      } else {
        toast.error(data.detail || 'Error al reenviar el correo.');
      }
    } catch (e) {
      toast.error('Error de red al reenviar el correo.');
    }
  };

  return (
    <div className={`space-y-8 p-6 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4">Empleados</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => navigate('/gerente/config/empleados-inactivos')}
            className={`mb-4 px-4 py-2 rounded border border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 ${darkMode ? 'bg-yellow-900/10 text-yellow-200 border-yellow-600 hover:bg-yellow-900/30' : ''}`}
          >
            Ver inactivos
          </button>
          <button
            onClick={openNew}
            className="mb-4 px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700"
          >
            + Nuevo empleado
          </button>
        </div>
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
              <th className="px-4 py-2 text-left">Activo</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const activos = Array.isArray(items) ? items.filter(e => e.activo !== false) : [];
              if (activos.length === 0) {
                return (
                  <tr>
                    <td colSpan="7" className={`px-4 py-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      No hay empleados activos
                    </td>
                  </tr>
                );
              }
              return activos.map((emp, idx) => (
                <tr key={emp.id || `row-${idx}`} className={darkMode ? "border-t border-gray-700" : "border-t border-slate-200"}>
                  <td className="px-4 py-2">{emp.nombre || '-'}</td>
                  <td className="px-4 py-2">{emp.apellido || '-'}</td>
                  <td className="px-4 py-2">{emp.dni || '-'}</td>
                  <td className="px-4 py-2 max-w-[180px] truncate">{emp.email || '-'}</td>
                  <td className="px-4 py-2">{emp.role || emp.nombre_tipo_usuario || '-'}</td>
                  <td className="px-4 py-2">{emp.activo ? 'Sí' : 'No'}</td>
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
                      onClick={() => openEdit(emp)}
                      className={`${darkMode
                        ? "px-3 py-1 rounded border border-gray-600 text-gray-200 hover:bg-gray-700"
                        : "px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => setConfirmInactivar(emp)}
                      className={`${darkMode
                        ? "px-3 py-1 rounded border border-yellow-500 text-yellow-400 hover:bg-yellow-900/20"
                        : "px-3 py-1 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50"}`}
                    >
                      Inactivar
                    </button>

                    <button
                      onClick={() => reenviarCredenciales(emp.id)}
                      className={`${darkMode
                        ? "px-3 py-1 rounded border border-blue-500 text-blue-300 hover:bg-blue-900/20"
                        : "px-3 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50"}`}
                      title="Reenviar credenciales"
                    >
                      Reenviar credenciales
                    </button>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {showModal && (
        <EmpleadoFormModal
          visible={showModal}
          onClose={closeModal}
          initialData={editing}
          onSaved={closeModal}
          darkMode={darkMode}
        />
      )}

      <UsuarioVinculadoModal
        open={showUsuario}
        onClose={() => setShowUsuario(false)}
        usuario={usuarioData}
        darkMode={darkMode}
      />

      <ConfirmModal
        open={!!confirmInactivar}
        title="Inactivar empleado"
        message={confirmInactivar ? `¿Seguro que deseas inactivar a ${confirmInactivar.nombre} ${confirmInactivar.apellido}?` : ''}
        confirmText="Inactivar"
        danger
        darkMode={darkMode}
        onConfirm={async () => {
          if (confirmInactivar) {
            try {
              await remove(confirmInactivar.id);
              toast.success('Empleado inactivado correctamente');
            } catch (err) {
              toast.error('No se pudo inactivar el empleado');
            } finally {
              fetchAll();
              setConfirmInactivar(null);
            }
          }
        }}
        onCancel={() => setConfirmInactivar(null)}
      />
    </div>
  );
}

export default EmpleadosContent;
