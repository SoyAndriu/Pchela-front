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
              className="px-3 py-1 rounded bg-gray-300 text-black hover:bg-gray-400"
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Rol: <b>{user.role}</b>
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg px-3 py-1 border bg-gray-100 hover:bg-gray-200 transition-colors"
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
