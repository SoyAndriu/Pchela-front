import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ role, children }) {
  // Traemos el usuario y el estado de carga
  const { user, loading } = useAuth();
  

  // 1) Si está cargando la sesión, mostramos un mensaje y NO redirigimos todavía
  if (loading) {
    return <div className="p-6 text-center">Cargando sesión…</div>;
  }

  // 2) Si terminó de cargar y NO hay usuario -> a Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3) Si no se especificó role, cualquier usuario logueado puede pasar
  if (!role) {
    return children;
  }

  // 4) Normalizamos role a array
  const rolesAllowed = Array.isArray(role) ? role : [role];

  // 5) Si el rol coincide, lo dejamos pasar
  if (rolesAllowed.includes(user.role)) {
    return children;
  }

  // 6) Si el rol no coincide, redirigimos al home de su rol
  const homeByRole = {
    gerente: "/gerente/dashboard",
    empleado: "/empleado/dashboard",
    cajero: "/cajero/dashboard",
  };

  return <Navigate to={homeByRole[user.role] || "/login"} replace />;
}

