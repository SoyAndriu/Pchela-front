import { useState, useCallback } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

const useMarcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeMarca = (m) => ({
    ...m,
    nombre: m?.nombre ?? m?.nombre_marca ?? m?.name ?? '',
  });

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

  return {
    marcas,
    loading,
    error,
    fetchMarcas
  };
};

export default useMarcas;
