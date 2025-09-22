import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Dashboard from "../../pages/Dashboard";
import Products from "../../pages/Products";

export default function DuenoLayout() {
  const [darkMode, setDarkMode] = useState(false);

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
        <header
          className={`shadow p-4 flex justify-between items-center ${
            darkMode ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          <h1 className="text-lg font-semibold">Panel de Control</h1>
          <div className="flex items-center gap-4">
            <div>Dueño • Empresa</div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1 rounded bg-gray-300 text-black hover:bg-gray-400"
            >
              {darkMode ? "🌞 Claro" : "🌙 Oscuro"}
            </button>
          </div>
        </header>

        <main className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard darkMode={darkMode} />} />
            <Route
              path="/productos"
              element={<Products darkMode={darkMode} />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
