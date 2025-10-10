import { useEffect, useRef, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  // 1. Estados locales para login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  // 2. Estados para modal de recuperación
  const [showResetModal, setShowResetModal] = useState(false); // abrir/cerrar
  const [resetEmail, setResetEmail] = useState(""); // email que escribe el usuario
  const [resetStatus, setResetStatus] = useState(null); // loading / success / error

  // 3. Manejo del submit de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    const res = await login(username, password, remember);
    if (!res?.success) {
      setErrorMsg(res?.message || "No se pudo iniciar sesión.");
      setSubmitting(false);
      return;
    }
    // Toast básico de éxito y navegación según rol
    const toast = document.createElement("div");
    toast.textContent = "¡Bienvenido!";
    toast.className = "fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);

    const role = res.role;
    setTimeout(() => {
      if (role === "gerente") navigate("/gerente");
      else if (role === "empleado") navigate("/empleado");
      else if (role === "cajero") navigate("/cajero");
      else navigate("/login");
    }, 300);
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-rose-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg border border-slate-200 w-96"
      >
        {/* Logo + título */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/images/Logoestrellanegra.png"
            alt="Pchela"
            className="h-12 mb-3"
            onError={(e) => {
              // fallback al logo por defecto de vite si no existe el de marca
              e.currentTarget.src = "/vite.svg";
            }}
          />
          <h2 className="text-2xl font-bold text-center text-pink-700">Iniciar Sesión</h2>
          <p className="text-sm text-slate-500 mt-1 text-center">Bienvenido de vuelta, ingresa tus credenciales para continuar.</p>
        </div>

        {/* Campo usuario */}
        <label className="sr-only" htmlFor="username">Usuario</label>
        <input
          id="username"
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="w-full p-2 mb-4 border border-slate-300 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
          required
          ref={userRef}
        />

        {/* Campo contraseña con toggle */}
        <label className="sr-only" htmlFor="password">Contraseña</label>
        <div className="relative mb-2">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full p-2 pr-10 border border-slate-300 rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-2 my-auto px-1 text-slate-500 hover:text-slate-700"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Error inline */}
        {errorMsg && (
          <p className="text-sm text-red-600 mb-2" role="alert">{errorMsg}</p>
        )}

        {/* Recordarme */}
        <div className="flex items-center justify-between mb-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-pink-600"
            />
            Recordarme
          </label>
        </div>

        {/* Botón login */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Ingresando..." : "Entrar"}
        </button>

        {/* Link para abrir modal */}
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="text-sm text-pink-600 hover:underline mt-3 block mx-auto"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>

      {/* 🚀 Modal de recuperación */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/20 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl border border-slate-200 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-pink-700">
              Recuperar contraseña
            </h2>

            <form onSubmit={requestPasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm">Correo electrónico</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
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
                  className="px-4 py-2 rounded border border-slate-300 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetStatus === "loading"}
                  className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700 transition-colors"
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
