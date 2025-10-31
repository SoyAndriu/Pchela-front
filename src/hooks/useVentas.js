import { useCallback, useState } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

export function useVentas() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

  return { createVenta, saving, error };
}

export default useVentas;
