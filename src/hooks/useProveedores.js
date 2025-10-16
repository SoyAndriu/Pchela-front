// HOOK PARA CRUD DE PROVEEDORES
import { useState, useCallback } from 'react';
import { API_BASE } from '../config/productConfig';
import { getHeaders } from '../utils/productUtils';

const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProveedores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/proveedores/`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error cargando proveedores');
      const data = await res.json();
      setProveedores(data.results || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Normalizadores
  const normCuil = (v) => (v == null ? '' : String(v)).replace(/\D/g, '');
  const normName = (v) => (v == null ? '' : String(v)).trim().toUpperCase().replace(/\s+/g, ' ');
  const normEmail = (v) => (v == null ? '' : String(v)).trim().toLowerCase();

  // Prechequeo: intenta contra el backend y, si no se puede, usa los cargados en memoria
  const existsProveedor = useCallback(async ({ cuil, nombre, email } = {}) => {
    const cuilNorm = normCuil(cuil);
    const nameNorm = normName(nombre);
    const emailNorm = normEmail(email);

    // 1) Chequeo local rápido si ya hay datos en memoria
    if (Array.isArray(proveedores) && proveedores.length) {
      const foundLocal = proveedores.find((p) => {
        const pCuil = normCuil(p?.cuil);
        const pName = normName(p?.nombre);
        const pEmail = normEmail(p?.email);
        return (cuilNorm && pCuil && pCuil === cuilNorm)
          || (nameNorm && pName && pName === nameNorm)
          || (emailNorm && pEmail && pEmail === emailNorm);
      });
      if (foundLocal) return foundLocal;
    }

    // 2) Intentar por cuil exacto si viene
    if (cuilNorm) {
      try {
        const res = await fetch(`${API_BASE}/proveedores/?cuil=${encodeURIComponent(cuilNorm)}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          const match = list.find((p) => normCuil(p?.cuil) === cuilNorm);
          if (match) return match;
        }
      } catch { /* ignore network error */ }
    }

    // 3) Intentar por nombre exacto (si API lo soporta)
    if (nameNorm) {
      try {
        const res = await fetch(`${API_BASE}/proveedores/?nombre=${encodeURIComponent(nombre)}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          const match = list.find((p) => normName(p?.nombre) === nameNorm);
          if (match) return match;
        }
      } catch { /* ignore network error */ }
      try {
        const res = await fetch(`${API_BASE}/proveedores/?search=${encodeURIComponent(nombre)}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          const match = list.find((p) => normName(p?.nombre) === nameNorm || normCuil(p?.cuil) === cuilNorm);
          if (match) return match;
        }
      } catch { /* ignore network error */ }
    }

    // 4) Intentar por email exacto
    if (emailNorm) {
      try {
        const res = await fetch(`${API_BASE}/proveedores/?email=${encodeURIComponent(emailNorm)}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
          const match = list.find((p) => normEmail(p?.email) === emailNorm);
          if (match) return match;
        }
      } catch { /* ignore network error */ }
    }

    return null;
  }, [proveedores]);

  const createProveedor = useCallback(async (payload) => {
    const res = await fetch(`${API_BASE}/proveedores/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let message = 'Error creando proveedor';
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const err = await res.json();
          // Mapeo común de errores del serializer
          const fieldErrors = [];
          if (err?.detail || err?.message || err?.error) {
            message = err.detail || err.message || err.error;
          }
          // Buscar errores de campo
          ['nombre','cuil','email','localidad'].forEach((f) => {
            if (Array.isArray(err?.[f]) && err[f].length) {
              fieldErrors.push(`${f}: ${err[f][0]}`);
            }
          });
          if (fieldErrors.length && (!err.detail && !err.message)) {
            message = fieldErrors.join(' | ');
          }
          // Caso de duplicado
          if (res.status === 409 || /existe|duplicad/i.test(JSON.stringify(err))) {
            const val = payload?.cuil || payload?.nombre;
            message = `El proveedor ya existe${val ? ` (${val})` : ''}`;
          }
        } else {
          const text = await res.text();
          if (text) message = text.slice(0, 200);
        }
  } catch { /* ignore parse/text */ }
      throw new Error(`[${res.status}] ${message}`);
    }
    const nuevo = await res.json();
    setProveedores(prev => [...prev, nuevo]);
    return nuevo;
  }, []);

  const updateProveedor = useCallback(async (id, payload) => {
    const res = await fetch(`${API_BASE}/proveedores/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error actualizando proveedor');
    const updated = await res.json();
    setProveedores(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  }, []);

  const deleteProveedor = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/proveedores/${id}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Error eliminando proveedor');
    setProveedores(prev => prev.filter(p => p.id !== id));
    return true;
  }, []);

  return {
    proveedores,
    loading,
    error,
    fetchProveedores,
    existsProveedor,
    createProveedor,
    updateProveedor,
    deleteProveedor
  };
};

export default useProveedores;
