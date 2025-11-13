// HOOK PERSONALIZADO PARA MANEJAR PRODUCTOS

import { useState, useCallback } from 'react';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';

/**
 * Hook para manejar toda la lógica de productos (CRUD)
 * @returns {Object} Estados y funciones para manejar productos
 */
export const useProducts = () => {
  // ESTADOS
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // FUNCIÓN PARA CARGAR PRODUCTOS DESDE EL BACKEND
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      
      // Hacer petición GET al backend para obtener productos
      const res = await apiFetch(`${API_BASE}/productos/`);
      
      // Si la respuesta no es exitosa, lanzar error
      if (!res.ok) throw new Error("Error cargando productos");
      
      // Convertir respuesta a JSON
      const data = await res.json();
      const items = data.results || data;
      const normalized = Array.isArray(items) ? items.map(p => {
        const derivedMarcaId = p?.marca_id ?? (typeof p?.marca === 'object' ? p?.marca?.id : (typeof p?.marca === 'number' ? p?.marca : undefined));
        const derivedMarcaNombre = p?.marca_nombre ?? (typeof p?.marca === 'object' ? (p?.marca?.nombre ?? p?.marca?.nombre_marca) : undefined);
        const derivedCategoriaId = p?.categoria_id ?? (typeof p?.categoria === 'object' ? p?.categoria?.id : (typeof p?.categoria === 'number' ? p?.categoria : undefined));
        return {
          ...p,
          ...(derivedMarcaId !== undefined ? { marca_id: derivedMarcaId } : {}),
          ...(derivedMarcaNombre !== undefined ? { marca_nombre: derivedMarcaNombre } : {}),
          ...(derivedCategoriaId !== undefined ? { categoria_id: derivedCategoriaId } : {}),
        };
      }) : [];
      
      // Guardar productos normalizados en el estado
      setProductos(normalized);
    } catch (error) {
      // Si hay error, mostrar mensaje
      setApiError('No se pudieron cargar los productos.');
      console.error('Error fetching products:', error);
    } finally {
      // Siempre desactivar el indicador de carga
      setLoading(false);
    }
  }, []);

  // FUNCIÓN PARA GUARDAR PRODUCTO (crear o editar)
  const saveProduct = useCallback(async (productoForm, selectedFile, isEditing) => {
    try {
      // Decidir si es edición (PATCH) o creación (POST)
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing
        ? `${API_BASE}/productos/${productoForm.id}/` // Para editar: incluir ID
        : `${API_BASE}/productos/`; // Para crear: sin ID
      
  let res; // Variable para la respuesta
      
      if (selectedFile) {
        // CASO 1: HAY IMAGEN - Enviar como FormData (para archivos)
        const payload = new FormData();
        payload.append("nombre", productoForm.nombre);
        payload.append("precio", productoForm.precio);
        // Cantidad solo al crear (se gestiona por lotes). No enviar en edición.
        if (!isEditing) payload.append("cantidad", 0);
        payload.append("categoria_id", productoForm.categoria_id); // Cambiar a categoria_id
        if (productoForm.marca_id) payload.append("marca_id", productoForm.marca_id);
        payload.append("imagen", selectedFile); // El archivo de imagen
        
        res = await apiFetch(url, { method, body: payload }, { isFormData: true });
      } else {
        // CASO 2: SIN IMAGEN - Enviar como JSON
        const payload = {
          nombre: productoForm.nombre,
          precio: productoForm.precio,
          ...(isEditing ? {} : { cantidad: 0 }), // Solo en creación
          categoria_id: productoForm.categoria_id, // Cambiar a categoria_id
          ...(productoForm.marca_id ? { marca_id: productoForm.marca_id } : {})
          // No incluimos imagen si no hay archivo
        };
        
        res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      }
      
      // Verificar si la respuesta fue exitosa
      if (!res.ok) throw new Error("Error guardando producto");

      // Intentar obtener el producto creado/actualizado del backend
      let created = null;
      try { created = await res.clone().json(); } catch { /* puede no haber body */ }

      // Después de guardar exitosamente, recargar toda la lista
      // (esto asegura que veamos los datos actualizados del backend)
      await fetchProducts();

      // Devolver el objeto creado/actualizado si está disponible, para usos inmediatos (e.g., seleccionar en UI)
      return created || true; // Éxito
    } catch (error) {
      console.error('Error saving product:', error);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    }
  }, [fetchProducts]);

  // FUNCIÓN PARA ELIMINAR UN PRODUCTO
  const deleteProduct = useCallback(async (id) => {
    try {
      // Hacer petición DELETE al backend
      const res = await apiFetch(`${API_BASE}/productos/${id}/`, { method: "DELETE" });
      
      if (!res.ok) throw new Error("Error eliminando el producto");
      
      // Actualizar la lista local removiendo el producto eliminado
      setProductos((prev) => prev.filter((p) => p.id !== id));
      
      return true; // Éxito
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    }
  }, []);

  return {
    // Estados
    productos,
    loading,
    apiError,
    
    // Funciones
    fetchProducts,
    saveProduct,
    deleteProduct
  };
};