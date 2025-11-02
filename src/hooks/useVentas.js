import { useCallback, useState } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

export function useVentas() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const createVenta = useCallback(async (payload) => {
    setSaving(true); setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/ventas/`, { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) {
        let msg = 'Error registrando venta';
        try { const err = await res.json(); msg = err?.detail || err?.message || msg; } catch { /* noop */ }
        throw new Error(msg);
      }
      return await res.json();
    } finally {
      setSaving(false);
    }
  }, []);

  // Listado de ventas con filtros y paginación
  const listVentas = useCallback(async ({ search, startDate, endDate, medioPago, page = 1 } = {}) => {
    setLoading(true); setError(null);
    try {
      const mapMedio = (m) => {
        if (!m || m === 'all') return null;
        const val = String(m).toLowerCase();
        if (val === 'cash') return 'efectivo';
        if (val === 'card') return 'tarjeta';
        if (val === 'transfer') return 'transferencia';
        return val; // por si el backend usa otra etiqueta
      };

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (startDate) params.set('fecha_desde', startDate);
      if (endDate) params.set('fecha_hasta', endDate);
      const medioMap = mapMedio(medioPago);
      if (medioMap) params.set('medio_pago', medioMap);
      if (page) params.set('page', String(page));

      const url = `${API_BASE}/ventas/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        let msg = 'Error obteniendo ventas';
        try { const err = await res.json(); msg = err?.detail || err?.message || msg; } catch { /* noop */ }
        throw new Error(msg);
      }
      const data = await res.json();

      const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const count = typeof data?.count === 'number' ? data.count : items.length;
      const next = data?.next || null;
      const previous = data?.previous || null;

      const normalized = items.map(v => {
        const clienteNombre = v?.cliente?.nombre_completo
          || ([v?.cliente?.nombre, v?.cliente?.apellido].filter(Boolean).join(' ').trim())
          || v?.cliente_nombre
          || v?.cliente
          || 'Cliente';
        const medio = (v?.medio_pago || v?.medio || '').toString();
        const fechaRaw = v?.fecha || v?.fecha_hora || v?.created_at || v?.created || null;
        const fecha = fechaRaw ? new Date(fechaRaw) : null;
        const date = fecha ? fecha.toISOString().slice(0,10) : '';
        const time = fecha ? fecha.toTimeString().slice(0,5) : '';
        const lineas = Array.isArray(v?.items) ? v.items : (Array.isArray(v?.lineas) ? v.lineas : []);
        const itemsResumen = lineas.map(li => {
          const nombre = li?.producto?.nombre || li?.producto_nombre || (li?.producto_id ? `Producto #${li.producto_id}` : 'Producto');
          const cant = Number(li?.cantidad || 0);
          return `${nombre}${cant ? ` x${cant}` : ''}`;
        });
        return {
          id: v?.id ?? v?.venta_id ?? Math.random(),
          date,
          time,
          cliente: clienteNombre,
          items: itemsResumen,
          total: Number(v?.total || v?.monto_total || v?.importe_total || 0),
          paymentMethod: medio.toLowerCase().includes('efec') ? 'cash' : (medio.toLowerCase().includes('tar') || medio.toLowerCase().includes('card')) ? 'card' : medio.toLowerCase() || 'cash',
        };
      });

      return { items: normalized, count, next, previous };
    } finally {
      setLoading(false);
    }
  }, []);

  return { createVenta, saving, error, listVentas, loading };
}

export default useVentas;
