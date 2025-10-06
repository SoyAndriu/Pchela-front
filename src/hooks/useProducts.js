// HOOK PERSONALIZADO PARA MANEJAR PRODUCTOS

import { useState, useCallback } from 'react';
import { API_BASE } from '../config/productConfig';
import { getHeaders } from '../utils/productUtils';

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
      const res = await fetch(`${API_BASE}/productos/`, {
        headers: getHeaders(), // Incluir token de autenticación
      });
      
      // Si la respuesta no es exitosa, lanzar error
      if (!res.ok) throw new Error("Error cargando productos");
      
      // Convertir respuesta a JSON
      const data = await res.json();
      
      // Guardar productos en el estado (data.results viene del backend)
      setProductos(data.results || []);
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
        payload.append("cantidad", productoForm.cantidad);
        payload.append("categoria_id", productoForm.categoria_id); // Cambiar a categoria_id
        payload.append("imagen", selectedFile); // El archivo de imagen
        
        res = await fetch(url, {
          method,
          headers: getHeaders(true), // Headers para FormData (sin Content-Type)
          body: payload,
        });
      } else {
        // CASO 2: SIN IMAGEN - Enviar como JSON
        const payload = {
          nombre: productoForm.nombre,
          precio: productoForm.precio,
          cantidad: productoForm.cantidad,
          categoria_id: productoForm.categoria_id // Cambiar a categoria_id
          // No incluimos imagen si no hay archivo
        };
        
        res = await fetch(url, {
          method,
          headers: getHeaders(false), // Headers para JSON
          body: JSON.stringify(payload), // Convertir objeto a texto JSON
        });
      }
      
      // Verificar si la respuesta fue exitosa
      if (!res.ok) throw new Error("Error guardando producto");
      
      // Después de guardar exitosamente, recargar toda la lista
      // (esto asegura que veamos los datos actualizados del backend)
      await fetchProducts();
      
      return true; // Éxito
    } catch (error) {
      console.error('Error saving product:', error);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    }
  }, [fetchProducts]);

  // FUNCIÓN PARA ELIMINAR UN PRODUCTO
  const deleteProduct = useCallback(async (id) => {
    try {
      // Hacer petición DELETE al backend
      const res = await fetch(`${API_BASE}/productos/${id}/`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      
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