import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({darkMode}) {
  const hoverClass = darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100";

  return (
    <aside className={`w-64 shadow-md h-screen sticky top-0 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
      <div className="p-4 text-xl font-bold border-b">Pchéla system</div>
      <nav className="p-4 space-y-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            "block p-2 rounded " +
            (isActive ? `font-semibold ${darkMode ? "bg-gray-700" : "bg-gray-200"}` : hoverClass)
          }
        >
          Inicio
        </NavLink>
        <NavLink
          to="/productos"
          className={({ isActive }) =>
            "block p-2 rounded " +
            (isActive ? `font-semibold ${darkMode ? "bg-gray-700" : "bg-gray-200"}` : hoverClass)
          }
        >
          Productos
        </NavLink>
        <NavLink
          to="/ventas"
          className={`block p-2 rounded ${hoverClass}`}
        >
          Ventas
        </NavLink>
        <NavLink to="/clientes" className={`block p-2 rounded ${hoverClass}`}>
          Clientes
        </NavLink>
        <NavLink to="/reportes" className={`block p-2 rounded ${hoverClass}`}>
          Reportes
        </NavLink>
        <NavLink to="/config" className={`block p-2 rounded ${hoverClass}`}>
          Configuración
        </NavLink>
      </nav>
    </aside>
  );
}
