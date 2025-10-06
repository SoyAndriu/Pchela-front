// COMPONENTE PRINCIPAL DE PRODUCTOS

import React, { useEffect, useState } from 'react';
import { PlusIcon, TagIcon } from "@heroicons/react/24/outline";

// Importar hooks personalizados
import { useProducts, useProductForm, useProductFilters } from '../hooks';

// Importar componentes
import {
  ProductStats,
  ProductFilters,
  ProductCard,
  ProductModal,
  ProductPagination
} from '../components/products';

// Importar componente de categorías
import Categorias from './Categorias';

/**
 * Componente principal para gestionar productos
 * @param {Object} props - Props del componente
 * @param {boolean} props.darkMode - Si está en modo oscuro
 */
export default function Products({ darkMode }) {
  // HOOKS PERSONALIZADOS
  
  // Hook para manejar datos de productos (API)
  const { productos, loading, apiError, fetchProducts, saveProduct, deleteProduct } = useProducts();
  
  // Hook para manejar el formulario de productos
  const {
    modalVisible,
    productoForm,
    isEditing,
    errors,
    selectedFile,
    saving,
    setSelectedFile,
    handleEdit,
    handleAdd,
    closeModal,
    handleSave,
    updateField
  } = useProductForm();
  
  // Hook para manejar filtros y paginación
  const {
    searchTerm,
    sortBy,
    stockFilter,
    page,
    filteredProducts,
    currentPageProducts,
    totalPages,
    changePage,
    handleSearchChange,
    handleStockFilterChange,
    handleSortChange
  } = useProductFilters(productos);

  // Estado para controlar si se muestra la gestión de categorías
  const [showCategories, setShowCategories] = useState(false);

  // EFECTOS
  
  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // MANEJADORES DE EVENTOS
  
  const handleSaveProduct = async () => {
    const success = await handleSave(saveProduct);
    return success;
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
    } catch (error) {
      alert("Error eliminando el producto");
    }
  };

  // RENDERIZADO

  // Si se está mostrando la vista de categorías, renderizar componente de categorías
  if (showCategories) {
    return <Categorias darkMode={darkMode} onBack={() => setShowCategories(false)} />;
  }

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      {/* Estadísticas de productos con botón de categorías */}
      <ProductStats 
        productos={productos} 
        darkMode={darkMode} 
        onManageCategories={() => setShowCategories(true)}
      />

      {/* Filtros y búsqueda */}
      <ProductFilters
        searchTerm={searchTerm}
        stockFilter={stockFilter}
        sortBy={sortBy}
        onSearchChange={handleSearchChange}
        onStockFilterChange={handleStockFilterChange}
        onSortChange={handleSortChange}
        darkMode={darkMode}
      />

      {/* Mensaje de error de API */}
      {apiError && (
        <div className="p-4 text-red-600 bg-red-100 rounded-md mb-4">
          {apiError}
        </div>
      )}

      {/* Lista de productos */}
      {loading ? (
        <div className="flex justify-center py-4">
          <svg 
            className="w-8 h-8 text-gray-200 animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"
            />
          </svg>
        </div>
      ) : (
        <div>
          <div className="grid gap-4 pb-20">
            {currentPageProducts.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No se encontraron productos que coincidan con "{searchTerm}"
              </div>
            ) : (
              currentPageProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDeleteProduct}
                  darkMode={darkMode}
                />
              ))
            )}
          </div>

          {/* Paginación */}
          <ProductPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            onPageChange={changePage}
            darkMode={darkMode}
          />
        </div>
      )}

      {/* Botón flotante para agregar */}
      <button
        onClick={handleAdd}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-colors ${
          darkMode 
            ? "bg-pink-600 hover:bg-pink-700 text-white" 
            : "bg-pink-500 hover:bg-pink-600 text-white"
        }`}
        aria-label="Agregar producto"
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      {/* Modal de producto */}
      <ProductModal
        visible={modalVisible}
        isEditing={isEditing}
        productoForm={productoForm}
        errors={errors}
        selectedFile={selectedFile}
        saving={saving}
        onClose={closeModal}
        onSave={handleSaveProduct}
        onFieldChange={updateField}
        onFileChange={setSelectedFile}
        darkMode={darkMode}
      />
    </div>
  );
}