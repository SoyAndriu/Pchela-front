import { useCallback } from "react";
import { API_BASE } from "../config/productConfig";
import { apiFetch } from "../utils/productUtils";

export function useRegistrarCompra() {
  // Recibe el payload y retorna {data, error}
  const registrarCompra = useCallback(async (payload) => {
    try {
      const response = await apiFetch(`${API_BASE}/registrar-compra/`, { method: "POST", body: JSON.stringify(payload), credentials: "include" });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.detail || errData?.error || "Error al registrar la compra");
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  return { registrarCompra };
}
