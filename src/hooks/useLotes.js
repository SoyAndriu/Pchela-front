// HOOK PARA MANEJAR LOTES (INGRESOS DE STOCK)
// Este hook asume endpoints backend:
// GET    /api/lotes/?producto=<id>
// POST   /api/lotes/
// PATCH  /api/lotes/:id/
// DELETE /api/lotes/:id/

import { useState, useCallback } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

// Calcula el costo unitario final en base a descuento (si backend no lo provee)
const computeFinalUnitCost = (lote) => {
  const base = Number(lote.costo_unitario || 0);
  if (!lote.descuento_tipo || !lote.descuento_valor) return base;
  const val = Number(lote.descuento_valor);
  if (lote.descuento_tipo === 'porc') {
    return base * (1 - val / 100);
  }
  if (lote.descuento_tipo === 'valor') {
    // descuento_valor total (asumido) distribuido por cantidad inicial si existe
    const qty = Number(lote.cantidad_inicial || 1);
    return base - (val / qty);
  }
  return base;
};

export const useLotes = () => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLotes = useCallback(async (productoId) => {
    if (!productoId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`${API_BASE}/lotes/?producto=${productoId}`);
      if (!res.ok) throw new Error('Error cargando lotes');
      const data = await res.json();
      setLotes(Array.isArray(data.results) ? data.results : data);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLote = useCallback(async (payload) => {
    const res = await apiFetch(`${API_BASE}/lotes/`, { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Error creando lote');
    const nuevo = await res.json();
    setLotes(prev => [nuevo, ...prev]);
    return nuevo;
  }, []);

  const updateLote = useCallback(async (id, payload) => {
    const res = await apiFetch(`${API_BASE}/lotes/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Error actualizando lote');
    const updated = await res.json();
    setLotes(prev => prev.map(l => l.id === id ? updated : l));
    return updated;
  }, []);

  const deleteLote = useCallback(async (id) => {
    const res = await apiFetch(`${API_BASE}/lotes/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error eliminando lote');
    setLotes(prev => prev.filter(l => l.id !== id));
    return true;
  }, []);

  // Calcular promedio ponderado (solo de lotes con cantidad disponible > 0)
  const averageCost = (() => {
    const activos = lotes.filter(l => Number(l.cantidad_disponible) > 0);
    const totalQty = activos.reduce((s, l) => s + Number(l.cantidad_disponible), 0);
    if (totalQty === 0) return 0;
    const totalCost = activos.reduce((s, l) => s + computeFinalUnitCost(l) * Number(l.cantidad_disponible), 0);
    return totalCost / totalQty;
  })();

  return {
    lotes,
    loading,
    error,
    averageCost,
    fetchLotes,
    createLote,
    updateLote,
    deleteLote,
    computeFinalUnitCost
  };
};

export default useLotes;