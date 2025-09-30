import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./SiderbarEmpleado";
import Dashboard from "../../pages/Dashboard";
import Products from "../../pages/Products";
import { useAuth } from "../../auth/AuthContext";
import Header from "../../components/Header";

export default function EmpleadoLayout() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? "bg-gray-600 text-white" : "bg-gray-100"
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
            <Route path="/" element={<Dashboard darkMode={darkMode} />} />
            <Route path="/productos" element={<Products darkMode={darkMode} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}