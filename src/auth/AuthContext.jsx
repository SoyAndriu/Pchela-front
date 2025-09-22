import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// 1. Creamos el contexto (la mochila compartida)
const AuthContext = createContext();

// 2. Proveedor que envuelve a toda la app
export function AuthProvider({ children }) {
  // Estado del usuario: null al inicio
  const [user, setUser] = useState(null);

  // Hook para navegar (redirigir después del login)
  const navigate = useNavigate();

  // 3. Función login SIMULADA
  const login = (username, password) => {
    let role = null;

    // Según lo que escriba el usuario, le damos un rol
    if (username === "dueno") role = "dueno";
    else if (username === "empleado") role = "empleado";
    else if (username === "cajero") role = "cajero";

    if (role) {
      // Guardamos al usuario en el estado
      const newUser = { name: username, role };
      setUser(newUser);

      // Redirigimos según el rol
      if (role === "dueno") navigate("/dueno/dashboard");
      if (role === "empleado") navigate("/empleado/dashboard");
      if (role === "cajero") navigate("/cajero/dashboard");
    } else {
      alert("Usuario no válido (usa dueno, empleado o cajero)");
    }
  };

  // 4. Función logout
  const logout = () => {
    setUser(null);
    navigate("/login"); // lo mandamos al login
  };

  // 5. Valor que compartirán todos los componentes
  const value = { user, login, logout };

  // 6. Retornamos el provider con el valor
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 7. Hook personalizado para usar el contexto fácilmente
export function useAuth() {
  return useContext(AuthContext);
}
