import { NavLink, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import OrdersList from "./OrdersList";
import PaymentForm from "./PaymentForm";
import SalesHistory from "./SalesHistory";
import Caja from "./Caja";
import {
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ChartBarIcon,
  BanknotesIcon,
  SunIcon,
  MoonIcon,
  PowerIcon,
} from "@heroicons/react/24/outline";
import CajaGuard from "../../components/CajaGuard";
import CajaStatusBadge from "../../components/CajaStatusBadge";

export default function CajeroLayout() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ui.darkMode");
      if (saved !== null) setDarkMode(saved === "true");
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("ui.darkMode", String(darkMode)); } catch { /* noop */ }
  }, [darkMode]);

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-gray-900 text-white" : "bg-pink-25"}`}>
      {/* Sidebar */}
      <aside className={`w-64 ${darkMode ? "bg-gray-800" : "bg-pink-600"} text-white flex flex-col`}>
        <h2 className={`text-2xl font-bold p-4 border-b ${darkMode ? "border-gray-700" : "border-pink-500"}`}>
          Cajero
        </h2>
        <nav className="flex flex-col p-4 gap-2 flex-1">
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
          <NavLink 
            to="/cajero/caja"
            className={({ isActive }) => 
              `flex items-center gap-1 p-3 h-12 rounded-lg text-lg shadow-md border transition-colors ${
                darkMode ? "border-gray-600" : "border-gray-300"
              } ${
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-gray-700"
              }`
            }
          >
            <BanknotesIcon className="h-6 w-6 mr-2" />
            <span className="font-semibold">Caja</span>
            <span className="flex-1" />
            <CajaStatusBadge compact darkMode={darkMode} className="ml-4" />
          </NavLink>
          {/* Empuja el botón Volver al fondo */}
          <div className="flex-1" />
          {/* Botón Volver sólo visible para gerente o empleado */}
          {(user?.role === "gerente" || user?.role === "empleado") && (
            <button
              onClick={() => navigate(user.role === "gerente" ? "/gerente" : "/empleado")}
              className="mt-2 flex items-center gap-2 p-2 rounded transition-colors bg-white/10 hover:bg-white/20"
            >
              ⟵ Volver
            </button>
          )}
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

        {/* Main content con guardia de Caja */}
        <CajaGuard
          darkMode={darkMode}
          allowedWhenClosed={["/cajero/caja", "/cajero/history"]}
        >
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<OrdersList darkMode={darkMode} />} />
              <Route path="/payment" element={<PaymentForm darkMode={darkMode} />} />
              <Route path="/history" element={<SalesHistory darkMode={darkMode} />} />
              <Route path="/caja" element={<Caja darkMode={darkMode} />} />
            </Routes>
          </main>
        </CajaGuard>
      </div>
    </div>
  );
}