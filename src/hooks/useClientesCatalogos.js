import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

const FALLBACK_IVA = [
  { code: 'CF', label: 'Consumidor Final' },
  { code: 'RI', label: 'Responsable Inscripto' },
  { code: 'MT', label: 'Monotributo' },
  { code: 'EX', label: 'Exento' },
  { code: 'NR', label: 'No Responsable' },
];

export function useClientesCatalogos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [condicionIva, setCondicionIva] = useState(FALLBACK_IVA);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError(null);
      try {
  const res = await apiFetch(`${API_BASE}/clientes/catalogos/`);
        if (!res.ok) throw new Error('No se pudo obtener catálogos');
        const data = await res.json();
        const iva = Array.isArray(data?.condicion_iva) ? data.condicion_iva : [];
        if (active && iva.length) setCondicionIva(iva);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return useMemo(() => ({ condicionIva, loading, error }), [condicionIva, loading, error]);
}

export default useClientesCatalogos;
