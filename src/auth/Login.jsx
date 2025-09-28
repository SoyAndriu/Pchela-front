import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  // 1. Estados locales para login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  // 2. Estados para modal de recuperación
  const [showResetModal, setShowResetModal] = useState(false); // abrir/cerrar
  const [resetEmail, setResetEmail] = useState(""); // email que escribe el usuario
  const [resetStatus, setResetStatus] = useState(null); // loading / success / error

  // 3. Manejo del submit de login
  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  // 4. Función para pedir reset de contraseña
  async function requestPasswordReset(e) {
    e.preventDefault();
    setResetStatus("loading");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/password_reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!res.ok) throw new Error("Error enviando email de recuperación");
      setResetStatus("success");
    } catch (err) {
      console.error(err);
      setResetStatus("error");
    }
  }

  // 5. Interfaz
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>

        {/* Campo usuario */}
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />

        {/* Campo contraseña */}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 border rounded"
        />

        {/* Botón login */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>

        {/* Link para abrir modal */}
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="text-sm text-blue-600 hover:underline mt-3 block mx-auto"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>

      {/* 🚀 Modal de recuperación */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/20 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Recuperar contraseña
            </h2>

            <form onSubmit={requestPasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm">Correo electrónico</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetEmail("");
                    setResetStatus(null);
                  }}
                  className="px-4 py-2 rounded border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetStatus === "loading"}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  {resetStatus === "loading" ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>

            {/* Mensajes de feedback */}
            {resetStatus === "success" && (
              <p className="mt-3 text-green-600 text-sm">
                ✅ Si el correo existe, recibirás un email con instrucciones.
              </p>
            )}
            {resetStatus === "error" && (
              <p className="mt-3 text-red-600 text-sm">
                ❌ Hubo un error, intenta de nuevo.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
