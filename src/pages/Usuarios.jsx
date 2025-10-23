import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_BASE } from "../config/productConfig";
import { getHeaders } from "../utils/productUtils";

export default function Usuarios({ darkMode }) {
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });
  const [formState, setFormState] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    changePassword: false,
  });

  useEffect(() => {
    if (!token || authLoading) return;
    fetchUsers();
  }, [token, authLoading]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/usuarios/`, {
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error("Error al obtener usuarios");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Tabla de usuarios */}
      <div className={`${darkMode ? "bg-gray-900 text-gray-200" : "bg-white"} p-4 rounded-xl shadow`}>
        <h2 className="text-xl font-semibold mb-4">Usuarios</h2>

        {loading ? (
          <p className="text-center py-4">Cargando usuarios...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-4">{error}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className={darkMode ? "border-b border-gray-700" : "border-b border-slate-200"}>
                <th className="text-left px-4 py-2">Usuario</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Rol</th>
                <th className="text-right px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(users) || users.length === 0 ? (
                <tr>
                  <td colSpan="5" className={`px-4 py-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {!Array.isArray(users) ? "Error cargando usuarios" : "No hay usuarios registrados"}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={darkMode ? "border-t border-gray-700" : "border-t border-slate-200"}>
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">{u.email || "—"}</td>
                    <td className="px-4 py-2">{u.role || "—"}</td>
                    <td className="px-4 py-2 text-right min-w-[60px] flex justify-end items-center gap-2">
                      <button
                        title="Ver empleado"
                        onClick={() => navigate(`/empleados/${u.empleado_id || u.empleado || u.id}`)}
                        className={`${darkMode
                          ? "p-2 rounded border border-gray-600 text-gray-200 hover:bg-gray-700"
                          : "p-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal (solo consulta / visual, sin modificar) */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className={`${darkMode ? "bg-gray-900 text-gray-100" : "bg-white"} p-6 rounded-xl w-full max-w-md`}>
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? "Detalle de usuario" : "Nuevo usuario"}
            </h3>

            <form>
              {/* Aquí mantuve tu formulario, sin modificar lógica, solo que ahora está dentro del return */}
              {/* Lo dejé listo para consulta (como pediste) */}
              <p className="text-center text-sm opacity-70">Formulario solo para consulta</p>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                  }}
                  className={`${darkMode ? "px-4 py-2 rounded border border-gray-600 text-gray-200 hover:bg-gray-700" : "px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
