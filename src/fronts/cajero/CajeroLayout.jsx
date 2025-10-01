import { NavLink, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import OrdersList from "./OrdersList";
import PaymentForm from "./PaymentForm";
import SalesHistory from "./SalesHistory";
import {
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ChartBarIcon,
  SunIcon,
  MoonIcon,
  PowerIcon,
} from "@heroicons/react/24/outline";

export default function CajeroLayout() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-gray-900 text-white" : "bg-pink-25"}`}>
      {/* Sidebar */}
      <aside className={`w-64 ${darkMode ? "bg-gray-800" : "bg-pink-600"} text-white flex flex-col`}>
        <h2 className={`text-2xl font-bold p-4 border-b ${darkMode ? "border-gray-700" : "border-pink-500"}`}>
          Cajero
        </h2>
        <nav className="flex flex-col p-4 gap-2">
          <NavLink 
            to="/cajero/" 
            end
            className={({ isActive }) => 
              `flex items-center gap-2 p-2 rounded transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-gray-700"
              }`
            }
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            Pedidos
          </NavLink>
          <NavLink 
            to="/cajero/payment"
            className={({ isActive }) => 
              `flex items-center gap-2 p-2 rounded transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-gray-700"
              }`
            }
          >
            <CreditCardIcon className="h-5 w-5" />
            Cobro
          </NavLink>
          <NavLink 
            to="/cajero/history"
            className={({ isActive }) => 
              `flex items-center gap-2 p-2 rounded transition-colors ${
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-gray-700"
              }`
            }
          >
            <ChartBarIcon className="h-5 w-5" />
            Historial
          </NavLink>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`shadow p-4 flex justify-between items-center ${
          darkMode ? "bg-gray-800 text-white" : "bg-white"
        }`}>
          <h1 className="text-lg font-semibold">Panel de Cajero</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-2 px-3 py-1 rounded bg-gray-300 text-black hover:bg-gray-400 transition-colors"
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
                  <span className="text-sm text-gray-600">
                    Rol: <b>{user.role}</b>
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 rounded-lg px-3 py-1 border bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <PowerIcon className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500">No logueado</span>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<OrdersList darkMode={darkMode} />} />
            <Route path="/payment" element={<PaymentForm darkMode={darkMode} />} />
            <Route path="/history" element={<SalesHistory darkMode={darkMode} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}