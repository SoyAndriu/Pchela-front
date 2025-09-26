import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  // 1. Estados locales para guardar lo que escribe el usuario
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // 2. Traemos la función login del portero
  const { login } = useAuth();

  // 3. Cuando el usuario envía el form
  const handleSubmit = (e) => {
    e.preventDefault(); // evita recargar la página
    login(username, password); // llamamos al portero
  };

  // 4. Interfaz simple con Tailwind
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

        {/* Botón */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
