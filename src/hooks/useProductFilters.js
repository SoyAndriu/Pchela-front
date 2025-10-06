// HOOK PERSONALIZADO PARA FILTROS Y PAGINACIÓN DE PRODUCTOS

import { useState, useMemo, useCallback } from 'react';
import { PAGE_SIZE } from '../config/productConfig';

/**
 * Hook para manejar filtros, búsqueda y paginación de productos
 * @param {Array} productos - Array de productos para filtrar
 * @returns {Object} Estados y funciones para filtrado y paginación
 */
export const useProductFilters = (productos) => {
  // ESTADOS DE FILTROS
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre"); // nombre | precio | stock
  const [stockFilter, setStockFilter] = useState("todos"); // todos | bajo | sin | ok
  const [page, setPage] = useState(1);

  // LÓGICA DE FILTRADO Y ORDENAMIENTO
  // useMemo hace que esto solo se recalcule cuando cambian las dependencias
  const filteredProducts = useMemo(() => {
    // Asegurarse de que productos sea un array
    let list = (Array.isArray(productos) ? productos : [])
      .filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())); // Filtrar por búsqueda
    
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
      if (sortBy === "precio") return b.precio - a.precio; // mayor precio primero
      if (sortBy === "stock") return b.cantidad - a.cantidad; // mayor stock primero
      return 0;
    });
    
    return list;
  }, [productos, searchTerm, stockFilter, sortBy]); // Se recalcula cuando cambian estas variables

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

  return {
    // Estados de filtros
    searchTerm,
    sortBy,
    stockFilter,
    page,
    
    // Datos procesados
    filteredProducts: safeFilteredProducts,
    currentPageProducts,
    totalPages,
    
    // Funciones de control
    changePage,
    handleSearchChange,
    handleStockFilterChange,
    handleSortChange
  };
};