// COMPONENTE PARA MOSTRAR ESTADÍSTICAS DE PRODUCTOS

import React from 'react';
import { ShoppingBagIcon, TagIcon, SwatchIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { calculateStats } from '../../utils/productUtils';

/**
 * Componente que muestra el header y estadísticas de productos
 * @param {Object} props - Props del componente
 * @param {Array} props.productos - Array de productos
 * @param {boolean} props.darkMode - Si está en modo oscuro
 * @param {Function} props.onManageCategories - Función para gestionar categorías
 * @param {Function} props.onManageMarcas - Función para gestionar marcas
 * @param {Function} [props.onRecalcStocks] - Función para recalcular stocks
 */
const ProductStats = ({ productos, darkMode, onManageCategories, onManageMarcas, onRecalcStocks }) => {
  const { totalProductos, totalValor, productosStockBajo } = calculateStats(productos);

  return (
    <div className="mb-6">
      {/* Header con título y botón de categorías */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <ShoppingBagIcon className={`h-8 w-8 ${darkMode ? "text-pink-400" : "text-pink-600"}`} />
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>
            Productos
          </h2>
        </div>
        
        {/* Botones para gestionar categorías y marcas */}
        <div className="flex items-center gap-2">
          {onManageMarcas && (
            <button
              onClick={onManageMarcas}
              className={`flex items-center gap-2 px-4 py-2 h-10 rounded-lg transition-colors ${
                darkMode 
                  ? "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600" 
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              <SwatchIcon className="w-5 h-5" />
              Gestionar Marcas
            </button>
          )}
          {onManageCategories && (
            <button
              onClick={onManageCategories}
              className={`flex items-center gap-2 px-4 py-2 h-10 rounded-lg transition-colors ${
                darkMode 
                  ? "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600" 
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              <TagIcon className="w-5 h-5" />
              Gestionar Categorías
            </button>
          )}
          {onRecalcStocks && (
            <button
              onClick={onRecalcStocks}
              className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                darkMode 
                  ? "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600" 
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
              title="Recalcular stock desde lotes"
              aria-label="Recalcular stock desde lotes"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total de productos */}
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
            Total Productos
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
            {totalProductos}
          </p>
        </div>

        {/* Valor total del inventario */}
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
            Valor Total Inventario
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
            ${totalValor.toLocaleString()}
          </p>
        </div>

        {/* Productos con stock bajo */}
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
            Stock Bajo
          </h3>
          <p className={`text-2xl font-bold ${
            productosStockBajo > 0 
              ? "text-red-600" 
              : (darkMode ? "text-green-400" : "text-green-600")
          }`}>
            {productosStockBajo}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductStats;