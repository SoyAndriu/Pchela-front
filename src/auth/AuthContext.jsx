/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // 🔑 Login real contra Django
  const login = async (username, password, remember = false) => {
    try {
      // 1) Pedimos token
      const res = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let message = "Usuario o contraseña incorrectos";
        try {
          const err = await res.json();
          message = err?.detail || err?.message || message;
  } catch { /* noop */ }
        throw new Error(message);
      }
      const data = await res.json();

      setToken(data.access);
      // Guardar token según preferencia de "Recordarme"
      try {
        // Limpiamos ambas por si existía algo previo
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        if (remember) {
          localStorage.setItem("token", data.access);
        } else {
          sessionStorage.setItem("token", data.access);
        }
      } catch {
        // Si el almacenamiento falla, no bloqueamos el login
      }

      // 2) Pedimos usuario actual
      const meRes = await fetch("http://127.0.0.1:8000/api/me/", {
        headers: { Authorization: `Bearer ${data.access}` },
      });

      if (!meRes.ok) throw new Error("Error obteniendo usuario");
      const me = await meRes.json();

      setUser(me);

      // 3) Devolvemos rol para que la UI decida navegar (permite mostrar toasts antes de redirigir)
      return { success: true, role: me.role };
    } catch (error) {
      console.error(error);
      return { success: false, message: error?.message || "Usuario o contraseña incorrectos" };
    }
  };

  // 🔑 Restaurar sesión al refrescar
  useEffect(() => {
    // Intentamos restaurar de sessionStorage primero; si no, de localStorage
    const sessionToken = sessionStorage.getItem("token");
    const localToken = localStorage.getItem("token");
    const savedToken = sessionToken || localToken;
    if (savedToken) {
      fetch("http://127.0.0.1:8000/api/me/", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Token inválido");
          return res.json();
        })
        .then((me) => {
          setToken(savedToken);
          setUser(me);
        })
  .catch(() => {
          // Si el token es inválido, limpiamos ambas ubicaciones
          try {
            sessionStorage.removeItem("token");
            localStorage.removeItem("token");
          } catch { /* noop */ }
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false); // 👈 marcamos que ya terminó la verificación
        });
    } else {
      setLoading(false); // 👈 si no había token, tampoco nos quedamos cargando
    }
  }, []);


  // 🔑 Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
  } catch { /* noop */ }
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

