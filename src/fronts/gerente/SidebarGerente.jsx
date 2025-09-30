import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/solid";


function ModoOscuro(isActive, darkMode) {
  if (isActive) {
    return `font-semibold ${darkMode ? "bg-gray-700" : "bg-gray-200"}`;
  }
  return darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100";
}

export default function Sidebar({ darkMode }) {
  // Estado para abrir/cerrar el submenú de Configuración
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <aside
      className={`w-64 shadow-md h-screen sticky top-0 ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}
    >
      <div className="p-4 font-bold border-b flex items-center">
        <img src="/images/logo.png" alt="Pchéla logo" className="h-8 mr-2" />
        <h1 className="text-xl">Pchéla system</h1>
      </div>

      <nav className="p-4 space-y-2">
        {/* Otras opciones principales */}
        <NavLink
          to="/gerente"
          end
          className={({ isActive }) =>
            "block p-2 rounded " + ModoOscuro(isActive, darkMode)
          }
        >
          Inicio
        </NavLink>
        <NavLink
          to="/gerente/productos"
          className={({ isActive }) =>
            "block p-2 rounded " + ModoOscuro(isActive, darkMode)
          }
        >
          Productos
        </NavLink>
        <NavLink
          to="/gerente/ventas"
          className={({ isActive }) =>
            "block p-2 rounded " + ModoOscuro(isActive, darkMode)
          }
        >
          Ventas
        </NavLink>
        <NavLink
          to="/gerente/clientes"
          className={({ isActive }) =>
            "block p-2 rounded " + ModoOscuro(isActive, darkMode)
          }
        >
          Clientes
        </NavLink>
        <NavLink
          to="/gerente/reportes"
          className={({ isActive }) =>
            "block p-2 rounded " + ModoOscuro(isActive, darkMode)
          }
        >
          Reportes
        </NavLink>

        {/* Configuración con submenú */}
        <div>
          {/* Botón que abre/cierra */}
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className={`w-full text-left block p-2 rounded font-semibold ${
              darkMode
                ? "hover:bg-gray-700"
                : "hover:bg-gray-100"
            }`}
          >
            <span className="flex justify-between items-center">
                <span>Configuración</span>
                <ChevronRightIcon
                    className={`h-4 w-4 transition-transform duration-300 ${
                    configOpen ? "rotate-90" : ""
                    }`}
                />
            </span>
          </button>

          {/* Subopciones visibles solo si está abierto */}
          {configOpen && (
            <div className={`ml-4 overflow-hidden transition-all duration-300 ${configOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
              <NavLink
                to="/gerente/config/usuarios"
                className={({ isActive }) =>
                  "block p-2 rounded text-sm " + ModoOscuro(isActive, darkMode)
                }
              >
                Usuarios
              </NavLink>
              <NavLink
                to="/gerente/config/otros"
                className={({ isActive }) =>
                  "block p-2 rounded text-sm " + ModoOscuro(isActive, darkMode)
                }
              >
                Otros ajustes
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
