import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./SidebarGerente";
import Dashboard from "../../pages/Dashboard";
import Products from "../../pages/Products";
import Ventas from "../../pages/Ventas";
import Compras from "../../pages/Compras";
import ComprasHistorial from "../../pages/ComprasHistorial";
import Proveedores from "../../pages/Proveedores";
import Usuarios from "../../pages/Usuarios";
import Clientes from "../../pages/Clientes";
import Reportes from "../../pages/Reportes";
import ConfiguracionGeneral from "../../pages/ConfiguracionGeneral";
import ClientesInactivos from "../../pages/ClientesInactivos";
import { useAuth } from "../../auth/AuthContext";
import Header from "../../components/Header";

export default function GerenteLayout() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();

  // Restaurar preferencia darkMode
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ui.darkMode");
      if (saved !== null) setDarkMode(saved === "true");
    } catch { /* noop */ }
  }, []);

  // Guardar preferencia al cambiar
  useEffect(() => {
    try { localStorage.setItem("ui.darkMode", String(darkMode)); } catch { /* noop */ }
  }, [darkMode]);

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
            <Route path="compras/historial" element={<ComprasHistorial darkMode={darkMode} />} />
            <Route path="proveedores" element={<Proveedores darkMode={darkMode} />} />
            <Route path="clientes" element={<Clientes darkMode={darkMode} />} />
            <Route path="clientes-inactivos" element={<ClientesInactivos darkMode={darkMode} />} />
            <Route path="reportes" element={<Reportes darkMode={darkMode} />} />
            <Route path="config/usuarios" element={<Usuarios darkMode={darkMode} />} />
            <Route path="config/general" element={<ConfiguracionGeneral darkMode={darkMode} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}