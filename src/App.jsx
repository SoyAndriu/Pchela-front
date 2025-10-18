import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientesInactivos from "./pages/ClientesInactivos";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./components/ToastProvider";
import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import GerenteLayout from "./fronts/gerente/GerenteLayout";
import EmpleadoLayout from "./fronts/empleado/EmpleadoLayout";
import CajeroLayout from "./fronts/cajero/CajeroLayout";
import Usuarios from "./pages/Usuarios";
import ResetPassword from "./auth/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
         <Routes>
          {/* Ruta pública del login */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Página de clientes inactivos */}
          <Route path="/clientes-inactivos" element={<ProtectedRoute><ClientesInactivos darkMode={false} /></ProtectedRoute>} />
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
        </ToastProvider>
       </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


