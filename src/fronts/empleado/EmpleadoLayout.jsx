import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./SiderbarEmpleado";
import Dashboard from "../../pages/Dashboard";
import Products from "../../pages/Products";
import Ventas from "../../pages/Ventas";
import Compras from "../../pages/Compras";
import Proveedores from "../../pages/Proveedores";
import Reportes from "../../pages/Reportes";
import { useAuth } from "../../auth/AuthContext";
import Header from "../../components/Header";

export default function EmpleadoLayout() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-pink-25"
      }`}
    >
      {/* Sidebar siempre visible */}
      <Sidebar darkMode={darkMode} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra superior */}
        <Header darkMode={darkMode} setDarkMode={setDarkMode} user={user} logout={logout} />

        <main className="p-6">
          <Routes>
            <Route index element={<Dashboard darkMode={darkMode} />} />
            <Route path="productos" element={<Products darkMode={darkMode} />} />
            <Route path="ventas" element={<Ventas darkMode={darkMode} />} />
            <Route path="compras" element={<Compras darkMode={darkMode} />} />
            <Route path="proveedores" element={<Proveedores darkMode={darkMode} />} />
            <Route path="reportes" element={<Reportes darkMode={darkMode} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}