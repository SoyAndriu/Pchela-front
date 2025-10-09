// HOOK PARA CRUD DE PROVEEDORES
import { useState, useCallback } from 'react';
const API_BASE = "http://127.0.0.1:8000/api";
const getHeaders = (isFormData = false) => {
  const headers = {
    'Authorization': `Bearer ${localStorage.getItem("token")}`,
  };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

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

  const createProveedor = useCallback(async (payload) => {
    const res = await fetch(`${API_BASE}/proveedores/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error creando proveedor');
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
    createProveedor,
    updateProveedor,
    deleteProveedor
  };
};

export default useProveedores;
