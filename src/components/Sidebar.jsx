import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md h-screen sticky top-0">
      <div className="p-4 text-xl font-bold border-b">Pchéla system</div>
      <nav className="p-4 space-y-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            "block p-2 rounded " +
            (isActive ? "bg-gray-200 font-semibold" : "hover:bg-gray-100")
          }
        >
          Inicio
        </NavLink>
        <NavLink
          to="/productos"
          className={({ isActive }) =>
            "block p-2 rounded " +
            (isActive ? "bg-gray-200 font-semibold" : "hover:bg-gray-100")
          }
        >
          Productos
        </NavLink>
        <NavLink to="/ventas" className="block p-2 rounded hover:bg-gray-100">
          Ventas
        </NavLink>
        <NavLink to="/clientes" className="block p-2 rounded hover:bg-gray-100">
          Clientes
        </NavLink>
        <NavLink to="/reportes" className="block p-2 rounded hover:bg-gray-100">
          Reportes
        </NavLink>
        <NavLink to="/config" className="block p-2 rounded hover:bg-gray-100">
          Configuración
        </NavLink>
      </nav>
    </aside>
  );
}
