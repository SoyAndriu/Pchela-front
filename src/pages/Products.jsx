import React, { useState, useMemo, useEffect } from "react";
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  XMarkIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/outline";

const API_BASE = "http://127.0.0.1:8000/api";
const getHeaders = (isFormData = false) => {
  const headers = {
    'Authorization': `Bearer ${localStorage.getItem("token")}`,
  };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

export default function Products({ darkMode }) {
  const [productos, setProductos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [productoForm, setProductoForm] = useState({ id: null, nombre: "", precio: "", cantidad: "", categoria: "", img: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre"); // nombre | precio | stock
  const [stockFilter, setStockFilter] = useState("todos"); // todos | bajo | sin | ok
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Mover fetchProducts fuera del useEffect para poder llamarlo desde otros lugares
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/productos/`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Error cargando productos");
      const data = await res.json();
      setProductos(data.results);
    } catch (error) {
      setApiError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (producto) => {
    setProductoForm({ ...producto });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setProductoForm({ id: null, nombre: "", precio: "", cantidad: "", categoria: "", img: "" });
    setIsEditing(false);
    setModalVisible(true);
  };

  const validate = () => {
    const e = {};
    if (!productoForm.nombre.trim()) e.nombre = "Requerido";
    if (productoForm.precio === "" || Number(productoForm.precio) <= 0) e.precio = "Precio inválido";
    if (productoForm.cantidad === "" || Number(productoForm.cantidad) < 0) e.cantidad = "Cantidad inválida";
    if (!productoForm.categoria.trim()) e.categoria = "Requerido";
    if (productoForm.img && !/^https?:\/\//.test(productoForm.img) && !productoForm.img.startsWith("/")) e.img = "URL inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `${API_BASE}/productos/${productoForm.id}/`
        : `${API_BASE}/productos/`;
      
      let res;
      if (selectedFile) {
        // Si hay imagen, enviar como FormData
        const payload = new FormData();
        payload.append("nombre", productoForm.nombre);
        payload.append("precio", productoForm.precio);
        payload.append("cantidad", productoForm.cantidad);
        payload.append("categoria", productoForm.categoria);
        payload.append("imagen", selectedFile);
        res = await fetch(url, {
          method,
          headers: getHeaders(true),
          body: payload,
        });
      } else {
        // Si no hay imagen, enviar como JSON
        const payload = {
          nombre: productoForm.nombre,
          precio: productoForm.precio,
          cantidad: productoForm.cantidad,
          categoria: productoForm.categoria,
          img: productoForm.img
        };
        res = await fetch(url, {
          method,
          headers: getHeaders(false),
          body: JSON.stringify(payload),
        });
      }
      
      if (!res.ok) throw new Error("Error guardando producto");
      const response = await res.json();
       // Ajuste para manejar diferentes estructuras de respuesta
      const saved = response.data || response;

      // Después de guardar, recargar productos desde la API
      await fetchProducts();

      setModalVisible(false);
      setErrors({});
    } catch (e) {
      alert("Error guardando el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      try {
        const res = await fetch(`${API_BASE}/productos/${id}/`, {
          method: "DELETE",
          headers: getHeaders(),
        });
        if (!res.ok) throw new Error("Error eliminando el producto");
        setProductos((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        alert("Error eliminando el producto");
      }
    }
  };

  const getStockStatus = (cantidad) => {
    if (cantidad === 0) return { color: "text-red-600", bg: "bg-red-100", text: "Sin stock" };
    if (cantidad < 10) return { color: "text-yellow-600", bg: "bg-yellow-100", text: "Stock bajo" };
    return { color: "text-green-600", bg: "bg-green-100", text: "En stock" };
  };

  // Filtrado + orden + stock + memo
  const filteredProducts = useMemo(() => {
    let list = (Array.isArray(productos) ? productos : []).filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    if (stockFilter !== "todos") {
      list = list.filter(p => {
        if (stockFilter === "sin") return p.cantidad === 0;
        if (stockFilter === "bajo") return p.cantidad > 0 && p.cantidad < 10;
        if (stockFilter === "ok") return p.cantidad >= 10;
        return true;
      });
    }
    list.sort((a,b) => {
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "precio") return b.precio - a.precio; // mayor precio primero
      if (sortBy === "stock") return b.cantidad - a.cantidad; // mayor stock primero
      return 0;
    });
    return list;
  }, [productos, searchTerm, stockFilter, sortBy]);

  const safeFilteredProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
  const totalPages = Math.ceil(safeFilteredProducts.length / pageSize) || 1;
  const currentPageProducts = safeFilteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const changePage = (dir) => setPage(p => Math.min(Math.max(1, p + dir), totalPages));

  // Estadísticas
  const safeProductos = Array.isArray(productos) ? productos : [];
  const totalProductos = safeProductos.length;
  const totalValor = safeProductos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const productosStockBajo = safeProductos.filter(p => p.cantidad < 10).length;

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      {/* Header con estadísticas */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingBagIcon className={`h-8 w-8 ${darkMode ? "text-pink-400" : "text-pink-600"}`} />
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>
            Productos de Cosmética
          </h2>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          <div className={`p-4 rounded-lg border ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
          }`}>
            <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
              Stock Bajo
            </h3>
            <p className={`text-2xl font-bold ${productosStockBajo > 0 ? "text-red-600" : (darkMode ? "text-green-400" : "text-green-600")}`}>
              {productosStockBajo}
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                darkMode 
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-white border-slate-200 placeholder-gray-500"
              }`}
            />
          </div>
          <div>
            <select
              value={stockFilter}
              onChange={(e)=>{setStockFilter(e.target.value); setPage(1);}}
              className={`w-full p-3 rounded-lg border text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-slate-200"}`}
            >
              <option value="todos">Stock: Todos</option>
              <option value="sin">Sin stock</option>
              <option value="bajo">Stock bajo</option>
              <option value="ok">Stock OK</option>
            </select>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e)=>setSortBy(e.target.value)}
              className={`w-full p-3 rounded-lg border text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-slate-200"}`}
            >
              <option value="nombre">Orden: Nombre</option>
              <option value="precio">Orden: Precio ↓</option>
              <option value="stock">Orden: Stock ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* LISTA DE PRODUCTOS */}
      <div className="grid gap-4 pb-20">
        {currentPageProducts.length > 0 ? (
          currentPageProducts.map((item) => {
            const stockStatus = getStockStatus(item.cantidad);
            return (
              <div
                key={item.id}
                className={`flex items-center rounded-xl shadow-sm p-4 border transition-shadow hover:shadow-md ${
                  darkMode 
                    ? "bg-gray-800 border-gray-700" 
                    : "bg-white border-slate-200"
                }`}
              >
                <img 
                  src={item.img} 
                  alt={item.nombre} 
                  className="w-16 h-16 object-cover rounded-lg mr-4 border border-slate-200" 
                />
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {item.nombre}
                  </h3>
                  <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>Precio: <span className="font-semibold">${item.precio.toLocaleString()}</span></p>
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Categoría: {item.categoria || "—"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Cantidad: {item.cantidad}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleEdit(item)} 
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? "text-pink-400 hover:bg-gray-700 hover:text-pink-300" 
                        : "text-pink-600 hover:bg-pink-50 hover:text-pink-700"
                    }`}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? "text-red-400 hover:bg-gray-700 hover:text-red-300" 
                        : "text-red-600 hover:bg-red-50 hover:text-red-700"
                    }`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            No se encontraron productos que coincidan con "{searchTerm}"
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between mt-6 text-sm">
        <span className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>{filteredProducts.length} resultados • Página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <button
            onClick={()=>changePage(-1)}
            disabled={page===1}
            className={`px-3 py-1 rounded border text-xs ${page===1 ? "opacity-40 cursor-not-allowed" : ""} ${darkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
          >Anterior</button>
          <button
            onClick={()=>changePage(1)}
            disabled={page===totalPages}
            className={`px-3 py-1 rounded border text-xs ${page===totalPages ? "opacity-40 cursor-not-allowed" : ""} ${darkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
          >Siguiente</button>
        </div>
      </div>

      {/* BOTÓN AGREGAR FLOTANTE */}
      <button
        onClick={handleAdd}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-colors ${
          darkMode 
            ? "bg-pink-600 hover:bg-pink-700 text-white" 
            : "bg-pink-500 hover:bg-pink-600 text-white"
        }`}
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      {/* MODAL */}
      {modalVisible && (
        <div className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-sm bg-black/30">
          <div className={`rounded-xl p-6 w-96 shadow-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${
                darkMode ? "text-white" : "text-pink-600"
              }`}>
                {isEditing ? "Editar Producto" : "Agregar Producto"}
              </h3>
              <button
                onClick={() => setModalVisible(false)}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode 
                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300" 
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-slate-300 placeholder-gray-500"
                }`}
                placeholder="Nombre del producto"
                value={productoForm.nombre}
                onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })}
              />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
              <input
                type="number"
                className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-slate-300 placeholder-gray-500"
                }`}
                placeholder="Precio"
                value={productoForm.precio}
                onChange={(e) => setProductoForm({ ...productoForm, precio: e.target.value })}
              />
              {errors.precio && <p className="text-xs text-red-500">{errors.precio}</p>}
              <input
                type="number"
                className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-slate-300 placeholder-gray-500"
                }`}
                placeholder="Cantidad"
                value={productoForm.cantidad}
                onChange={(e) => setProductoForm({ ...productoForm, cantidad: e.target.value })}
              />
              {errors.cantidad && <p className="text-xs text-red-500">{errors.cantidad}</p>}
              <input
                className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-slate-300 placeholder-gray-500"
                }`}
                placeholder="Categoría"
                value={productoForm.categoria}
                onChange={(e) => setProductoForm({ ...productoForm, categoria: e.target.value })}
              />
              {errors.categoria && <p className="text-xs text-red-500">{errors.categoria}</p>}
              {/* Zona Drag & Drop para imagen */}
              <div
                className={`w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors mb-2 ${
                  darkMode ? "border-pink-700 bg-gray-700 hover:bg-gray-600" : "border-pink-400 bg-pink-50 hover:bg-pink-100"
                }`}
                onClick={() => document.getElementById('fileInput').click()}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                {selectedFile ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Previsualización"
                    className="w-24 h-24 object-cover rounded mb-2"
                  />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" /></svg>
                    <span className={`text-sm ${darkMode ? "text-pink-300" : "text-pink-600"}`}>Arrastra una imagen aquí o haz clic para seleccionar</span>
                  </>
                )}
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
              {/* Input para URL de imagen opcional */}
              {errors.img && <p className="text-xs text-red-500">{errors.img}</p>}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalVisible(false)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-slate-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? "bg-pink-600 hover:bg-pink-700 text-white" 
                    : "bg-pink-500 hover:bg-pink-600 text-white"
                }`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
