// COMPONENTE FORMULARIO DE PRODUCTO

import React from 'react';
import ImageDropZone from './ImageDropZone';
import useCategories from '../../hooks/useCategories';

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
  const { categories, loading, error } = useCategories();
  const [selectedCategory, setSelectedCategory] = React.useState(productoForm.categoria_id || '');

  // Sincronizar el estado cuando cambie el formulario (para edición)
  React.useEffect(() => {
    setSelectedCategory(productoForm.categoria_id || '');
  }, [productoForm.categoria_id]);

  const inputClasses = `w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
    darkMode 
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
      : "bg-white border-slate-300 placeholder-gray-500"
  }`;

  // Manejar el cambio de categoría
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    onFieldChange('categoria_id', e.target.value); // Cambiar a categoria_id
  };

  return (
    <div className="space-y-4">
      {/* Selector de categoría */}
      <div>
        <select
          className={inputClasses}
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="" disabled>Selecciona una categoría</option>
          {loading ? (
            <option>Cargando...</option>
          ) : error ? (
            <option>Error al cargar categorías</option>
          ) : (
            categories.map((category) => (
              <option key={category.id} value={category.id}>{category.nombre}</option>
            ))
          )}
        </select>
        {errors.categoria_id && <p className="text-xs text-red-500 mt-1">{errors.categoria_id}</p>}
      </div>

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

      {/* Campo cantidad eliminado: el stock se ingresa luego por lotes */}

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