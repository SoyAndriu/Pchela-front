// COMPONENTE MODAL PARA CREAR/EDITAR PRODUCTOS

import React from 'react';
import { XMarkIcon } from "@heroicons/react/24/outline";
import ProductForm from './ProductForm';

/**
 * Modal para crear o editar productos
 * @param {Object} props - Props del componente
 * @param {boolean} props.visible - Si el modal está visible
 * @param {boolean} props.isEditing - Si está en modo edición
 * @param {Object} props.productoForm - Datos del formulario
 * @param {Object} props.errors - Errores de validación
 * @param {File} props.selectedFile - Archivo de imagen seleccionado
 * @param {boolean} props.saving - Si está guardando
 * @param {Function} props.onClose - Función para cerrar modal
 * @param {Function} props.onSave - Función para guardar
 * @param {Function} props.onFieldChange - Función para cambiar campos
 * @param {Function} props.onFileChange - Función para cambiar archivo
 * @param {boolean} props.darkMode - Si está en modo oscuro
 */
const ProductModal = ({
  visible,
  isEditing,
  productoForm,
  errors,
  selectedFile,
  saving,
  onClose,
  onSave,
  onFieldChange,
  onFileChange,
  darkMode
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-sm bg-black/30">
      <div className={`rounded-xl p-6 w-96 shadow-lg ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}>
        {/* Header del modal */}
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${
            darkMode ? "text-white" : "text-pink-600"
          }`}>
            {isEditing ? "Editar Producto" : "Agregar Producto"}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode 
                ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300" 
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Formulario del producto */}
        <ProductForm
          productoForm={productoForm}
          errors={errors}
          selectedFile={selectedFile}
          onFieldChange={onFieldChange}
          onFileChange={onFileChange}
          darkMode={darkMode}
        />
        
        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              darkMode 
                ? "border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50" 
                : "border-slate-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              darkMode 
                ? "bg-pink-600 hover:bg-pink-700 text-white" 
                : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;