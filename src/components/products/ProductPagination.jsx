// COMPONENTE DE PAGINACIÓN

import React from 'react';

/**
 * Componente para manejar la paginación de productos
 * @param {Object} props - Props del componente
 * @param {number} props.currentPage - Página actual
 * @param {number} props.totalPages - Total de páginas
 * @param {number} props.totalItems - Total de elementos
 * @param {Function} props.onPageChange - Función para cambiar página
 * @param {boolean} props.darkMode - Si está en modo oscuro
 */
const ProductPagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  onPageChange, 
  darkMode 
}) => {
  return (
    <div className="flex items-center justify-between mt-6 text-sm">
      {/* Información de resultados */}
      <span className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        {totalItems} resultados • Página {currentPage} de {totalPages}
      </span>
      
      {/* Botones de navegación */}
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(-1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded border text-xs ${
            currentPage === 1 ? "opacity-40 cursor-not-allowed" : ""
          } ${
            darkMode 
              ? "border-gray-600 text-gray-200 hover:bg-gray-700" 
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Anterior
        </button>
        
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded border text-xs ${
            currentPage === totalPages ? "opacity-40 cursor-not-allowed" : ""
          } ${
            darkMode 
              ? "border-gray-600 text-gray-200 hover:bg-gray-700" 
              : "border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ProductPagination;