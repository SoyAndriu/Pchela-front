// Importamos hooks de React
import { useEffect, useState } from "react";
// Importamos nuestro contexto de autenticación para saber si ya cargó y el token
import { useAuth } from "../auth/AuthContext";
import { API_BASE } from "../config/productConfig";
import { getHeaders } from "../utils/productUtils";

export default function Usuarios({ darkMode }) {
  // Extraemos token y loading del contexto
  const { token, loading: authLoading } = useAuth();

  // Estado donde vamos a guardar la lista de usuarios (inicializar como array vacío)
  const [users, setUsers] = useState([]);
  // Estado para saber si todavía estamos cargando la info
  const [loading, setLoading] = useState(true);
  // Estado para guardar errores en caso de que algo falle
  const [error, setError] = useState(null);
  // Estado para saber si estamos eliminando (opcional para feedback)
  const [deletingId, setDeletingId] = useState(null);
  // abrir/cerrar formulario
  const [showForm, setShowForm] = useState(false);
  // null = nuevo, objeto = editar  
  const [editingUser, setEditingUser] = useState(null); 
  // Errores de validación del formulario (inline)
  const [formErrors, setFormErrors] = useState({ username: "", email: "", password: "", confirmPassword: "", general: "" });
  // Estados controlados del formulario para validación reactiva
  const [formState, setFormState] = useState({ username: "", email: "", password: "", confirmPassword: "", role: "", changePassword: false });

  // Reglas de validación
  const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/; // 3-30, alfanumérico y . _ -
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // formato básico
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/; // 8+, al menos una letra y un número

  // Función para eliminar un usuario
  async function handleDelete(id) {
    if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`${API_BASE}/users/${id}/`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Error eliminando usuario");

      // Sacamos al usuario de la lista sin volver a pedir todo
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // Función para manejar el envío del formulario (nuevo o editar)
  async function handleSubmit(e) {
    e.preventDefault();
    const normalizedUsername = (formState.username || "").trim();
    const normalizedEmail = (formState.email || "").trim().toLowerCase();

    // Validaciones de formato previas
    const usernameInvalid = !USERNAME_REGEX.test(normalizedUsername);
    const emailInvalid = normalizedEmail && !EMAIL_REGEX.test(normalizedEmail);
  const isEditing = !!editingUser;
  const wantsToChangePassword = isEditing ? !!formState.changePassword : true;
  const passwordInvalid = wantsToChangePassword && !PASSWORD_REGEX.test(formState.password || "");
  const confirmInvalid = wantsToChangePassword && (formState.password || "") !== (formState.confirmPassword || "");

    // Reset de errores
    setFormErrors({ username: "", email: "", password: "", confirmPassword: "", general: "" });

    if (usernameInvalid || emailInvalid || passwordInvalid || confirmInvalid) {
      setFormErrors({
        username: usernameInvalid ? "Usuario inválido: 3-30 caracteres, sin espacios. Usa letras, números, punto, guion o guion bajo." : "",
        email: emailInvalid ? "Correo inválido." : "",
        password: passwordInvalid ? "La contraseña debe tener mínimo 8 caracteres, con al menos una letra y un número." : "",
        confirmPassword: confirmInvalid ? "Las contraseñas no coinciden." : "",
        general: "",
      });
      return;
    }

    const userData = {
      username: normalizedUsername,
      email: normalizedEmail,
      role: formState.role,
      // password se añade sólo si es nuevo, o si en edición se activó cambiar contraseña
    };

    // Validación duplicados en front
    const usernameExists = users.some(
      (u) => u.username?.toLowerCase?.() === userData.username.toLowerCase() && (!editingUser || u.id !== editingUser.id)
    );
    const emailExists = userData.email
      ? users.some((u) => (u.email || "")?.toLowerCase?.() === userData.email.toLowerCase() && (!editingUser || u.id !== editingUser.id))
      : false;

    if (usernameExists || emailExists) {
      setFormErrors({
        username: usernameExists ? "Ese nombre de usuario ya existe." : "",
        email: emailExists ? "Ese correo ya está registrado." : "",
        password: "",
        general: "",
      });
      return;
    }

    try {
      let url = `${API_BASE}/users/`;
      let method = "POST";

      if (editingUser) {
        url = `${API_BASE}/users/${editingUser.id}/`;
        method = "PATCH";
      }

      // Añadir password sólo cuando corresponde
      const payload = editingUser
        ? (formState.changePassword ? { ...userData, password: formState.password } : userData)
        : { ...userData, password: formState.password };

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Intentar mapear errores del backend a campos
        let backendError = "Error guardando usuario";
        try {
          const err = await res.json();
          const usernameErr = Array.isArray(err?.username) ? err.username[0] : (typeof err?.username === 'string' ? err.username : null);
          const emailErr = Array.isArray(err?.email) ? err.email[0] : (typeof err?.email === 'string' ? err.email : null);
          const detail = err?.detail || err?.message;
          if (usernameErr || emailErr || detail) {
            setFormErrors({
              username: usernameErr || "",
              email: emailErr || "",
              password: "",
              confirmPassword: "",
              general: detail || "",
            });
            return;
          }
        } catch {
          // ignore parse error and show generic backend error
        }
        throw new Error(backendError);
      }

      const saved = await res.json();

      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === saved.id ? saved : u))
        );
      } else {
        setUsers((prev) => [...prev, saved]);
      }

      // 👇 Cerramos modal al terminar
      setShowForm(false);
  setEditingUser(null);
  setFormErrors({ username: "", email: "", password: "", confirmPassword: "", general: "" });
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, general: err.message || "Error guardando usuario" }));
    }
  }

  // useEffect se ejecuta cuando el componente se monta o cambia el token
  useEffect(() => {
    // Definimos una función asíncrona para pedir usuarios al backend
    async function fetchUsers() {
      try {
        // Hacemos la petición GET al backend, mandando el token en el header
        const res = await fetch(`${API_BASE}/users/`, { headers: getHeaders() });

        // Si la respuesta no es 200 OK, lanzamos un error
        if (!res.ok) throw new Error("Error cargando usuarios");

        // Convertimos la respuesta a JSON
        const data = await res.json();

        // Guardamos los usuarios en el estado (asegurándonos de que sea un array)
        setUsers(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        // Si algo falla, guardamos el mensaje de error
        setError(err.message);
        // Asegurarnos de que users sea un array vacío en caso de error
        setUsers([]);
      } finally {
        // Siempre marcamos que ya dejamos de cargar
        setLoading(false);
      }
    }

    // Solo intentamos cargar usuarios si ya terminó la verificación y tenemos token
    if (!authLoading && token) {
      fetchUsers();
    }
  }, [token, authLoading]); // 👈 ejecuta cuando termina auth y cambia el token

  // Si todavía está cargando, mostramos un mensaje
  if (loading) return <div className={`p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>Cargando usuarios…</div>;

  // Si hubo un error, lo mostramos en rojo
  if (error) return <div className={`p-6 ${darkMode ? "bg-gray-900 text-red-400" : "text-red-600"}`}>Error: {error}</div>;

  // Si todo salió bien, renderizamos la tabla con usuarios
  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      {/* Título */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      <button
        onClick={() => {
          setFormErrors({ username: "", email: "", password: "", confirmPassword: "", general: "" });
          setFormState({ username: "", email: "", password: "", confirmPassword: "", role: "", changePassword: false });
          setEditingUser(null);
          setShowForm(true);
        }}
        className="mb-4 px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700"
      >
        + Agregar usuario
      </button>
      </div>

      {/* Tabla de usuarios */}
      <div className={`overflow-x-auto border rounded-lg shadow-sm ${darkMode ? "border-gray-700" : "border-slate-200"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-slate-800"}>
            <tr>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Rol</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* Si la lista está vacía o no es un array mostramos un aviso */}
            {!Array.isArray(users) || users.length === 0 ? (
              <tr>
                <td colSpan="5" className={`px-4 py-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {!Array.isArray(users) ? "Error cargando usuarios" : "No hay usuarios registrados"}
                </td>
              </tr>
            ) : (
              // Si hay usuarios, recorremos la lista y pintamos cada fila
              users.map((u) => (
                <tr key={u.id} className={darkMode ? "border-t border-gray-700" : "border-t border-slate-200"}>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.email || "—"}</td>
                  <td className="px-4 py-2">{u.role || "—"}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                          setFormErrors({ username: "", email: "", password: "", confirmPassword: "", general: "" });
                          setFormState({ username: u.username || "", email: u.email || "", password: "", confirmPassword: "", role: u.role || "", changePassword: false });
                        setShowForm(true);
                      }}
                      className={`${darkMode
                        ? "px-3 py-1 rounded border border-gray-600 text-gray-200 hover:bg-gray-700"
                        : "px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
                      className={`${darkMode
                        ? "px-3 py-1 rounded border border-red-500 text-red-400 hover:bg-red-900/20 disabled:opacity-50"
                        : "px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"}`}
                    >
                      {deletingId === u.id ? "Eliminando…" : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 NUEVO: Modal emergente en lugar del form debajo */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/20 z-50">
          <div className={`${darkMode ? "bg-gray-800 text-white border border-gray-700" : "bg-white text-gray-900 border border-slate-200"} p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all`}>
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? "Editar usuario" : "Nuevo usuario"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {formErrors.general && (
                <div className="text-sm text-red-500">{formErrors.general}</div>
              )}
              <div>
                <label className="block text-sm">Usuario</label>
                <input
                  type="text"
                  name="username"
                  value={formState.username}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\s+/g, ""); // sin espacios
                    // cortar longitud máxima 30
                    if (v.length > 30) v = v.slice(0, 30);
                    setFormState((s) => ({ ...s, username: v }));
                    // Validación de formato
                    const formatInvalid = !USERNAME_REGEX.test(v);
                    if (formatInvalid) {
                      setFormErrors((err) => ({ ...err, username: "Usuario inválido: 3-30 caracteres, sin espacios. Usa letras, números, punto, guion o guion bajo." }));
                      return;
                    }
                    // Validación duplicado
                    const exists = users.some((u) => u.username?.toLowerCase?.() === v.trim().toLowerCase() && (!editingUser || u.id !== editingUser.id));
                    setFormErrors((err) => ({ ...err, username: exists ? "Ese nombre de usuario ya existe." : "" }));
                  }}
                  className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  required
                />
                {formErrors.username && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const v = raw.trim().toLowerCase();
                    setFormState((s) => ({ ...s, email: v }));
                    if (!v) return setFormErrors((err) => ({ ...err, email: "" }));
                    // formato
                    const formatInvalid = !EMAIL_REGEX.test(v);
                    if (formatInvalid) {
                      setFormErrors((err) => ({ ...err, email: "Correo inválido." }));
                      return;
                    }
                    // duplicado
                    const exists = users.some((u) => (u.email || "")?.toLowerCase?.() === v && (!editingUser || u.id !== editingUser.id));
                    setFormErrors((err) => ({ ...err, email: exists ? "Ese correo ya está registrado." : "" }));
                  }}
                  className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Contraseña (crear) o Toggle (editar) */}
              {!editingUser ? (
                <>
                  <div>
                    <label className="block text-sm">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      value={formState.password}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormState((s) => ({ ...s, password: v }));
                        const invalid = !PASSWORD_REGEX.test(v || "");
                        setFormErrors((err) => ({ ...err, password: invalid ? "La contraseña debe tener mínimo 8 caracteres, con al menos una letra y un número." : "" }));
                        // validar confirmación si ya hay confirm
                        setFormErrors((err) => ({ ...err, confirmPassword: (s => (v || "") !== (s.confirmPassword || ""))(formState) ? "Las contraseñas no coinciden." : "" }));
                      }}
                      className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                      required
                    />
                    {formErrors.password && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm">Confirmar contraseña</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formState.confirmPassword}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormState((s) => ({ ...s, confirmPassword: v }));
                        const mismatch = (formState.password || "") !== v;
                        setFormErrors((err) => ({ ...err, confirmPassword: mismatch ? "Las contraseñas no coinciden." : "" }));
                      }}
                      className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                      required
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      id="toggle-change-password"
                      type="checkbox"
                      checked={!!formState.changePassword}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormState((s) => ({ ...s, changePassword: checked }));
                        if (!checked) {
                          setFormState((s) => ({ ...s, password: "", confirmPassword: "" }));
                          setFormErrors((err) => ({ ...err, password: "", confirmPassword: "" }));
                        }
                      }}
                    />
                    <label htmlFor="toggle-change-password" className="text-sm select-none">Cambiar contraseña</label>
                  </div>
                  {formState.changePassword && (
                    <>
                      <div>
                        <label className="block text-sm">Nueva contraseña</label>
                        <input
                          type="password"
                          name="password"
                          value={formState.password}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFormState((s) => ({ ...s, password: v }));
                            const invalid = !PASSWORD_REGEX.test(v || "");
                            setFormErrors((err) => ({ ...err, password: invalid ? "La contraseña debe tener mínimo 8 caracteres, con al menos una letra y un número." : "" }));
                            setFormErrors((err) => ({ ...err, confirmPassword: (s => (v || "") !== (s.confirmPassword || ""))(formState) ? "Las contraseñas no coinciden." : "" }));
                          }}
                          className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                          required
                        />
                        {formErrors.password && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm">Confirmar contraseña</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formState.confirmPassword}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFormState((s) => ({ ...s, confirmPassword: v }));
                            const mismatch = (formState.password || "") !== v;
                            setFormErrors((err) => ({ ...err, confirmPassword: mismatch ? "Las contraseñas no coinciden." : "" }));
                          }}
                          className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                          required
                        />
                        {formErrors.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm">Rol</label>
                <select
                  name="role"
                  value={formState.role}
                  onChange={(e) => setFormState((s) => ({ ...s, role: e.target.value }))}
                  className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  required
                >
                  <option value="">-- Selecciona --</option>
                  <option value="gerente">Gerente</option>
                  <option value="empleado">Empleado</option>
                  <option value="cajero">Cajero</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormErrors({ username: "", email: "", password: "", confirmPassword: "", general: "" });
                    setFormState({ username: "", email: "", password: "", confirmPassword: "", role: "", changePassword: false });
                  }}
                  className={`${darkMode ? "px-4 py-2 rounded border border-gray-600 text-gray-200 hover:bg-gray-700" : "px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={(() => {
                    const baseInvalid = !!formErrors.username || !!formErrors.email || !!formErrors.password || !!formErrors.confirmPassword || !formState.username || !formState.role;
                    if (editingUser) {
                      if (formState.changePassword) {
                        return baseInvalid || !formState.password || !formState.confirmPassword || formState.password !== formState.confirmPassword;
                      }
                      return baseInvalid;
                    }
                    // creando
                    return baseInvalid || !formState.password || !formState.confirmPassword || formState.password !== formState.confirmPassword;
                  })()}
                  className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
