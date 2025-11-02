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
        const lineItems = lineas.map(li => ({
          producto_nombre: li?.producto?.nombre || li?.producto_nombre || (li?.producto_id ? `Producto #${li.producto_id}` : 'Producto'),
          cantidad: Number(li?.cantidad || 0),
          precio_unitario: li?.precio_unitario != null ? Number(li.precio_unitario) : undefined,
          subtotal: li?.subtotal != null ? Number(li.subtotal) : undefined,
          producto_id: li?.producto_id || li?.producto?.id || undefined,
        }));

        // Totales y desgloses opcionales
        const bruto = v?.subtotal != null ? Number(v.subtotal)
          : v?.subtotal_bruto != null ? Number(v.subtotal_bruto)
          : v?.bruto != null ? Number(v.bruto)
          : (lineItems.length && lineItems.every(li => typeof li.subtotal === 'number')
              ? lineItems.reduce((s, li) => s + (li.subtotal || 0), 0)
              : undefined);
        const descuento = v?.descuento_total != null ? Number(v.descuento_total)
          : v?.total_descuento != null ? Number(v.total_descuento)
          : v?.descuentos != null ? Number(v.descuentos)
          : undefined;
        const recargo = v?.recargo_total != null ? Number(v.recargo_total)
          : v?.total_recargo != null ? Number(v.total_recargo)
          : v?.recargos != null ? Number(v.recargos)
          : undefined;
        const impuestos = v?.impuestos_total != null ? Number(v.impuestos_total)
          : v?.iva_total != null ? Number(v.iva_total)
          : v?.total_impuestos != null ? Number(v.total_impuestos)
          : undefined;
        const neto = v?.total != null ? Number(v.total)
          : v?.monto_total != null ? Number(v.monto_total)
          : v?.importe_total != null ? Number(v.importe_total)
          : undefined;
        const numero = v?.numero || v?.nro || v?.comprobante || v?.factura_numero || undefined;

        const paymentDetails = {
          tarjeta_marca: v?.tarjeta_marca || v?.card_brand,
          tarjeta_ultimos4: v?.tarjeta_ultimos4 || v?.card_last4,
          autorizacion: v?.autorizacion || v?.auth_code,
          banco: v?.banco || v?.bank_name,
          referencia: v?.referencia || v?.transfer_reference || v?.comprobante_ref,
        };
        return {
          id: v?.id ?? v?.venta_id ?? Math.random(),
          date,
          time,
          cliente: clienteNombre,
          items: itemsResumen,
          total: Number(v?.total || v?.monto_total || v?.importe_total || 0),
          paymentMethod: medio.toLowerCase().includes('efec') ? 'cash' : (medio.toLowerCase().includes('tar') || medio.toLowerCase().includes('card')) ? 'card' : medio.toLowerCase() || 'cash',
          lineItems,
          bruto, descuento, recargo, impuestos, neto,
          numero,
          paymentDetails,
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
