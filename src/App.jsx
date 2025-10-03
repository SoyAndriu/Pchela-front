import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
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
        <Routes>
          {/* Ruta pública del login */}
          <Route path="/" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
                    <ProtectedRoute role="cajero">
                    <CajeroLayout />
                    </ProtectedRoute>
                }
            />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


