// COMPONENTE FORMULARIO DE PRODUCTO

import React from 'react';
import ImageDropZone from './ImageDropZone';

/**
 * Formulario para crear/editar productos
 * @param {Object} props - Props del componente
 * @param {Object} props.productoForm - Datos del formulario
 * @param {Object} props.errors - Errores de validación
 * @param {File} props.selectedFile - Archivo de imagen seleccionado
 * @param {Function} props.onFieldChange - Función para cambiar campos
 * @param {Function} props.onFileChange - Función para cambiar archivo
 * @param {boolean} props.darkMode - Si está en modo oscuro
 */
const ProductForm = ({
  productoForm,
  errors,
  selectedFile,
  onFieldChange,
  onFileChange,
  darkMode
}) => {
  const inputClasses = `w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
    darkMode 
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
      : "bg-white border-slate-300 placeholder-gray-500"
  }`;

  return (
    <div className="space-y-4">
      {/* Nombre del producto */}
      <div>
        <input
          className={inputClasses}
          placeholder="Nombre del producto"
          value={productoForm.nombre}
          onChange={(e) => onFieldChange('nombre', e.target.value)}
        />
        {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
      </div>

      {/* Precio */}
      <div>
        <input
          type="number"
          className={inputClasses}
          placeholder="Precio"
          value={productoForm.precio}
          onChange={(e) => onFieldChange('precio', e.target.value)}
        />
        {errors.precio && <p className="text-xs text-red-500 mt-1">{errors.precio}</p>}
      </div>

      {/* Cantidad */}
      <div>
        <input
          type="number"
          className={inputClasses}
          placeholder="Cantidad"
          value={productoForm.cantidad}
          onChange={(e) => onFieldChange('cantidad', e.target.value)}
        />
        {errors.cantidad && <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>}
      </div>

      {/* Categoría */}
      <div>
        <input
          className={inputClasses}
          placeholder="Categoría"
          value={productoForm.categoria}
          onChange={(e) => onFieldChange('categoria', e.target.value)}
        />
        {errors.categoria && <p className="text-xs text-red-500 mt-1">{errors.categoria}</p>}
      </div>

      {/* Zona de imagen */}
      <ImageDropZone
        selectedFile={selectedFile}
        onFileChange={onFileChange}
        darkMode={darkMode}
      />
    </div>
  );
};

export default ProductForm;