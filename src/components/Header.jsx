import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { API_BASE } from "../config/productConfig";
import { apiFetch } from "../utils/productUtils";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import useSettings from "../hooks/useSettings";
import useCaja from "../hooks/useCaja";
import {
  SunIcon,
  MoonIcon,
  PowerIcon,
  UserIcon,
  BellIcon,
  WifiIcon,
} from "@heroicons/react/24/solid";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

export default function Header({ darkMode, setDarkMode, user, logout }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();
  const [online, setOnline] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const NOTIF_STORAGE_KEY = `ui.notificationsState:${user?.id || user?.username || 'anon'}`;
  const hashText = (s) => {
    try {
      let h = 0; const str = String(s || '');
      for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
      return String(h);
    } catch { return String(s?.length || 0); }
  };
  const loadSavedState = () => {
    try { const raw = localStorage.getItem(NOTIF_STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  };
  const persistSaved = (savedObj) => {
    try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(savedObj)); } catch { /* noop */ }
  };

  const { productos, fetchProducts } = useProducts();
  const { settings } = useSettings();
  const { getSesionAbierta } = useCaja();
  const [cajaOpen, setCajaOpen] = useState(null);

  // Generar notificaciones reales (stock bajo, estado de caja)
  const computeNotifications = useMemo(() => {
    const lowStockThreshold = Number(settings?.inventory?.lowStockThreshold ?? 10);
    const lowStock = (Array.isArray(productos) ? productos : []).filter(p => Number(p.cantidad ?? 0) <= lowStockThreshold);
    const notif = [];
    if (lowStock.length > 0) {
      const ids = lowStock.map(p => p.id).filter((v) => v != null).sort((a,b)=>String(a).localeCompare(String(b)));
      const preview = [...lowStock].sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''))).slice(0, 3).map(p => p.nombre).filter(Boolean).join(', ');
      notif.push({
        id: 'low-stock',
        text: `Stock bajo: ${lowStock.length} producto(s)${preview ? ` (${preview}...)` : ''}`,
        _hash: `low:${ids.join(',')}`,
        onClick: () => {
          navigate('/gerente/products?stock=bajo');
          setShowNotifications(false);
        }
      });
    }
    // Caja: notificar solo cuando está cerrada
    if (cajaOpen === false) {
      notif.push({
        id: 'caja-status',
        text: 'Caja cerrada',
        _hash: 'caja:closed',
        onClick: async () => {
          navigate('/cajero/caja');
          setShowNotifications(false);
        }
      });
    }
    return notif;
  }, [productos, settings, navigate, cajaOpen]);

  // Helper: fusionar notificaciones calculadas con estado persistido
  const mergeAndSetNotifications = useCallback(() => {
    try {
      const saved = loadSavedState();
      const savedNext = { ...saved };
      const computed = (computeNotifications || []).map(n => {
        const curHash = n._hash ? String(n._hash) : hashText(n.text);
        const s = saved[n.id];
        if (s && s.hash === curHash) {
          savedNext[n.id] = { read: !!s.read, dismissed: !!s.dismissed, hash: curHash };
          return { ...n, read: !!s.read, dismissed: !!s.dismissed, _hash: curHash };
        }
        savedNext[n.id] = { read: false, dismissed: false, hash: curHash };
        return { ...n, read: false, dismissed: false, _hash: curHash };
      });
      const visible = computed.filter(n => !n.dismissed);
      setNotifications(visible);
      persistSaved(savedNext);
    } catch {
      const saved = loadSavedState();
      const computed = (computeNotifications || []).map(n => ({ ...n, read: saved[n.id]?.read || false, dismissed: saved[n.id]?.dismissed || false, _hash: n._hash ? String(n._hash) : hashText(n.text) }));
      const visible = computed.filter(n => !n.dismissed);
      setNotifications(visible);
    }
  }, [computeNotifications]);

  // Sincronizar estado de caja y productos periódicamente (sin depender de objetos inestables)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Cargar productos si aún no hay datos
        if (!Array.isArray(productos) || productos.length === 0) {
          await fetchProducts?.();
        }
        // Chequear estado de caja (no bloqueante para UI)
        try {
          const s = await getSesionAbierta?.();
          if (!mounted) return;
          setCajaOpen(Boolean(s?.open));
        } catch {
          if (!mounted) return;
          setCajaOpen(null);
        }
      } finally {
        if (mounted) mergeAndSetNotifications();
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000); // cada 5 minutos
    return () => { mounted = false; clearInterval(id); };
  }, [fetchProducts, getSesionAbierta, mergeAndSetNotifications]);

  // Recalcular notificaciones cuando cambian los datos subyacentes, sin golpear backend
  useEffect(() => {
    mergeAndSetNotifications();
  }, [mergeAndSetNotifications]);

  const markRead = (id) => {
    const saved = loadSavedState();
    saved[id] = { ...(saved[id] || {}), read: true };
    persistSaved(saved);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const dismiss = (id) => {
    const saved = loadSavedState();
    // intentar conservar hash existente; si no existe, tomar el hash actual de la lista visible
    const cur = notifications.find(n => n.id === id);
    const curHash = cur?._hash || saved[id]?.hash || null;
    saved[id] = { read: true, dismissed: true, ...(curHash ? { hash: curHash } : {}) };
    persistSaved(saved);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const markAllRead = () => {
    const saved = loadSavedState();
    notifications.forEach(n => { saved[n.id] = { ...(saved[n.id] || {}), read: true, hash: n._hash || saved[n.id]?.hash || hashText(n.text) }; });
    persistSaved(saved);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Animación de transición de modo
  useEffect(() => {
    document.body.classList.toggle("transition-colors", true);
    document.body.classList.toggle("duration-500", true);
  }, [darkMode]);

  // Verificar conexión cada 60s
  useEffect(() => {
    const checkOnline = async () => {
      try {
        const res = await apiFetch(`${API_BASE}/ping/`);
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (typeof n.onClick === 'function') n.onClick();
                                  markRead(n.id);
                                }}
                                title={n.read ? "Leída" : "Marcar como leída"}
                                className="flex-1 cursor-pointer hover:underline"
                              >
                                {n.text}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                                className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 hover:bg-pink-100 text-gray-500"
                                title="Eliminar notificación"
                              >
                                ×
                              </button>
                            </li>
                          ))
                        )}
                        {notifications.length > 0 && (
                          <li className="p-2 flex justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                            >
                              Marcar todas como leídas
                            </button>
                          </li>
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
