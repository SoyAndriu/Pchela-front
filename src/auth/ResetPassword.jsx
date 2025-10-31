import { useState } from "react";
import { API_BASE } from "../config/productConfig";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";

export default function ResetPassword() {
  // 1) Sacamos uid y token desde la URL del mail (ej: /reset-password?uid=3&token=abc123)
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const navigate = useNavigate();
  const toast = useToast();

  // 2) Estados locales
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null); 
  // status puede ser: null | "loading" | "success" | "error" | "mismatch"

  // 3) Cuando el usuario envía el form
  async function handleSubmit(e) {
    e.preventDefault();

    // Validar que las contraseñas coincidan antes de pedir al server
    if (password !== confirmPassword) {
      setStatus("mismatch");
      return;
    }

    try {
      setStatus("loading");

      const res = await fetch(`${API_BASE}/password_reset/confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }), // 👈 mandamos al backend
      });

      if (!res.ok) throw new Error("Error reseteando contraseña");

      setStatus("success");
      toast.success("Contraseña actualizada. Redirigiendo al login...");
      // Redirige al login después de 2 segundos
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error("Hubo un error al restablecer la contraseña");
    }
  }

  // 4) UI con mismo estilo que Login.jsx
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Restablecer contraseña
        </h2>

        {/* Campo nueva contraseña */}
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />

        {/* Campo confirmar contraseña */}
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 mb-6 border rounded"
          required
        />

        {/* Botón de guardar */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {status === "loading" ? "Guardando..." : "Guardar"}
        </button>

        {/* Feedback */}
        {status === "mismatch" && (
          <p className="text-red-600 text-sm mt-3 text-center">
            ❌ Las contraseñas no coinciden
          </p>
        )}
        {status === "success" && (
          <p className="text-green-600 text-sm mt-3 text-center">
            ✅ Contraseña actualizada. Redirigiendo al login...
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600 text-sm mt-3 text-center">
            ❌ Hubo un error al restablecer la contraseña
          </p>
        )}
      </form>
    </div>
  );
}
