import React from "react";
import { NavLink } from "react-router-dom";

function ModoOscuro(isActive, darkMode) {

    if (isActive){
        return `font-semibold ${darkMode ? "bg-gray-700" : "bg-gray-200"}`;
    }
    return darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100";
}

export default function Sidebar({darkMode}) {

    return (
        <aside className={`w-64 shadow-md h-screen sticky top-0 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <div className="p-4 text-xl font-bold border-b">Pchéla system</div>
        <nav className="p-4 space-y-2">
            <NavLink
            to="/"
            end
            className={({ isActive }) =>
                "block p-2 rounded " +
                ModoOscuro(isActive, darkMode)
            }
            >
            Inicio
            </NavLink>
            <NavLink to="/productos" className={({ isActive }) =>
                "block p-2 rounded " +
                ModoOscuro(isActive, darkMode)
            }
            >
            Productos
            </NavLink>
            <NavLink to="/ventas" className={({ isActive }) =>
                "block p-2 rounded " +
                ModoOscuro(isActive, darkMode)
            }
            >
            Ventas
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) =>
                "block p-2 rounded " +
                ModoOscuro(isActive, darkMode)
            }
            >
            Clientes
            </NavLink>
            <NavLink to="/reportes" className={({ isActive }) =>
                "block p-2 rounded " +
                ModoOscuro(isActive, darkMode)
            }
            >
            Reportes
            </NavLink>
            <NavLink to="/config" className={({ isActive }) =>
                "block p-2 rounded " +
                ModoOscuro(isActive, darkMode)
            }
            >
            Configuración
            </NavLink>
        </nav>
        </aside>
    );
}
