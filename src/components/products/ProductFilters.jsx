// COMPONENTE PARA FILTROS Y BÚSQUEDA DE PRODUCTOS

import React from 'react';
import { STOCK_FILTERS, SORT_OPTIONS } from '../../config/productConfig';
import useCategories from '../../hooks/useCategories';

/**
 * Componente que maneja los filtros de búsqueda y ordenamiento
 * @param {Object} props - Props del componente
 * @param {string} props.searchTerm - Término de búsqueda actual
 * @param {string} props.stockFilter - Filtro de stock actual
 * @param {string} props.sortBy - Ordenamiento actual
 * @param {Function} props.onSearchChange - Función para cambiar búsqueda
 * @param {Function} props.onStockFilterChange - Función para cambiar filtro de stock
 * @param {Function} props.onSortChange - Función para cambiar ordenamiento
 * @param {boolean} props.darkMode - Si está en modo oscuro
 */
const ProductFilters = ({
  searchTerm,
  stockFilter,
  sortBy,
  categoryFilter,
  onSearchChange,
  onStockFilterChange,
  onSortChange,
  onCategoryFilterChange,
  darkMode
}) => {
  const { categories, loading } = useCategories();
  return (
    <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Búsqueda de productos */}
      <div className="col-span-2">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
            darkMode 
              ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" 
              : "bg-white border-slate-200 placeholder-gray-500"
          }`}
        />
      </div>

      {/* Filtro de categoría */}
      <div>
        <select
          value={categoryFilter || ''}
          onChange={e => onCategoryFilterChange(e.target.value)}
          className={`w-full p-3 rounded-lg border text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
            darkMode 
              ? "bg-gray-800 border-gray-600 text-white" 
              : "bg-white border-slate-200"
          }`}
        >
          <option value="">Todas las categorías</option>
          {loading ? (
            <option>Cargando...</option>
          ) : (
            categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))
          )}
        </select>
      </div>

      {/* Filtro de stock */}
      <div>
        <select
          value={stockFilter}
          onChange={(e) => onStockFilterChange(e.target.value)}
          className={`w-full p-3 rounded-lg border text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
            darkMode 
              ? "bg-gray-800 border-gray-600 text-white" 
              : "bg-white border-slate-200"
          }`}
        >
          {STOCK_FILTERS.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ordenamiento */}
      <div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className={`w-full p-3 rounded-lg border text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
            darkMode 
              ? "bg-gray-800 border-gray-600 text-white" 
              : "bg-white border-slate-200"
          }`}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProductFilters;