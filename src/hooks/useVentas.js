import { useCallback, useState } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

export function useVentas() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const createVenta = useCallback(async (payload) => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/ventas/`, { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) {
        let msg = 'Error registrando venta';
        try {
          const err = await res.json();
          msg = err?.detail || err?.message || msg;
        } catch { /* noop */ }
        throw new Error(msg);
      }
      return await res.json();
    } finally {
      setSaving(false);
    }
  }, []);

  // Listado de ventas con filtros y paginación
  const listVentas = useCallback(async ({ search, startDate, endDate, medioPago, empleadoId, page = 1 } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const mapMedio = (m) => {
        if (!m || m === 'all') return null;
        const val = String(m).toLowerCase();
        if (val === 'cash') return 'EFECTIVO';
        if (val === 'card') return 'TARJETA';
        if (val === 'transfer') return 'TRANSFERENCIA';
        // devolver en mayúsculas para mantener consistencia con el backend
        return val.toUpperCase();
      };

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (startDate) params.set('fecha_desde', startDate);
      if (endDate) params.set('fecha_hasta', endDate);
      const medioMap = mapMedio(medioPago);
      if (medioMap) params.set('medio_pago', medioMap);
      if (page) params.set('page', String(page));
      if (empleadoId) params.set('empleado_id', String(empleadoId));

      const url = `${API_BASE}/ventas/${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        let msg = 'Error obteniendo ventas';
        try {
          const err = await res.json();
          msg = err?.detail || err?.message || msg;
        } catch { /* noop */ }
        throw new Error(msg);
      }
      const data = await res.json();

      const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      const count = typeof data?.count === 'number' ? data.count : items.length;
      const next = data?.next || null;
      const previous = data?.previous || null;

      const normalized = items.map((v) => {
        const clienteNombre = v?.cliente?.nombre_completo
          || ([v?.cliente?.nombre, v?.cliente?.apellido].filter(Boolean).join(' ').trim())
          || v?.cliente_nombre
          || v?.cliente
          || 'Cliente';
        const medio = (v?.medio_pago || v?.medio || '').toString();
        const fechaRaw = v?.fecha || v?.fecha_hora || v?.created_at || v?.created || null;
        const fecha = fechaRaw ? new Date(fechaRaw) : null;
        const date = fecha ? fecha.toISOString().slice(0, 10) : '';
        const time = fecha ? fecha.toTimeString().slice(0, 5) : '';
        const lineas = Array.isArray(v?.items) ? v.items : (Array.isArray(v?.lineas) ? v.lineas : []);
        const itemsResumen = lineas.map(li => {
          const nombre = li?.producto?.nombre || li?.producto_nombre || (li?.producto_id ? `Producto #${li.producto_id}` : 'Producto');
          const cant = Number(li?.cantidad || 0);
          return `${nombre}${cant ? ` x${cant}` : ''}`;
        });
        const lineItems = lineas.map(li => ({
          producto_nombre: li?.producto?.nombre || li?.producto_nombre || (li?.producto_id ? `Producto #${li.producto_id}` : 'Producto'),
          cantidad: Number(li?.cantidad || 0),
          precio_unitario: li?.precio_unitario != null ? Number(li.precio_unitario) : (li?.precio != null ? Number(li.precio) : undefined),
          subtotal: li?.subtotal != null ? Number(li.subtotal) : (li?.total_linea != null ? Number(li.total_linea) : undefined),
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
        const empleado = v?.empleado_nombre || v?.cajero_nombre || v?.usuario_nombre || v?.empleado || undefined;
        const empleado_id = v?.empleado_id || v?.cajero_id || v?.usuario_id || undefined;

        const paymentDetails = {
          tarjeta_marca: v?.tarjeta_marca || v?.card_brand,
          tarjeta_ultimos4: v?.tarjeta_ultimos4 || v?.card_last4,
          autorizacion: v?.autorizacion || v?.auth_code,
          banco: v?.banco || v?.bank_name,
          referencia: v?.referencia || v?.transfer_reference || v?.comprobante_ref,
        };

        // Mapeo robusto de medio de pago
        const m = medio.toLowerCase();
        let paymentMethod = 'cash';
        if (m.includes('efec')) paymentMethod = 'cash';
        else if (m.includes('transf') || m.includes('transfer')) paymentMethod = 'transfer';
        else if (m.includes('tarj') || m.includes('card')) paymentMethod = 'card';

        return {
          id: v?.id ?? v?.venta_id ?? Math.random(),
          date,
          time,
          cliente: clienteNombre,
          items: itemsResumen,
          total: Number(neto ?? 0),
          paymentMethod,
          lineItems,
          bruto, descuento, recargo, impuestos, neto,
          numero,
          paymentDetails,
          empleado, empleado_id,
        };
      });

      return { items: normalized, count, next, previous };
    } finally {
      setLoading(false);
    }
  }, []);

  // Detalle de venta por id (para completar precios por item en el modal)
  const getVentaDetalle = useCallback(async (id) => {
    const res = await apiFetch(`${API_BASE}/ventas/${id}/`);
    if (!res.ok) {
      let msg = 'No se pudo obtener el detalle de la venta';
      try {
        const err = await res.json();
        msg = err?.detail || err?.message || msg;
      } catch { /* noop */ }
      throw new Error(msg);
    }
    const v = await res.json();

    const clienteNombre = v?.cliente?.nombre_completo
      || ([v?.cliente?.nombre, v?.cliente?.apellido].filter(Boolean).join(' ').trim())
      || v?.cliente_nombre || v?.cliente || 'Cliente';
    const medio = (v?.medio_pago || v?.medio || '').toString();
    const fechaRaw = v?.fecha || v?.fecha_hora || v?.created_at || v?.created || null;
    const fecha = fechaRaw ? new Date(fechaRaw) : null;
    const date = fecha ? fecha.toISOString().slice(0, 10) : '';
    const time = fecha ? fecha.toTimeString().slice(0, 5) : '';
    const lineas = Array.isArray(v?.items) ? v.items : (Array.isArray(v?.lineas) ? v.lineas : []);
    const itemsResumen = lineas.map(li => {
      const nombre = li?.producto?.nombre || li?.producto_nombre || (li?.producto_id ? `Producto #${li.producto_id}` : 'Producto');
      const cant = Number(li?.cantidad || 0);
      return `${nombre}${cant ? ` x${cant}` : ''}`;
    });
    const lineItems = lineas.map(li => ({
      producto_nombre: li?.producto?.nombre || li?.producto_nombre || (li?.producto_id ? `Producto #${li.producto_id}` : 'Producto'),
      cantidad: Number(li?.cantidad || 0),
      precio_unitario: li?.precio_unitario != null ? Number(li.precio_unitario) : (li?.precio != null ? Number(li.precio) : undefined),
      subtotal: li?.subtotal != null ? Number(li.subtotal) : (li?.total_linea != null ? Number(li.total_linea) : undefined),
      producto_id: li?.producto_id || li?.producto?.id || undefined,
    }));
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
    const neto = v?.total != null ? Number(v.total)
      : v?.monto_total != null ? Number(v.monto_total)
      : v?.importe_total != null ? Number(v.importe_total)
      : undefined;
    const numero = v?.numero || v?.nro || v?.comprobante || v?.factura_numero || undefined;
    const empleado = v?.empleado_nombre || v?.cajero_nombre || v?.usuario_nombre || v?.empleado || undefined;
    const empleado_id = v?.empleado_id || v?.cajero_id || v?.usuario_id || undefined;

    // Mapeo robusto de medio de pago en detalle
    const md = medio.toLowerCase();
    let paymentMethod = 'cash';
    if (md.includes('efec')) paymentMethod = 'cash';
    else if (md.includes('transf') || md.includes('transfer')) paymentMethod = 'transfer';
    else if (md.includes('tarj') || md.includes('card')) paymentMethod = 'card';

    return {
      id: v?.id ?? v?.venta_id ?? Math.random(),
      date,
      time,
      cliente: clienteNombre,
      items: itemsResumen,
      total: Number(neto ?? 0),
      paymentMethod,
      lineItems,
      bruto, descuento, neto, numero,
      empleado, empleado_id,
    };
  }, []);

  return { createVenta, saving, error, listVentas, getVentaDetalle, loading };
}

export default useVentas;
