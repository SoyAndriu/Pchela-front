import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // 🔑 Login real contra Django
  const login = async (username, password) => {
    try {
      // 1) Pedimos token
      const res = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Error en login");
      const data = await res.json();

      setToken(data.access);
      localStorage.setItem("token", data.access);

      // 2) Pedimos usuario actual
      const meRes = await fetch("http://127.0.0.1:8000/api/me/", {
        headers: { Authorization: `Bearer ${data.access}` },
      });

      if (!meRes.ok) throw new Error("Error obteniendo usuario");
      const me = await meRes.json();

      setUser(me);

      // 3) Redirigimos según rol
      if (me.role === "dueno") navigate("/dueno");
      else if (me.role === "empleado") navigate("/empleado");
      else if (me.role === "cajero") navigate("/cajero");
      else navigate("/login");
    } catch (error) {
      console.error(error);
      alert("Usuario o contraseña incorrectos");
    }
  };

  // 🔑 Restaurar sesión al refrescar
  useEffect(() => {
  const savedToken = localStorage.getItem("token");
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
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);  // 👈 marcamos que ya terminó la verificación
      });
  } else {
    setLoading(false);      // 👈 si no había token, tampoco nos quedamos cargando
  }
}, []);


  // 🔑 Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
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

