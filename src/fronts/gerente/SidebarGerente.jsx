import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  ChevronRightIcon,
  HomeIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  UsersIcon,
  DocumentTextIcon,
  CogIcon,
  TruckIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";


function ModoOscuro(isActive, darkMode) {
  if (isActive) {
    // Restaurar color activo anterior en oscuro con acento rosa; en claro mantener acento rosa sutil
    return `font-semibold ${darkMode ? "bg-pink-700 text-pink-100" : "bg-pink-100 text-pink-700"}`;
  }
  return darkMode ? "hover:bg-gray-700" : "hover:bg-pink-50";
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
  <div className={`p-4 font-bold border-b flex items-center ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
        <img src="/images/logo.png" alt="Pchéla logo" className="h-10 w-10 mr-2" />
        <div>
          <h1 className={`text-xl ${darkMode ? "text-white" : "text-pink-600"}`}>Pchéla</h1>
          <p className="text-xs text-gray-500">Universal Beauty</p>
        </div>
      </div>

  <nav className="p-4 space-y-2 flex flex-col h-[calc(100%-72px)]">
        {/* Otras opciones principales */}
        <NavLink
          to="/gerente"
          end
          className={({ isActive }) =>
            "flex items-center gap-2 p-2 rounded transition-colors " + ModoOscuro(isActive, darkMode)
          }
        >
          <HomeIcon className="w-5 h-5" />
          Inicio
        </NavLink>
        <NavLink
          to="/gerente/productos"
          className={({ isActive }) =>
            "flex items-center gap-2 p-2 rounded transition-colors " + ModoOscuro(isActive, darkMode)
          }
        >
          <ShoppingBagIcon className="w-5 h-5" />
          Productos
        </NavLink>
          <NavLink
            to="/gerente/ventas"
            className={({ isActive }) =>
              "flex items-center gap-2 p-2 rounded transition-colors " + ModoOscuro(isActive, darkMode)
            }
          >
            <ChartBarIcon className="w-5 h-5" />
            Ventas
          </NavLink>

          <NavLink
            to="/gerente/compras"
            className={({ isActive }) =>
              "flex items-center gap-2 p-2 rounded transition-colors " + ModoOscuro(isActive, darkMode)
            }
          >
            <ShoppingCartIcon className="w-5 h-5" />
            Compras
          </NavLink>

          <NavLink
            to="/gerente/proveedores"
            className={({ isActive }) =>
              "flex items-center gap-2 p-2 rounded transition-colors " + ModoOscuro(isActive, darkMode)
            }
          >
            <TruckIcon className="w-5 h-5" />
            Proveedores
          </NavLink>
        <NavLink
          to="/gerente/clientes"
          className={({ isActive }) =>
            "flex items-center gap-2 p-2 rounded transition-colors " + ModoOscuro(isActive, darkMode)
          }
        >
          <UsersIcon className="w-5 h-5" />
          Clientes
        </NavLink>
        <NavLink
          to="/gerente/reportes"
          className={({ isActive }) =>
            "flex items-center gap-2 p-2 rounded transition-colors " + ModoOscuro(isActive, darkMode)
          }
        >
          <DocumentTextIcon className="w-5 h-5" />
          Reportes
        </NavLink>

  {/* Configuración con submenú */}
  <div>
          {/* Botón que abre/cierra */}
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className={`w-full text-left flex items-center gap-2 p-2 rounded font-semibold transition-colors ${
              darkMode
                ? "hover:bg-gray-700"
                : "hover:bg-pink-50"
            }`}
          >
            <CogIcon className="w-5 h-5" />
            <span className="flex-1 flex justify-between items-center">
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
                  "flex items-center gap-2 p-2 rounded text-sm transition-colors " + ModoOscuro(isActive, darkMode)
                }
              >
                <UsersIcon className="w-4 h-4" />
                Usuarios
              </NavLink>
              <NavLink
                to="/gerente/config/otros"
                className={({ isActive }) =>
                  "flex items-center gap-2 p-2 rounded text-sm transition-colors " + ModoOscuro(isActive, darkMode)
                }
              >
                <CogIcon className="w-4 h-4" />
                Otros ajustes
              </NavLink>
            </div>
          )}
        </div>
        {/* Spacer to push Caja button to bottom */}
        <div className="flex-1" />
        {/* Botón Caja al fondo del sidebar */}
        <NavLink
          to="/cajero"
          className={({ isActive }) =>
            "mt-2 flex items-center gap-2 p-2 rounded transition-colors " + ModoOscuro(isActive, darkMode)
          }
        >
          <BanknotesIcon className="w-5 h-5" />
          Caja
        </NavLink>
      </nav>
    </aside>
  );
}
