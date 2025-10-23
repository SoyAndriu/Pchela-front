import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientesInactivos from "./pages/ClientesInactivos";
import EmpleadosInactivos from "./pages/EmpleadosInactivos";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ToastProvider } from "./components/ToastProvider";
import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import GerenteLayout from "./fronts/gerente/GerenteLayout";
import EmpleadoLayout from "./fronts/empleado/EmpleadoLayout";
import CajeroLayout from "./fronts/cajero/CajeroLayout";
// import Usuarios eliminado
import ResetPassword from "./auth/ResetPassword";
import ForcePasswordChange from "./components/auth/ForcePasswordChange";


function AppContent() {
  const { mustChangePassword, changePassword, loading } = useAuth();
  // Puedes ajustar darkMode según tu lógica global
  const darkMode = false;
  if (loading) return null;
  if (mustChangePassword) {
    return <ForcePasswordChange darkMode={darkMode} onPasswordChanged={changePassword} />;
  }
  return (
    <Routes>
      {/* Redirección automática de '/' a '/login' */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Ruta pública del login */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
  {/* Página de clientes inactivos */}
  <Route path="/clientes-inactivos" element={<ProtectedRoute><ClientesInactivos darkMode={false} /></ProtectedRoute>} />
  {/* Página de empleados inactivos (solo en layout gerente, no aquí) */}
      {/* Rutas privadas según el rol */}
      <Route
        path="/gerente/*"
        element={
          <ProtectedRoute role="gerente">
            <GerenteLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empleado/*"
        element={
          <ProtectedRoute role="empleado">
            <EmpleadoLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cajero/*"
        element={
          <ProtectedRoute role={["cajero", "gerente", "empleado"]}>
            <CajeroLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


