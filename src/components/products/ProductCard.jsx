// COMPONENTE PARA MOSTRAR UNA TARJETA DE PRODUCTO

import React from 'react';
import { PencilIcon, TrashIcon, PlusCircleIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { getStockStatus, getImageUrl } from '../../utils/productUtils';

/**
 * Componente que muestra una tarjeta individual de producto
 * @param {Object} props - Props del componente
 * @param {Object} props.item - Datos del producto
 * @param {Function} props.onEdit - Función para editar producto
 * @param {Function} props.onDelete - Función para eliminar producto
 * @param {boolean} props.darkMode - Si está en modo oscuro
 */
const ProductCard = ({ item, onEdit, onDelete, onIngresoStock, onVerLotes, darkMode }) => {
  const stockStatus = getStockStatus(item.cantidad);

  const handleDelete = () => {
    // Mostrar confirmación antes de eliminar
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      onDelete(item.id);
    }
  };

  // Resolver etiqueta de categoría con múltiples posibles formatos de respuesta del backend
  const categoryLabel =
    item.categoria_nombre || // Caso ideal: backend ya manda el nombre directo
    (item.categoria && typeof item.categoria === 'object' ? item.categoria.nombre : null) || // Caso: objeto anidado
    (typeof item.categoria === 'string' ? item.categoria : null) || // Caso legacy string
    (item.categoria_id ? `ID ${item.categoria_id}` : null); // Fallback: mostrar ID

  return (
    <div
      className={`flex items-center rounded-xl shadow-sm p-4 border transition-shadow hover:shadow-md ${
        darkMode 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-slate-200"
      }`}
    >
      {/* Imagen del producto */}
      <img 
        src={getImageUrl(item.imagen)} 
        alt={item.nombre} 
        className="w-16 h-16 object-cover rounded-lg mr-4 border border-slate-200" 
        onError={(e) => {
          console.log('Error cargando imagen:', item.imagen);
          e.target.src = getImageUrl(null); // Usar placeholder
        }}
      />
      
      {/* Información del producto */}
      <div className="flex-1">
        <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
          {item.nombre}
        </h3>
        <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Precio: <span className="font-semibold">${item.precio.toLocaleString()}</span>
        </p>
        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Categoría: {categoryLabel || "—"}
        </p>
        
        {/* Estado del stock */}
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Cantidad: {item.cantidad}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
            {stockStatus.text}
          </span>
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="flex gap-3">
        <button 
          onClick={() => onVerLotes && onVerLotes(item)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? "text-blue-400 hover:bg-gray-700 hover:text-blue-300" 
              : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          }`}
          aria-label="Historial de lotes"
        >
          <DocumentTextIcon className="h-5 w-5" />
        </button>
        <button 
          onClick={() => onIngresoStock && onIngresoStock(item)}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? "text-green-400 hover:bg-gray-700 hover:text-green-300" 
              : "text-green-600 hover:bg-green-50 hover:text-green-700"
          }`}
          aria-label="Ingresar stock"
        >
          <PlusCircleIcon className="h-5 w-5" />
        </button>
        <button 
          onClick={() => onEdit(item)} 
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? "text-pink-400 hover:bg-gray-700 hover:text-pink-300" 
              : "text-pink-600 hover:bg-pink-50 hover:text-pink-700"
          }`}
          aria-label="Editar producto"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
        
        <button 
          onClick={handleDelete} 
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? "text-red-400 hover:bg-gray-700 hover:text-red-300" 
              : "text-red-600 hover:bg-red-50 hover:text-red-700"
          }`}
          aria-label="Eliminar producto"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;