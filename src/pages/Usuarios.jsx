// Importamos hooks de React
import { useEffect, useState } from "react";
// Importamos nuestro contexto de autenticación para sacar el token
import { useAuth } from "../auth/AuthContext";

export default function Usuarios({ darkMode }) {
  // Extraemos el token del contexto
  const { token } = useAuth();

  // Estado donde vamos a guardar la lista de usuarios
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

  // Función para eliminar un usuario
  async function handleDelete(id) {
    if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`http://127.0.0.1:8000/api/users/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error eliminando usuario");

      // Sacamos al usuario de la lista sin volver a pedir todo
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // Función para manejar el envío del formulario (nuevo o editar)
  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const userData = {
      username: form.get("username"),
      email: form.get("email"),
      password: form.get("password"), // solo si es nuevo
      role: form.get("role"),
    };

    try {
      let url = "http://127.0.0.1:8000/api/users/";
      let method = "POST";

      if (editingUser) {
        url = `http://127.0.0.1:8000/api/users/${editingUser.id}/`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) throw new Error("Error guardando usuario");

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
    } catch (err) {
      alert(err.message);
    }
  }

  // useEffect se ejecuta cuando el componente se monta o cambia el token
  useEffect(() => {
    // Definimos una función asíncrona para pedir usuarios al backend
    async function fetchUsers() {
      try {
        // Hacemos la petición GET al backend, mandando el token en el header
        const res = await fetch("http://127.0.0.1:8000/api/users/", {
          headers: {
            Authorization: `Bearer ${token}`, // 👈 clave: mandamos el token
          },
        });

        // Si la respuesta no es 200 OK, lanzamos un error
        if (!res.ok) throw new Error("Error cargando usuarios");

        // Convertimos la respuesta a JSON
        const data = await res.json();

        // Guardamos los usuarios en el estado
        setUsers(data);
      } catch (err) {
        // Si algo falla, guardamos el mensaje de error
        setError(err.message);
      } finally {
        // Siempre marcamos que ya dejamos de cargar
        setLoading(false);
      }
    }

    // Solo intentamos cargar usuarios si tenemos token
    if (token) {
      fetchUsers();
    }
  }, [token]); // 👈 cada vez que cambie el token, se vuelve a ejecutar este efecto

  // Si todavía está cargando, mostramos un mensaje
  if (loading) return <div className={`p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>Cargando usuarios…</div>;

  // Si hubo un error, lo mostramos en rojo
  if (error) return <div className={`p-6 ${darkMode ? "bg-gray-900 text-red-400" : "text-red-600"}`}>Error: {error}</div>;

  // Si todo salió bien, renderizamos la tabla con usuarios
  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      {/* Título */}
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      <button
        onClick={() => setShowForm(true)}
        className="mb-4 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
      >
        + Agregar usuario
      </button>

      {/* Tabla de usuarios */}
      <div className={`overflow-x-auto border rounded-lg shadow ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-800" : "bg-gray-100"}>
            <tr>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Rol</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* Si la lista está vacía mostramos un aviso */}
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className={`px-4 py-6 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              // Si hay usuarios, recorremos la lista y pintamos cada fila
              users.map((u) => (
                <tr key={u.id} className={darkMode ? "border-t border-gray-700" : "border-t"}>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.email || "—"}</td>
                  <td className="px-4 py-2">{u.role || "—"}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setShowForm(true);
                      }}
                      className="px-3 py-1 rounded border text-blue-600 hover:bg-blue-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
                      className="px-3 py-1 rounded border text-red-600 hover:bg-red-50 disabled:opacity-50"
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
          <div className={`bg-white ${
        darkMode ? "dark:bg-gray-800 text-white" : "text-black"
      } p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all`}>
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? "Editar usuario" : "Nuevo usuario"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Usuario</label>
                <input
                  type="text"
                  name="username"
                  defaultValue={editingUser?.username || ""}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser?.email || ""}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Solo pedir password si es un usuario nuevo */}
              {!editingUser && (
                <div>
                  <label className="block text-sm">Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm">Rol</label>
                <select
                  name="role"
                  defaultValue={editingUser?.role || ""}
                  className="w-full border rounded p-2"
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
                  }}
                  className="px-4 py-2 rounded border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
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
