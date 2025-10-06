// COMPONENTE PARA MOSTRAR ESTADÍSTICAS DE PRODUCTOS

import React from 'react';
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { calculateStats } from '../../utils/productUtils';

/**
 * Componente que muestra el header y estadísticas de productos
 * @param {Object} props - Props del componente
 * @param {Array} props.productos - Array de productos
 * @param {boolean} props.darkMode - Si está en modo oscuro
 */
const ProductStats = ({ productos, darkMode }) => {
  const { totalProductos, totalValor, productosStockBajo } = calculateStats(productos);

  return (
    <div className="mb-6">
      {/* Header con título */}
      <div className="flex items-center gap-3 mb-4">
        <ShoppingBagIcon className={`h-8 w-8 ${darkMode ? "text-pink-400" : "text-pink-600"}`} />
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>
          Productos de Cosmética
        </h2>
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