import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // guardamos el token
  const navigate = useNavigate();

  // ✅ Función login real
  const login = async (username, password) => {
    try {
      // 1) Pedir el token al backend
      const res = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Error en login");
      const data = await res.json();

      // 2) Guardar token en memoria y localStorage
      setToken(data.access); // suponemos que el backend devuelve { access: "..." }
      localStorage.setItem("token", data.access);

      // 3) Pedir datos del usuario con el token
      const meRes = await fetch("http://localhost:8000/api/auth/me/", {
        headers: { Authorization: `Bearer ${data.access}` },
      });

      if (!meRes.ok) throw new Error("Error obteniendo usuario");
      const me = await meRes.json();

      // 4) Guardar usuario (con rol incluido)
      setUser(me);

      // 5) Redirigir según rol
      if (me.role === "dueno") navigate("/dueno");
      else if (me.role === "empleado") navigate("/empleado");
      else if (me.role === "cajero") navigate("/cajero");
      else navigate("/login");
    } catch (error) {
      console.error("Error en login:", error);
      alert("Usuario o contraseña incorrectos");
    }
  };

  // ✅ Cargar usuario al refrescar la página
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken && !user) {
      fetch("http://localhost:8000/api/auth/me/", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then((me) => {
          setToken(savedToken);
          setUser(me);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        });
    }
  }, [user]);

  // ✅ Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
