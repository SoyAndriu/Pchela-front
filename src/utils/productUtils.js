// UTILIDADES PARA EL MÓDULO DE PRODUCTOS

import { API_BASE, PLACEHOLDER_IMAGE } from '../config/productConfig';

/**
 * Genera los headers para las peticiones HTTP
 * @param {boolean} isFormData - Si es true, no incluye Content-Type (para FormData)
 * @returns {Object} Headers configurados
 */
export const getHeaders = (isFormData = false) => {
  const headers = {
    // Token de autenticación para que el backend sepa quién eres
    'Authorization': `Bearer ${localStorage.getItem("token")}`,
  };
  // Si no es FormData (archivos), agregamos Content-Type JSON
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

/**
 * Determina el estado visual del stock según la cantidad
 * @param {number} cantidad - Cantidad en stock
 * @returns {Object} Objeto con color, fondo y texto del estado
 */
export const getStockStatus = (cantidad) => {
  if (cantidad === 0) return { 
    color: "text-red-600", 
    bg: "bg-red-100", 
    text: "Sin stock" 
  };
  if (cantidad < 10) return { 
    color: "text-yellow-600", 
    bg: "bg-yellow-100", 
    text: "Stock bajo" 
  };
  return { 
    color: "text-green-600", 
    bg: "bg-green-100", 
    text: "En stock" 
  };
};

/**
 * Calcula estadísticas generales de los productos
 * @param {Array} productos - Array de productos
 * @returns {Object} Estadísticas calculadas
 */
export const calculateStats = (productos) => {
  const safeProductos = Array.isArray(productos) ? productos : [];
  
  return {
    totalProductos: safeProductos.length,
    totalValor: safeProductos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0),
    productosStockBajo: safeProductos.filter(p => p.cantidad < 10).length
  };
};

/**
 * Valida los campos del formulario de producto
 * @param {Object} productoForm - Datos del formulario
 * @returns {Object} Objeto con errores encontrados
 */
export const validateProduct = (productoForm) => {
  const errors = {};
  
  // Validar que el nombre no esté vacío
  if (!productoForm.nombre.trim()) errors.nombre = "Requerido";
  
  // Validar que el precio sea un número positivo
  if (productoForm.precio === "" || Number(productoForm.precio) <= 0) {
    errors.precio = "Precio inválido";
  }
  
  // Validar que la cantidad sea un número no negativo
  if (productoForm.cantidad === "" || Number(productoForm.cantidad) < 0) {
    errors.cantidad = "Cantidad inválida";
  }
  
  // Validar que la categoría esté seleccionada
  if (!productoForm.categoria_id || productoForm.categoria_id === "") {
    errors.categoria_id = "Debe seleccionar una categoría";
  }
  
  return errors;
};

/**
 * Construye la URL de imagen correcta o devuelve placeholder
 * @param {string} imagen - URL de imagen del backend
 * @returns {string} URL de imagen válida o placeholder
 */
export const getImageUrl = (imagen) => {
  return imagen || PLACEHOLDER_IMAGE;
};