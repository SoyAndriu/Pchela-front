import React from 'react'
import {
  SunIcon,
  MoonIcon,
  PowerIcon,
} from "@heroicons/react/24/solid";

export default function Header( {darkMode, setDarkMode, user, logout} ) {
  return (
    <header
          className={`shadow p-4 flex justify-between items-center ${
            darkMode ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          <h1 className="text-lg font-semibold">Panel de Control</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                darkMode 
                  ? "bg-gray-700 text-white hover:bg-gray-600" 
                  : "bg-pink-100 text-pink-700 hover:bg-pink-200"
              }`}
            >
              {darkMode ? (
                <>
                  <SunIcon className="h-4 w-4" />
                  Claro
                </>
              ) : (
                <>
                  <MoonIcon className="h-4 w-4" />
                  Oscuro
                </>
              )}
            </button>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Rol: <b className={darkMode ? "text-pink-300" : "text-pink-600"}>{user.role}</b>
                </span>
                <button
                  onClick={logout}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1 border transition-colors ${
                    darkMode 
                      ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-white" 
                      : "border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700"
                  }`}
                >
                  <PowerIcon className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-500">No logueado</span>
            )}
          </div>
          </div>
          
        </header>
  )
}
