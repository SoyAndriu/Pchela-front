// HOOK PERSONALIZADO PARA FILTROS Y PAGINACIÓN DE PRODUCTOS

import { useState, useMemo, useCallback } from 'react';
import useCategories from './useCategories';
import { PAGE_SIZE } from '../config/productConfig';

/**
 * Hook para manejar filtros, búsqueda y paginación de productos
 * @param {Array} productos - Array de productos para filtrar
 * @returns {Object} Estados y funciones para filtrado y paginación
 */
export const useProductFilters = (productos) => {
  const { categories } = useCategories();
  // ESTADOS DE FILTROS
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre"); // nombre | precio | stock
  const [stockFilter, setStockFilter] = useState("todos"); // todos | bajo | sin | ok
  const [page, setPage] = useState(1);

  // LÓGICA DE FILTRADO Y ORDENAMIENTO
  // useMemo hace que esto solo se recalcule cuando cambian las dependencias
  const [categoryFilter, setCategoryFilter] = useState("");
  const filteredProducts = useMemo(() => {
    let list = (Array.isArray(productos) ? productos : [])
      .filter(p => {
        // Filtrar por nombre de producto o nombre de categoría
        const catNombre = categories.find(c => c.id === p.categoria_id)?.nombre?.toLowerCase() || "";
        return (
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          catNombre.includes(searchTerm.toLowerCase())
        );
      });
    // Filtrar por categoría seleccionada
    if (categoryFilter) {
      list = list.filter(p => String(p.categoria_id) === String(categoryFilter));
    }
    // Filtrar por stock si no es "todos"
    if (stockFilter !== "todos") {
      list = list.filter(p => {
        if (stockFilter === "sin") return p.cantidad === 0;
        if (stockFilter === "bajo") return p.cantidad > 0 && p.cantidad < 10;
        if (stockFilter === "ok") return p.cantidad >= 10;
        return true;
      });
    }
    // Ordenar según la opción seleccionada
    list.sort((a, b) => {
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "precio") return b.precio - a.precio;
      if (sortBy === "stock") return b.cantidad - a.cantidad;
      return 0;
    });
    return list;
  }, [productos, searchTerm, stockFilter, sortBy, categoryFilter, categories]);

  // LÓGICA DE PAGINACIÓN
  const safeFilteredProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
  const totalPages = Math.ceil(safeFilteredProducts.length / PAGE_SIZE) || 1; // Calcular total de páginas
  const currentPageProducts = safeFilteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE); // Productos de la página actual

  // FUNCIÓN PARA CAMBIAR PÁGINA
  const changePage = useCallback((direction) => {
    setPage(prevPage => Math.min(Math.max(1, prevPage + direction), totalPages));
  }, [totalPages]);

  // FUNCIÓN PARA CAMBIAR BÚSQUEDA (y resetear página)
  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
    setPage(1); // Volver a la primera página al buscar
  }, []);

  // FUNCIÓN PARA CAMBIAR FILTRO DE STOCK (y resetear página)
  const handleStockFilterChange = useCallback((filter) => {
    setStockFilter(filter);
    setPage(1); // Volver a la primera página al filtrar
  }, []);

  // FUNCIÓN PARA CAMBIAR ORDENAMIENTO
  const handleSortChange = useCallback((sort) => {
    setSortBy(sort);
  }, []);

  // Función para cambiar filtro de categoría
  const handleCategoryFilterChange = useCallback((catId) => {
    setCategoryFilter(catId);
    setPage(1);
  }, []);

  return {
    searchTerm,
    sortBy,
    stockFilter,
    categoryFilter,
    page,
    filteredProducts: safeFilteredProducts,
    currentPageProducts,
    totalPages,
    changePage,
    handleSearchChange,
    handleStockFilterChange,
    handleSortChange,
    handleCategoryFilterChange
  };
};