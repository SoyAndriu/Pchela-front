import { useCallback, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../config/productConfig';
import { getHeaders } from '../utils/productUtils';

// Hook para gestionar Empleados y sincronización con usuarios
export function useEmpleados() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  // Traer todos los empleados
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const res = await fetch(`${API_BASE}/empleados/`, { headers: getHeaders(), signal: controller.signal });
      if (!res.ok) throw new Error('Error buscando empleados');
      const data = await res.json();
      // Normalizar cada empleado para asegurar profile
      const normalized = (Array.isArray(data.results) ? data.results : data).map(emp => ({
        profile: emp.profile || {},
        email: emp.email || '',
        activo: emp.activo ?? true,
        id: emp.id,
        username: emp.username || '',
      }));
      setItems(normalized);
      return data;
    } catch (e) {
      if (e.name === 'AbortError') return [];
      setError('Error buscando empleados');
      return [];
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  }, []);

  // Crear empleado (y usuario asociado)
  const create = useCallback(async (payload) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/empleados/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error creando empleado');
      }
      const created = await res.json();
      const fullCreated = {
        profile: created.profile || {},
        email: created.email || '',
        activo: created.activo ?? true,
        id: created.id,
        username: created.username || '',
      };
      setItems(prev => [fullCreated, ...prev]);
      return fullCreated;
    } catch (e) {
      setError(e.message || 'Error creando empleado');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Editar empleado
  const update = useCallback(async (id, payload) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/empleados/${id}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Error actualizando empleado');
      }
      const updated = await res.json();
      const fullUpdated = {
        profile: updated.profile || {},
        email: updated.email || '',
        activo: updated.activo ?? true,
        id: updated.id,
        username: updated.username || '',
      };
      setItems(prev => prev.map(e => e.id === fullUpdated.id ? fullUpdated : e));
      return fullUpdated;
    } catch (e) {
      setError(e.message || 'Error actualizando empleado');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Inactivar empleado (soft delete)
  const remove = useCallback(async (id) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/empleados/${id}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ activo: false })
      });
      if (!res.ok) throw new Error('Error inactivando empleado');
      const updated = await res.json();
      setItems(prev => prev.map(e => e.id === id ? { ...e, activo: false } : e));
      return updated;
    } catch (e) {
      setError(e.message || 'Error inactivando empleado');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reactivar empleado
  const reactivate = useCallback(async (id) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/empleados/${id}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ activo: true })
      });
      if (!res.ok) throw new Error('Error reactivando empleado');
      const updated = await res.json();
      setItems(prev => prev.map(e => e.id === id ? { ...e, activo: true } : e));
      return updated;
    } catch (e) {
      setError(e.message || 'Error reactivando empleado');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener empleado por id
const getById = useCallback(async (id) => {
  // Antes: `/user-profile/${id}/` → MAL
  const res = await fetch(`${API_BASE}/empleados/${id}/`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Empleado no encontrado');
  return await res.json();
}, []);

  const state = useMemo(() => ({ items, loading, error }), [items, loading, error]);

  return { ...state, fetchAll, create, update, remove, reactivate, getById };
}

export default useEmpleados;
