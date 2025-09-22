import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import DuenoLayout from "./fronts/dueno/DuenoLayout";
import EmpleadoLayout from "./fronts/empleado/EmpleadoLayout";
import CajeroLayout from "./fronts/cajero/CajeroLayout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública del login */}
          <Route path="/login" element={<Login />} />
            {/* Rutas privadas según el rol */}
            <Route
                path="/dueno/*"
                element={
                    <ProtectedRoute role="dueno">
                    <DuenoLayout />
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


