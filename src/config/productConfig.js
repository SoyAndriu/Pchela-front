// CONFIGURACIÓN PARA EL MÓDULO DE PRODUCTOS

// URL base de la API
export const API_BASE = "http://127.0.0.1:8000/api";

// Configuración de paginación
export const PAGE_SIZE = 6;

// Opciones de filtros de stock
export const STOCK_FILTERS = [
  { value: "todos", label: "Stock: Todos" },
  { value: "sin", label: "Sin stock" },
  { value: "bajo", label: "Stock bajo" },
  { value: "ok", label: "Stock OK" }
];

// Opciones de ordenamiento
export const SORT_OPTIONS = [
  { value: "nombre", label: "Orden: Nombre" },
  { value: "precio", label: "Orden: Precio ↓" },
  { value: "stock", label: "Orden: Stock ↓" }
];

// Imagen placeholder como base64 (para productos sin imagen)
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0zMiAyNEMyNi40NzcgMjQgMjIgMjguNDc3IDIyIDM0QzIyIDM5LjUyMyAyNi40NzcgNDQgMzIgNDRDMzcuNTIzIDQ0IDQyIDM5LjUyMyA0MiAzNEM0MiAyOC40NzcgMzcuNTIzIDI0IDMyIDI0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';

// Flag de depuración específico de Caja: habilita logs detallados en consola.
// Mantener en false en producción para evitar ruido en consola.
export const DEBUG_CAJA = false;