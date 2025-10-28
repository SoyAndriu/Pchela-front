// COMPONENTE PRINCIPAL DE PRODUCTOS

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from "@heroicons/react/24/outline";

// Hooks personalizados
import { useProducts, useProductForm, useProductFilters } from '../hooks';

// Componentes
import {
  ProductStats,
  ProductFilters,
  ProductCard,
  ProductModal,
  ProductPagination
} from '../components/products';
import HistorialLotesModal from '../components/products/HistorialLotesModal';
import { API_BASE } from '../config/productConfig';
import { getHeaders } from '../utils/productUtils';
import { useToast } from '../components/ToastProvider';
import { useAlert } from '../components/AlertProvider';

// Componentes de categorías y marcas
import Categorias from './Categorias';
import Marcas from './Marcas';

export default function Products({ darkMode }) {
  const { confirm } = useAlert();
  const toast = useToast();
  const navigate = useNavigate();

  // Datos de productos
  const { productos, loading, apiError, fetchProducts, saveProduct, deleteProduct } = useProducts();

  // Formulario de producto
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

  // Filtros y paginación
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

  // Estados locales
  const [showCategories, setShowCategories] = useState(false);
  const [showMarcas, setShowMarcas] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [productoHistorial, setProductoHistorial] = useState(null);

  // Recalcular stocks desde lotes
  const recalcStocks = async () => {
    try {
      const targets = filteredProducts.length ? filteredProducts : productos;
      for (const p of targets) {
        const res = await fetch(`${API_BASE}/lotes/?producto=${p.id}`, { headers: getHeaders() });
        if (!res.ok) continue;
        const data = await res.json();
        const lotes = Array.isArray(data.results) ? data.results : data;
        const total = lotes.reduce((s, l) => s + Number(l.cantidad_disponible || 0), 0);
        await fetch(`${API_BASE}/productos/${p.id}/`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ cantidad: total })
        });
      }
      await fetchProducts();
      toast.success('Stocks recalculados desde lotes');
    } catch {
      toast.error('Error recalculando stocks');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaveProduct = async () => {
    return await handleSave(saveProduct);
  };

  // Eliminación con confirmación
  const handleDeleteProduct = async (producto) => {
    const confirmed = await confirm(
      `¿Seguro que deseas eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`,
      { title: "Eliminar producto", confirmText: "Eliminar", cancelText: "Cancelar" }
    );

    if (confirmed) {
      try {
        await deleteProduct(producto.id);
        toast.success(`Producto "${producto.nombre}" eliminado`);
      } catch (err) {
        toast.error(`Error eliminando el producto: ${err.message || err}`);
      }
    }
  };

  // Renderizado condicional para categorías y marcas
  if (showCategories) return <Categorias darkMode={darkMode} onBack={() => setShowCategories(false)} />;
  if (showMarcas) return <Marcas darkMode={darkMode} onBack={() => setShowMarcas(false)} />;

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      <ProductStats 
        productos={productos} 
        darkMode={darkMode} 
        onManageCategories={() => setShowCategories(true)}
        onManageMarcas={() => setShowMarcas(true)}
        onRecalcStocks={recalcStocks}
      />

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

      {apiError && (
        <div className="p-4 text-red-600 bg-red-100 rounded-md mb-4">{apiError}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <svg className="w-8 h-8 text-gray-200 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"/>
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
                  onDelete={() => handleDeleteProduct(item)}
                  onIngresoStock={(prod) => navigate('/gerente/compras', { state: { productId: prod.id } })}
                  onVerLotes={(prod) => { setProductoHistorial(prod); setShowHistorial(true); }}
                  darkMode={darkMode}
                />
              ))
            )}
          </div>

          <ProductPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            onPageChange={changePage}
            darkMode={darkMode}
          />
        </div>
      )}

      <button
        onClick={handleAdd}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-colors ${darkMode ? "bg-pink-600 hover:bg-pink-700 text-white" : "bg-pink-500 hover:bg-pink-600 text-white"}`}
        aria-label="Agregar producto"
      >
        <PlusIcon className="h-7 w-7" />
      </button>

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
