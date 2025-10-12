import React, { useState } from "react";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  TagIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import useCategories from "../hooks/useCategories";
import { useToast } from "../components/ToastProvider";

export default function Categorias({ darkMode, onBack }) {
  const toast = useToast();
  // Hook para manejar categorías
  const { 
    categories, 
    loading, 
    error, 
    createCategory, 
    updateCategory, 
    deleteCategory 
  } = useCategories();

  // Estados del formulario
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: null, nombre: "", descripcion: "" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // FUNCIONES DEL FORMULARIO

  const openAddModal = () => {
    setCategoryForm({ id: null, nombre: "", descripcion: "" });
    setIsEditing(false);
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = (category) => {
    setCategoryForm({ 
      id: category.id, 
      nombre: category.nombre, 
      descripcion: category.descripcion || "" 
    });
    setIsEditing(true);
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCategoryForm({ id: null, nombre: "", descripcion: "" });
    setFormErrors({});
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!categoryForm.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    }
    
    if (categoryForm.nombre.length > 100) {
      errors.nombre = "El nombre no puede exceder 100 caracteres";
    }

    // Validación de duplicados (case-insensitive, ignora espacios extra); excluye el mismo en edición
    const normalizeName = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
    const nombreNorm = normalizeName(categoryForm.nombre);
    const isDuplicate = categories.some(c => normalizeName(c?.nombre) === nombreNorm && (!isEditing || c.id !== categoryForm.id));
    if (!errors.nombre && isDuplicate) {
      errors.nombre = 'La categoría ya existe';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar categoría
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      if (isEditing) {
        await updateCategory(categoryForm.id, {
          nombre: categoryForm.nombre,
          descripcion: categoryForm.descripcion
        });
        toast.success('Categoría editada');
      } else {
        await createCategory({
          nombre: categoryForm.nombre,
          descripcion: categoryForm.descripcion
        });
        toast.success('Categoría creada');
      }
      
      closeModal();
    } catch (err) {
      toast.error(`Error ${isEditing ? 'editando' : 'creando'} la categoría: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar categoría
  const handleDelete = async (category) => {
    if (window.confirm(`¿Seguro que deseas eliminar la categoría "${category.nombre}"?`)) {
      try {
        await deleteCategory(category.id);
        toast.success('Categoría eliminada');
      } catch (err) {
        toast.error(`Error eliminando la categoría: ${err.message}`);
      }
    }
  };

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {/* Botón de regreso */}
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? "text-gray-400 hover:text-white hover:bg-gray-700" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title="Volver a productos"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
          )}
          <TagIcon className={`w-8 h-8 ${darkMode ? "text-pink-400" : "text-pink-600"}`} />
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Gestión de Categorías
          </h1>
        </div>
        
        <button
          onClick={openAddModal}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            darkMode 
              ? "bg-pink-600 text-white hover:bg-pink-700" 
              : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          <PlusIcon className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      {/* Error de API */}
      {error && (
        <div className="p-4 text-red-600 bg-red-100 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Lista de categorías */}
      <div className={`rounded-lg shadow-sm border ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className={`mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Cargando categorías...
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center">
            <TagIcon className={`w-16 h-16 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
            <p className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              No hay categorías registradas
            </p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Crea tu primera categoría haciendo clic en "Nueva Categoría"
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category.id} className={`p-4 hover:bg-opacity-50 transition-colors ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {category.nombre}
                    </h3>
                    {category.descripcion && (
                      <p className={`mt-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {category.descripcion}
                      </p>
                    )}
                    <p className={`mt-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      ID: {category.id}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(category)}
                      className={`p-2 rounded transition-colors ${
                        darkMode 
                          ? "text-blue-400 hover:bg-blue-900/30" 
                          : "text-blue-600 hover:bg-blue-50"
                      }`}
                      title="Editar categoría"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(category)}
                      className={`p-2 rounded transition-colors ${
                        darkMode 
                          ? "text-red-400 hover:bg-red-900/30" 
                          : "text-red-600 hover:bg-red-50"
                      }`}
                      title="Eliminar categoría"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {modalVisible && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
          <div className={`rounded-lg p-6 w-full max-w-md mx-4 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {isEditing ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button
                onClick={closeModal}
                className={`p-1 rounded ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={categoryForm.nombre}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nombre: e.target.value })}
                  className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                    darkMode 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-white border-gray-300 placeholder-gray-500"
                  }`}
                  placeholder="Ej: Herramientas, Cosméticos, etc."
                  maxLength={100}
                />
                {formErrors.nombre && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={categoryForm.descripcion}
                  onChange={(e) => setCategoryForm({ ...categoryForm, descripcion: e.target.value })}
                  className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                    darkMode 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-white border-gray-300 placeholder-gray-500"
                  }`}
                  placeholder="Descripción de la categoría..."
                  rows={3}
                  maxLength={255}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    darkMode 
                      ? "bg-pink-600 text-white hover:bg-pink-700" 
                      : "bg-pink-500 text-white hover:bg-pink-600"
                  } disabled:opacity-50`}
                >
                  {saving ? "Guardando..." : (isEditing ? "Actualizar" : "Crear")}
                </button>
                
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? "bg-gray-600 text-white hover:bg-gray-700" 
                      : "bg-gray-400 text-white hover:bg-gray-500"
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}