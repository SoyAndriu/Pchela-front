import { useCallback } from "react";

// Cache de catálogo a nivel de módulo para todos los usos del hook
let __cajaCatalogCache = null;
import { API_BASE, DEBUG_CAJA } from "../config/productConfig";
import { getHeaders } from "../utils/productUtils";

// Hook utilitario para operar con Caja
export default function useCaja() {
  // Normalizadores a contrato de texto (Opción A)
  const normTipoMovimiento = (val, fallback) => {
    const s = String(val || fallback || "").trim().toUpperCase();
    if (!s) return undefined;
    const allowed = ["INGRESO", "EGRESO", "AJUSTE", "REVERSO"];
    return allowed.includes(s) ? s : undefined;
  };

  const normMedioPago = (val) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim().toUpperCase();
    if (["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CREDITO"].includes(s)) return s;
    // Alias comunes
    if (["CASH", "EF"].includes(s)) return "EFECTIVO";
    if (["CARD"].includes(s)) return "TARJETA";
    if (["TRANSFER", "TRANSF"].includes(s)) return "TRANSFERENCIA";
    if (["CRÉDITO", "CREDITO"].includes(s)) return "CREDITO";
    return undefined;
  };

  const getCatalog = useCallback(async () => {
    if (__cajaCatalogCache) return __cajaCatalogCache;
    try {
      const res = await fetch(`${API_BASE}/caja/catalogos/`, { headers: getHeaders() });
      if (!res.ok) throw new Error("catalogos no disponible");
      const data = await res.json();
      const movs = Array.isArray(data?.tipos_movimiento) ? data.tipos_movimiento : [];
      const pagos = Array.isArray(data?.tipos_pago) ? data.tipos_pago : [];

      const mapByUpperName = (arr) => {
        const m = new Map();
        arr.forEach((it) => {
          const id = it?.id;
          const name = (it?.nombre || it?.name || it?.display_name || it?.label || "").toString();
          if (id != null && name) {
            m.set(name.trim().toUpperCase(), Number(id));
            // Soportar variantes comunes
            if (name.normalize) {
              const nfd = name.normalize("NFD").replace(/\p{Diacritic}/gu, "");
              m.set(nfd.trim().toUpperCase(), Number(id));
            }
          }
        });
        return m;
      };

      __cajaCatalogCache = {
        movMap: mapByUpperName(movs),
        pagoMap: mapByUpperName(pagos),
      };
      return __cajaCatalogCache;
  } catch (err) {
      if (DEBUG_CAJA) console.warn("Fallo obteniendo catálogos de caja", err);
      __cajaCatalogCache = { movMap: new Map(), pagoMap: new Map() };
      return __cajaCatalogCache;
    }
  }, []);
  const getSesionAbierta = useCallback(async () => {
    const res = await fetch(`${API_BASE}/caja/sesion_abierta/`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      // Si el backend responde 404/500, degradamos a "sin sesión" para permitir abrir una nueva
      if (res.status === 404 || res.status >= 500) {
  try { if (DEBUG_CAJA) console.warn("Caja: sesion_abierta no disponible", res.status, await res.text()); } catch { /* ignore */ }
        return { open: false };
      }
      let msg = "Error obteniendo sesión de caja";
  try { const err = await res.json(); msg = err?.detail || err?.message || err?.error || msg; } catch { /* ignore parse error */ }
      throw new Error(`[${res.status}] ${msg}`);
    }
    return res.json();
  }, []);

  const abrirCaja = useCallback(async (opening_amount) => {
    const res = await fetch(`${API_BASE}/caja/abrir/`, {
      method: "POST",
      headers: getHeaders(),
      // Enviamos nombres alternativos por compatibilidad con el backend
      body: JSON.stringify({
        opening_amount: Number(opening_amount),
        monto_inicial: Number(opening_amount),
        monto_apertura: Number(opening_amount),
      }),
    });
    if (!res.ok) {
      let msg = "Error abriendo caja";
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const err = await res.json();
          msg = err?.detail || err?.message || err?.error || msg;
        }
  } catch { /* ignore parse error */ }

      // Mapeo de estados a mensajes amigables y evitar volcar HTML en UI
      const status = res.status;
      if (status === 400) msg = msg || "Datos inválidos para abrir caja";
      else if (status === 401) msg = "Sesión expirada. Iniciá sesión nuevamente";
      else if (status === 403) msg = "No tenés permisos para abrir caja";
      else if (status === 409) msg = "Ya tenés una caja abierta";
      else if (status >= 500) {
        // Logueamos el cuerpo para diagnóstico, pero no lo mostramos al usuario
  try { const text = await res.text(); if (text && DEBUG_CAJA) console.error("Caja abrir 5xx:", text.slice(0, 500)); } catch { /* ignore */ }
        msg = "Error del servidor al abrir la caja";
      }
      throw new Error(`[${status}] ${msg}`);
    }
    return res.json();
  }, []);

  const cerrarCaja = useCallback(async ({ counted_amount, notes }) => {
    const res = await fetch(`${API_BASE}/caja/cerrar/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ counted_amount: Number(counted_amount), notes }),
    });
    if (!res.ok) {
      let msg = "Error cerrando caja";
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const err = await res.json();
          msg = err?.detail || err?.message || err?.error || msg;
        }
  } catch { /* ignore parse error */ }
      const status = res.status;
      if (status === 400) msg = msg || "Datos inválidos para cerrar caja";
      else if (status === 401) msg = "Sesión expirada. Iniciá sesión nuevamente";
      else if (status === 403) msg = "No tenés permisos para cerrar caja";
      else if (status === 409) msg = "La caja ya está cerrada";
      else if (status >= 500) {
  try { const text = await res.text(); if (text && DEBUG_CAJA) console.error("Caja cerrar 5xx:", text.slice(0, 500)); } catch { /* ignore */ }
        msg = "Error del servidor al cerrar la caja";
      }
      throw new Error(`[${status}] ${msg}`);
    }
    return res.json();
  }, []);

  const getMovimientos = useCallback(async (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });
    const sep = qs.toString();
    const res = await fetch(`${API_BASE}/caja-movimientos/${sep ? `?${sep}` : ""}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      let msg = "Error listando movimientos";
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const err = await res.json();
          msg = err?.detail || err?.message || err?.error || msg;
        } else {
          const text = await res.text();
          if (DEBUG_CAJA && text) console.error("Caja getMovimientos:", text.slice(0, 500));
        }
  } catch { /* ignore parse error */ }
      throw new Error(`[${res.status}] ${msg}`);
    }
    return res.json();
  }, []);

  const crearMovimiento = useCallback(async (payload) => {
    // Normalización de payload para compatibilidad con el backend
    const norm = { ...payload };

    // 1) Asegurar ID de caja (el backend lo exige como PK en el campo `caja`)
    if (norm.caja === undefined || norm.caja === null) {
      try {
        const s = await (async () => {
          // Reutilizamos el propio getSesionAbierta del hook
          return await (await Promise.resolve(getSesionAbierta()))
        })();
        if (s?.open && s?.id) {
          norm.caja = s.id;
        } else {
          throw new Error("No hay una caja abierta para registrar el movimiento");
        }
      } catch {
        throw new Error("No fue posible determinar la caja abierta");
      }
    }

    // 2) Alinear a contrato de texto (Opción A): usar tipo_movimiento y medio_pago como strings
    if (!norm.tipo_movimiento) {
      const t = normTipoMovimiento(norm.tipo, norm.tipo_movimiento);
      if (t) norm.tipo_movimiento = t;
    } else {
      norm.tipo_movimiento = normTipoMovimiento(norm.tipo_movimiento) || norm.tipo_movimiento;
    }
    // Además, completar siempre el campo de modelo `tipo` (no nulo en BD)
    if (!norm.tipo && norm.tipo_movimiento) {
      norm.tipo = String(norm.tipo_movimiento).trim().toUpperCase();
    }
    const medio = norm.medio_pago ?? norm.tipo_pago ?? norm.medio ?? norm.id_tipo_pago;
    const medioTxt = normMedioPago(medio);
    if (medioTxt) norm.medio_pago = medioTxt;

    // 3) Obtener IDs reales del catálogo y enviarlos junto a los strings
      try {
      const { movMap, pagoMap } = await getCatalog();
      const movId = movMap?.get(String(norm.tipo_movimiento || "").trim().toUpperCase());
      const pagoId = pagoMap?.get(String(norm.medio_pago || "").trim().toUpperCase());
      if (movId != null) norm.id_tipo_movimiento = Number(movId);
      if (pagoId != null) norm.id_tipo_pago = Number(pagoId);
  } catch { /* ignore catalog mapping */ }

    // 4) Limpiar alias antiguos y, si ya tenemos IDs, quitar los strings para evitar errores en el serializer
  if (norm.id_tipo_movimiento != null) delete norm.tipo_movimiento;
    if (norm.id_tipo_pago != null) delete norm.medio_pago;
    delete norm.tipo_pago;
    delete norm.medio;
  // Nota: NO borramos `tipo` porque el backend lo requiere en el modelo

    const res = await fetch(`${API_BASE}/caja-movimientos/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(norm),
    });
    if (!res.ok) {
      let msg = "Error creando movimiento";
      const status = res.status;
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const err = await res.json();
          if (err?.detail || err?.message || err?.error) {
            msg = err.detail || err.message || err.error;
          } else {
            try { msg = JSON.stringify(err); } catch { /* ignore */ }
          }
        } else if (status >= 500) {
          // No mostramos HTML al usuario, solo lo registramos para diagnóstico
          try { const text = await res.text(); if (text && DEBUG_CAJA) console.error("Caja crearMovimiento 5xx:", text.slice(0, 800)); } catch { /* ignore */ }
          msg = "Error del servidor al crear el movimiento";
        } else {
          // Otros content-types no JSON
          try { const text = await res.text(); if (text) msg = text.slice(0, 200); } catch { /* ignore */ }
        }
  } catch { /* ignore */ }

      if (status === 400) msg = msg || "Datos inválidos del movimiento";
      else if (status === 401) msg = "Sesión expirada. Iniciá sesión nuevamente";
      else if (status === 403) msg = "No tenés permisos para registrar movimientos";
      else if (status >= 500) msg = msg || "Error del servidor al crear el movimiento";
      throw new Error(`[${status}] ${msg}`);
    }
    return res.json();
  }, [getSesionAbierta, getCatalog]);

  const reversarMovimiento = useCallback(async ({ movement_id, reason }) => {
    const res = await fetch(`${API_BASE}/caja-movimientos/reversar/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ movement_id, reason }),
    });
    if (!res.ok) {
      let msg = "Error revirtiendo movimiento";
      let extra = "";
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const err = await res.json();
          if (err?.detail || err?.message || err?.error) {
            msg = err.detail || err.message || err.error;
          } else {
            try { msg = JSON.stringify(err); } catch { /* ignore */ }
          }
        } else {
          const text = await res.text();
          extra = text ? `\n${text.slice(0, 300)}` : "";
        }
  } catch { /* ignore */ }
      throw new Error(`[${res.status}] ${msg}${extra}`);
    }
    return res.json();
  }, []);

  return {
    getSesionAbierta,
    abrirCaja,
    cerrarCaja,
    getMovimientos,
    crearMovimiento,
    reversarMovimiento,
  };
}
