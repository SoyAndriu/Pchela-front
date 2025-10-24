import { useCallback } from "react";
import { API_BASE } from "../config/productConfig";

export function useRegistrarCompra() {
  // Recibe el payload y retorna {data, error}
  const registrarCompra = useCallback(async (payload) => {
    try {
  // Buscar token igual que AuthContext: primero sessionStorage, luego localStorage
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/registrar-compra/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });
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
