import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * ProtectedRoute
 *  - Si NO hay usuario: redirige a /login
 *  - Si hay usuario y NO se pide rol: deja pasar
 *  - Si hay usuario y se pide rol:
 *      - Si coincide: deja pasar
 *      - Si NO coincide: redirige al "home" de su propio rol
 *
 * Props:
 *  - role: string | string[]   (rol o lista de roles permitidos)
 *  - children: ReactNode       (lo que debería renderizarse si pasa los checks)
 */
export default function ProtectedRoute({ role, children }) {
  // 1) Traemos el usuario actual desde el "portero"
  const { user } = useAuth();

  // 2) Si NO hay usuario -> a Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3) Si NO se especificó "role", cualquier usuario logueado puede pasar
  if (!role) {
    return children;
  }

  // 4) Normalizamos "role" a array para comparar fácil
  const rolesAllowed = Array.isArray(role) ? role : [role];

  // 5) Si el rol del usuario está permitido -> pasa
  if (rolesAllowed.includes(user.role)) {
    return children;
  }

  // 6) Si el rol NO coincide, lo mandamos al "home" de su propio rol
  const homeByRole = {
    dueno: "/dueno/dashboard",
    empleado: "/empleado/dashboard",
    cajero: "/cajero/dashboard",
  };

  return <Navigate to={homeByRole[user.role] || "/login"} replace />;
}
