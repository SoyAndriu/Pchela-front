import React, { useRef, useState, useEffect } from "react";
import { API_BASE } from "../config/productConfig";
import {
  SunIcon,
  MoonIcon,
  PowerIcon,
  UserIcon,
  BellIcon,
  WifiIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

export default function Header({ darkMode, setDarkMode, user, logout }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();
  const [online, setOnline] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nuevo pedido recibido", read: false },
    { id: 2, text: "Stock bajo en productos", read: false },
    { id: 3, text: "Proveedor actualizado", read: true },
  ]);

  // Animación de transición de modo
  useEffect(() => {
    document.body.classList.toggle("transition-colors", true);
    document.body.classList.toggle("duration-500", true);
  }, [darkMode]);

  // Verificar conexión cada 60s
  useEffect(() => {
    const checkOnline = async () => {
      try {
        const res = await fetch(`${API_BASE}/ping/`);
        setOnline(res.ok);
      } catch {
        setOnline(false);
      }
    };
    checkOnline();
    const interval = setInterval(checkOnline, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  return (
    <header
      className={`shadow p-4 flex justify-between items-center ${
        darkMode ? "bg-gray-800 text-white" : "bg-white"
      } transition-colors duration-500`}
    >
      <h1 className="text-lg font-semibold">Sistema de Gestión</h1>

      <div className="flex items-center gap-4">
        {/* Estado conexión */}
        <span
          className={`flex items-center justify-center h-8 w-8 rounded-lg shadow-sm border font-medium transition-colors
            ${
              online
                ? "bg-white border-gray-300 text-green-500"
                : "bg-gray-100 border-gray-300 text-red-500"
            }`}
          title={online ? "Conexión activa" : "Sin conexión"}
        >
          <WifiIcon className="h-5 w-5" />
        </span>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Tarjeta usuario */}
              <span
                className={`flex items-center gap-2 text-sm px-3 py-1 rounded-lg shadow-sm border font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-pink-200"
                    : "bg-pink-50 border-pink-200 text-pink-700"
                }`}
              >
                <UserIcon className="h-4 w-4 mr-1" />
                <span className="text-gray-700 font-semibold">Gerente:</span>
                <b
                  className={
                    darkMode ? "text-pink-300" : "text-pink-600"
                  }
                >
                  {user?.name || user?.username || ""}
                </b>
              </span>

              {/* Campana de notificaciones */}
              <div className="relative" ref={notifRef}>
                <button
                  className={`relative flex items-center gap-2 px-3 py-1 rounded-lg border-2 shadow-sm transition-all duration-200
                    ${
                      notifications.filter((n) => !n.read).length === 0
                        ? darkMode
                          ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-400"
                          : "border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-400"
                        : darkMode
                        ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-pink-200"
                        : "border-pink-400 bg-pink-50 hover:bg-pink-100 text-pink-600"
                    }`}
                  title="Notificaciones"
                  onClick={() => setShowNotifications((v) => !v)}
                >
                  <BellIcon
                    className={`h-5 w-5 ${
                      notifications.filter((n) => !n.read).length === 0
                        ? "text-gray-400"
                        : ""
                    }`}
                  />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 bg-pink-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Menú de notificaciones animado */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-50 text-sm border ${
                        darkMode
                          ? "bg-gray-800 text-white border-gray-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="p-3 font-bold border-b border-gray-100">
                        Notificaciones
                      </div>
                      <ul>
                        {notifications.length === 0 ? (
                          <li className="p-3 text-gray-400">
                            Sin notificaciones
                          </li>
                        ) : (
                          notifications.map((n) => (
                            <li
                              key={n.id}
                              className={`flex justify-between items-center p-3 border-b last:border-b-0 cursor-pointer gap-2 ${
                                n.read
                                  ? "text-gray-400"
                                  : "text-pink-600 font-semibold"
                              }`}
                            >
                              <span
                                onClick={() =>
                                  setNotifications((prev) =>
                                    prev.map((notif) =>
                                      notif.id === n.id
                                        ? { ...notif, read: true }
                                        : notif
                                    )
                                  )
                                }
                                title={n.read ? "Leída" : "Marcar como leída"}
                                className="flex-1 cursor-pointer hover:underline"
                              >
                                {n.text}
                              </span>
                              <button
                                onClick={() =>
                                  setNotifications((prev) =>
                                    prev.filter((notif) => notif.id !== n.id)
                                  )
                                }
                                className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 hover:bg-pink-100 text-gray-500"
                                title="Eliminar notificación"
                              >
                                ×
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botón modo oscuro */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg border-2 shadow-sm transition-all duration-200 bg-white text-gray-900 border-black hover:bg-gray-100"
              >
                {darkMode ? (
                  <>
                    <SunIcon className="h-4 w-4" /> Claro
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-4 w-4" /> Oscuro
                  </>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className={`flex items-center gap-2 rounded-lg px-3 py-1 border-2 shadow-sm transition-all duration-200 ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-white"
                    : "border-pink-400 bg-pink-50 hover:bg-pink-100 text-pink-700"
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
  );
}
