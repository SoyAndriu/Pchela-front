import { useCallback, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

// Hook para gestionar Clientes: búsqueda, creación, actualización y obtención por id
export function useClientes() {
  // Traer todos los clientes sin filtro
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
  const res = await apiFetch(`${API_BASE}/clientes/`, { signal: controller.signal });
      if (!res.ok) {
        const err = new Error('Error buscando clientes');
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      const list = Array.isArray(data.results) ? data.results : data;
      setItems(list);
      return list;
    } catch (e) {
      if (e.name === 'AbortError') return [];
      setError('Error buscando clientes');
      return [];
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  }, []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);
  // Métricas de desarrollo
  const metricsRef = useRef({ uniqueChecks: 0, duplicatesDetected: 0 });

  // Búsqueda inteligente (nombre/email/dni) con soporte de filtros exactos
  const search = useCallback(async (term) => {
    if (!term || String(term).trim().length < 2) { setItems([]); return []; }
    const q = String(term).trim();
    const isEmail = q.includes('@');
    const isDni = /^[0-9]{6,}$/.test(q);
    const params = new URLSearchParams();
    if (isEmail) params.set('email', q.toLowerCase());
    if (isDni) params.set('dni', q);
    if (!isEmail && !isDni) params.set('search', q);
    // Flag para reintroducir ordering cuando backend esté estable
    // const ENABLE_ORDERING = false; // Cambiar a true cuando el backend soporte ordering sin errores
    // if (ENABLE_ORDERING && !isEmail && !isDni) {
    //   params.set('ordering', 'nombre_completo');
    // }

    setLoading(true); setError(null);
    try {
      // Cancelar búsqueda previa si existe
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
  const res = await apiFetch(`${API_BASE}/clientes/?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) {
        const err = new Error('Error buscando clientes');
        err.status = res.status;
        throw err;
      }
      const data = await res.json();
      const list = Array.isArray(data.results) ? data.results : data;
      setItems(list);
      return list;
    } catch (e) {
      if (e.name === 'AbortError') {
        // Búsqueda cancelada por una nueva; no alterar estado
        return [];
      }
      // Si el backend devuelve 5xx, mostramos un aviso suave inline
      if (e?.status && e.status >= 500) {
        console.error('[useClientes.search] backend 5xx en búsqueda');
        setError('No se pudo buscar clientes en este momento. Probá con email o DNI, o registrá nuevo.');
      } else {
        setError('Error buscando clientes');
      }
      return [];
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  }, []);

  const getById = useCallback(async (id) => {
  const res = await apiFetch(`${API_BASE}/clientes/${id}/`);
    if (!res.ok) throw new Error('Cliente no encontrado');
    return await res.json();
  }, []);

  // Nuevo endpoint de pre-validación de duplicados
  const uniqueCheck = useCallback(async ({ email, dni }) => {
    const params = new URLSearchParams();
    if (email) params.set('email', String(email).toLowerCase());
    if (dni) params.set('dni', String(dni));
  const res = await apiFetch(`${API_BASE}/clientes/unique-check/?${params.toString()}`);
    if (!res.ok) throw new Error('No se pudo validar unicidad');
    const data = await res.json();
    // Formato previsto extendido opcional (futuro): { email: { exists: bool, cliente: { ... } }, dni: { exists: bool, cliente: { ... } }}
    metricsRef.current.uniqueChecks += 1;
    const result = {
      email: { exists: !!data?.email?.exists, cliente: data?.email?.cliente || null },
      dni: { exists: !!data?.dni?.exists, cliente: data?.dni?.cliente || null }
    };
    if (result.email.exists || result.dni.exists) {
      metricsRef.current.duplicatesDetected += 1;
    }
    if (process.env.NODE_ENV !== 'production') {
      // Log compacto para seguimiento
      const { uniqueChecks, duplicatesDetected } = metricsRef.current;
      // Ratio aproximado
      const ratio = uniqueChecks ? (duplicatesDetected / uniqueChecks * 100).toFixed(1) : '0.0';
      console.debug(`[useClientes.metrics] uniqueCheck #${uniqueChecks} duplicados=${duplicatesDetected} (${ratio}%)`);
    }
    return result;
  }, []);

  // El backend (DRF) suele fallar si se envían strings vacíos en campos no requeridos.
  const sanitizePayload = (obj) => {
    const out = {};
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed === '') return; // omitimos strings vacíos
        out[k] = trimmed;
      } else {
        out[k] = v;
      }
    });
    return out;
  };

  const buildErrorMessage = async (res, fallbackMsg) => {
    try {
      const data = await res.json();
      if (!data) return fallbackMsg;
      if (typeof data === 'string') return data;
      if (data.detail || data.message) return data.detail || data.message;
      // DRF validation errors: { field: ["error1", "error2"], non_field_errors: [..] }
      const parts = [];
      Object.entries(data).forEach(([field, val]) => {
        const msgs = Array.isArray(val) ? val.join(', ') : String(val);
        parts.push(`${field}: ${msgs}`);
      });
      return parts.length ? parts.join(' | ') : fallbackMsg;
    } catch {
      try {
        const text = await res.text();
        return text || fallbackMsg;
      } catch {
        return fallbackMsg;
      }
    }
  };

  const create = useCallback(async (payload) => {
    const body = sanitizePayload(payload);
    if (body.email) body.email = String(body.email).toLowerCase();
    // Log de depuración del payload enviado
    if (process.env.NODE_ENV !== 'production') {
      // Evitar loguear datos sensibles si existieran
      console.debug('[useClientes.create] Payload:', { ...body, token: undefined });
    }
    const res = await apiFetch(`${API_BASE}/clientes/`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        try { const txt = await res.clone().text(); console.error('[useClientes.create] 400 body:', txt); } catch {}
      }
      const msg = await buildErrorMessage(res, 'Error creando cliente');
      throw new Error(msg);
    }
    const created = await res.json();
    // Opcional: agregar a items
    setItems((prev) => {
      const exists = prev.some(c => c.email === created.email || c.dni === created.dni);
      return exists ? prev : [created, ...prev];
    });
    return created;
  }, []);

  const update = useCallback(async (id, payload) => {
    const body = sanitizePayload(payload);
    if (body.email) body.email = String(body.email).toLowerCase();
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[useClientes.update] Payload:', { id, ...body, token: undefined });
    }
    const res = await apiFetch(`${API_BASE}/clientes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        try { const txt = await res.clone().text(); console.error('[useClientes.update] 400 body:', txt); } catch {}
      }
      const msg = await buildErrorMessage(res, 'Error actualizando cliente');
      throw new Error(msg);
    }
    const updated = await res.json();
    setItems(prev => prev.map(c => (c.usuario === id ? updated : c)));
    return updated;
  }, []);

  const state = useMemo(() => ({ items, loading, error }), [items, loading, error]);

  return { ...state, search, fetchAll, create, update, getById, uniqueCheck };
}

export default useClientes;
