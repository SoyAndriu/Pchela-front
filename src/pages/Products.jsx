// COMPONENTE PRINCIPAL DE PRODUCTOS

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import HistorialLotesModal from '../components/products/HistorialLotesModal';
// import useLotes from '../hooks/useLotes';
import { API_BASE } from '../config/productConfig';
import { apiFetch } from '../utils/productUtils';
import { useToast } from '../components/ToastProvider';

// Importar componente de categorías
import Categorias from './Categorias';
import Marcas from './Marcas';

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
    categoryFilter,
    marcaFilter,
    page,
    filteredProducts,
    currentPageProducts,
    totalPages,
    changePage,
    handleSearchChange,
    handleStockFilterChange,
    handleSortChange,
    handleCategoryFilterChange,
    handleMarcaFilterChange
  } = useProductFilters(productos);

  // Estado para controlar si se muestra la gestión de categorías
  const [showCategories, setShowCategories] = useState(false);
  const [showMarcas, setShowMarcas] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showHistorial, setShowHistorial] = useState(false);
  const [productoHistorial, setProductoHistorial] = useState(null);
  const toast = useToast();

  // const { createLote } = useLotes();

  // Recalcular stocks desde lotes (sincronizar con backend)
  const recalcStocks = async () => {
    try {
      // Recorremos productos actuales en la página filtrada (o todos)
      const targets = filteredProducts.length ? filteredProducts : productos;
      for (const p of targets) {
        // Obtener lotes del producto
        const res = await apiFetch(`${API_BASE}/lotes/?producto=${p.id}`);
        if (!res.ok) continue;
        const data = await res.json();
        const lotes = Array.isArray(data.results) ? data.results : data;
        const total = lotes.reduce((s, l) => s + Number(l.cantidad_disponible || 0), 0);
        // Sincronizar cantidad con PATCH del producto (si el backend la persiste)
        await apiFetch(`${API_BASE}/productos/${p.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ cantidad: total })
        });
      }
      // Refrescar lista
      await fetchProducts();
      toast.success('Stocks recalculados desde lotes');
    } catch {
      toast.error('Error recalculando stocks');
    }
  };

  // EFECTOS
  
  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Aplicar filtros iniciales si vienen desde navegación (p.ej., stock bajo desde Dashboard)
  useEffect(() => {
    const state = location?.state || {};
    if (state.stockFilter) {
      handleStockFilterChange(state.stockFilter);
    }
    // limpiar state para no re-aplicar al volver
    if (state.stockFilter) {
      navigate('.', { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MANEJADORES DE EVENTOS
  
  const handleSaveProduct = async () => {
    // Validación de precio
    if (productoForm.precio === undefined || productoForm.precio === null || Number(productoForm.precio) <= 0) {
      toast.error('El precio de venta debe ser mayor a cero.');
      return false;
    }
    // Validación de nombre
    if (!productoForm.nombre || !productoForm.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio.');
      return false;
    }
    // Validación de categoría
    if (!productoForm.categoria_id) {
      toast.error('Selecciona una categoría.');
      return false;
    }
    // Validación de marca
    if (!productoForm.marca_id) {
      toast.error('Selecciona una marca.');
      return false;
    }
    const success = await handleSave(saveProduct);
    return success;
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
    } catch {
      toast.error('Error eliminando el producto');
    }
  };

  // RENDERIZADO

  // Si se está mostrando la vista de categorías, renderizar componente de categorías
  if (showCategories) {
    return <Categorias darkMode={darkMode} onBack={() => setShowCategories(false)} />;
  }
  if (showMarcas) {
    return <Marcas darkMode={darkMode} onBack={() => setShowMarcas(false)} />;
  }

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      {/* Estadísticas de productos con botón de categorías */}
      <ProductStats 
        productos={productos} 
        darkMode={darkMode} 
        onManageCategories={() => setShowCategories(true)}
        onManageMarcas={() => setShowMarcas(true)}
        onRecalcStocks={recalcStocks}
      />

      {/* Acceso a marcas se movió al header */}

      {/* Filtros y búsqueda */}
      <ProductFilters
        searchTerm={searchTerm}
        stockFilter={stockFilter}
        sortBy={sortBy}
        categoryFilter={categoryFilter}
        marcaFilter={marcaFilter}
        onSearchChange={handleSearchChange}
        onStockFilterChange={handleStockFilterChange}
        onSortChange={handleSortChange}
        onCategoryFilterChange={handleCategoryFilterChange}
        onMarcaFilterChange={handleMarcaFilterChange}
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
                  onIngresoStock={(prod) => {
                    // Redirigir a Compras con el producto preseleccionado
                    navigate('/gerente/compras', { state: { productId: prod.id } });
                  }}
                  onVerLotes={(prod) => { setProductoHistorial(prod); setShowHistorial(true); }}
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
        existingProducts={productos}
      />

      {/* ModalIngresoStock eliminado: ahora flujo va a Compras */}

      <HistorialLotesModal
        visible={showHistorial}
        onClose={() => { setShowHistorial(false); setProductoHistorial(null); fetchProducts(); }}
        producto={productoHistorial}
        darkMode={darkMode}
        onAfterChange={() => fetchProducts()}
      />
    </div>
  );
}