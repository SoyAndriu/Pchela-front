/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE } from "../config/productConfig";
import { apiFetch } from "../utils/productUtils";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const navigate = useNavigate();

  // 🔑 Login real contra Django
  const login = async (username, password, remember = false) => {
    try {
      // 1) Pedimos token
      const res = await fetch(`${API_BASE}/token/`, {
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
      const meRes = await apiFetch(`${API_BASE}/me/`);

      if (!meRes.ok) throw new Error("Error obteniendo usuario");
      const me = await meRes.json();

      setUser(me);
      // Consultar flag must_change_password
      const profileRes = await apiFetch(`${API_BASE}/user-profile/${me.id}/`);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setMustChangePassword(!!profile.must_change_password);
      } else {
        setMustChangePassword(false);
      }
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
      apiFetch(`${API_BASE}/me/`)
        .then((res) => {
          if (!res.ok) throw new Error("Token inválido");
          return res.json();
        })
        .then((me) => {
          setToken(savedToken);
          setUser(me);
          // Consultar flag must_change_password
          apiFetch(`${API_BASE}/user-profile/${me.id}/`)
            .then(res => res.ok ? res.json() : Promise.resolve({ must_change_password: false }))
            .then(profile => setMustChangePassword(!!profile.must_change_password))
            .catch(() => setMustChangePassword(false));
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
    setMustChangePassword(false);
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch { /* noop */ }
    navigate("/login");
  };

  // Cambiar contraseña y limpiar flag must_change_password
  const changePassword = async (oldPassword, newPassword) => {
    if (!user) throw new Error('No autenticado');
    const res = await apiFetch(`${API_BASE}/change-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
    if (!res.ok) {
      let msg = 'Error cambiando contraseña';
      try {
        const data = await res.json();
        msg = data.detail || msg;
      } catch {
        msg = await res.text();
      }
      throw new Error(msg || 'Error cambiando contraseña');
    }
    setMustChangePassword(false);
    return true;
  };

  return (
  <AuthContext.Provider value={{ user, token, login, logout, loading, mustChangePassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

