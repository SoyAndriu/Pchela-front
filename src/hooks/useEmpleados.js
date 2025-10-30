import { useCallback, useMemo, useState } from 'react';
import { API_BASE } from '../config/productConfig';
import { getHeaders } from '../utils/productUtils';

// Hook para gestionar Empleados y sincronización con usuarios
export function useEmpleados() {
  // Verificar si existe un empleado con ese email (usando user__email)
  const existsEmpleadoEmail = useCallback(async (email) => {
    if (!email) return false;
    try {
      const res = await fetch(`${API_BASE}/empleados/?user__email=${encodeURIComponent(email)}`, { headers: getHeaders() });
      if (!res.ok) return false;
      const data = await res.json();
      if (Array.isArray(data.results)) {
        return data.results.length > 0 ? data.results[0] : false;
      } else if (Array.isArray(data)) {
        return data.length > 0 ? data[0] : false;
      }
      return false;
    } catch {
      return false;
    }
  }, []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Traer todos los empleados
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/empleados/`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error buscando empleados');
      const data = await res.json();
      setItems(Array.isArray(data.results) ? data.results : data);
      return data;
    } catch (e) {
      setError('Error buscando empleados');
      return [];
    } finally {
      setLoading(false);
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
      setItems(prev => [created, ...prev]);
      return created;
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
      // Después de actualizar, recargar la lista completa y devolver el actualizado real
      const all = await fetchAll();
      // Buscar el actualizado en la nueva lista (por id)
      let empleadoActualizado = null;
      if (Array.isArray(all.results)) {
        empleadoActualizado = all.results.find(e => e.id === updated.id);
      } else if (Array.isArray(all)) {
        empleadoActualizado = all.find(e => e.id === updated.id);
      }
      return empleadoActualizado || updated;
    } catch (e) {
      setError(e.message || 'Error actualizando empleado');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

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
    const res = await fetch(`${API_BASE}/empleados/${id}/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Empleado no encontrado');
    return await res.json();
  }, []);

  const state = useMemo(() => ({ items, loading, error }), [items, loading, error]);

  return { ...state, fetchAll, create, update, remove, reactivate, getById, existsEmpleadoEmail };
}

export default useEmpleados;
