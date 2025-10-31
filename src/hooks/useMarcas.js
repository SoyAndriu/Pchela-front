// HOOK PARA CRUD DE MARCAS
import { useState, useCallback } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

const useMarcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Normaliza el objeto marca del backend al shape del frontend
  const normalizeMarca = (m) => ({
    ...m,
    nombre: m?.nombre ?? m?.nombre_marca ?? m?.name ?? '',
  });

  const extractErrorMessage = (errObj) => {
    if (!errObj) return null;
    if (typeof errObj === 'string') return errObj;
    if (errObj.detail) return errObj.detail;
    try {
      const parts = Object.entries(errObj)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`);
      return parts.join(' | ');
    } catch {
      return null;
    }
  };

  const fetchMarcas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
  const res = await apiFetch(`${API_BASE}/marcas/`);
      if (!res.ok) throw new Error('Error cargando marcas');
      const data = await res.json();
      const items = data.results || data;
      setMarcas(Array.isArray(items) ? items.map(normalizeMarca) : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMarca = useCallback(async (payload) => {
    const backendPayload = {
      nombre_marca: (payload?.nombre ?? payload?.nombre_marca ?? '').trim(),
      notas: payload?.notas ?? '',
    };
    const res = await apiFetch(`${API_BASE}/marcas/`, { method: 'POST', body: JSON.stringify(backendPayload) });
      if (!res.ok) {
      let msg = 'Error creando marca';
      try {
        const err = await res.json();
        msg = extractErrorMessage(err) || msg;
      } catch { /* ignore parse error */ }
      throw new Error(msg);
    }
    const nueva = await res.json();
    const normalized = normalizeMarca(nueva);
    setMarcas(prev => [...prev, normalized]);
    return normalized;
  }, []);

  const updateMarca = useCallback(async (id, payload) => {
    const backendPayload = {};
    if (payload?.nombre !== undefined || payload?.nombre_marca !== undefined) {
      backendPayload.nombre_marca = (payload?.nombre ?? payload?.nombre_marca ?? '').trim();
    }
    if (payload?.notas !== undefined) backendPayload.notas = payload.notas;

    const res = await apiFetch(`${API_BASE}/marcas/${id}/`, { method: 'PATCH', body: JSON.stringify(backendPayload) });
      if (!res.ok) {
      let msg = 'Error actualizando marca';
      try {
        const err = await res.json();
        msg = extractErrorMessage(err) || msg;
  } catch { /* ignore parse error */ }
      throw new Error(msg);
    }
    const updated = await res.json();
    const normalized = normalizeMarca(updated);
    setMarcas(prev => prev.map(m => m.id === id ? normalized : m));
    return normalized;
  }, []);

  const deleteMarca = useCallback(async (id) => {
    const res = await apiFetch(`${API_BASE}/marcas/${id}/`, { method: 'DELETE' });
      if (!res.ok) {
      let msg = 'Error eliminando marca';
      try {
        const err = await res.json();
        msg = extractErrorMessage(err) || msg;
  } catch { /* ignore parse error */ }
      throw new Error(msg);
    }
    setMarcas(prev => prev.filter(m => m.id !== id));
    return true;
  }, []);

  return {
    marcas,
    loading,
    error,
    fetchMarcas,
    createMarca,
    updateMarca,
    deleteMarca
  };
};

export default useMarcas;
