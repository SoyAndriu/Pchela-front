import React, { useState } from "react";
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  XMarkIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/outline";

export default function Products({ darkMode }) {
  const [productos, setProductos] = useState([
    { id: 1, nombre: "Labial Rouge", precio: 25000, cantidad: 20, img: "/assets/tijerita.jpg" },
    { id: 2, nombre: "Base Líquida", precio: 35000, cantidad: 50, img: "/assets/limas.jpg" },
    { id: 3, nombre: "Máscara de Pestañas", precio: 18000, cantidad: 10, img: "/assets/pinzaexpert.jpg" },
    { id: 4, nombre: "Perfume Floral", precio: 65000, cantidad: 15, img: "/assets/muchas.jpg" },
    { id: 5, nombre: "Crema Facial", precio: 45000, cantidad: 30, img: "/assets/pinzas.jpg" },
    { id: 6, nombre: "Desmaquillante", precio: 22000, cantidad: 25, img: "/assets/fondo.jpg" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [productoForm, setProductoForm] = useState({ id: null, nombre: "", precio: "", cantidad: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEdit = (producto) => {
    setProductoForm({ ...producto });
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setProductoForm({ id: null, nombre: "", precio: "", cantidad: "" });
    setIsEditing(false);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!productoForm.nombre || !productoForm.precio || !productoForm.cantidad) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (isEditing) {
      setProductos((prev) => prev.map((p) => (p.id === productoForm.id ? productoForm : p)));
    } else {
      const newProduct = {
        ...productoForm,
        id: productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1,
        img: "/assets/fondo.jpg",
      };
      setProductos((prev) => [...prev, newProduct]);
    }
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      setProductos((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const getStockStatus = (cantidad) => {
    if (cantidad === 0) return { color: "text-red-600", bg: "bg-red-100", text: "Sin stock" };
    if (cantidad < 10) return { color: "text-yellow-600", bg: "bg-yellow-100", text: "Stock bajo" };
    return { color: "text-green-600", bg: "bg-green-100", text: "En stock" };
  };

  // Filtrar productos por búsqueda
  const filteredProducts = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas
  const totalProductos = productos.length;
  const totalValor = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  const productosStockBajo = productos.filter(p => p.cantidad < 10).length;

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

        {/* Buscador */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
              darkMode 
                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400" 
                : "bg-white border-slate-200 placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      {/* LISTA DE PRODUCTOS */}
      <div className="grid gap-4 pb-20">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item) => {
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
                  <p className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Precio: <span className="font-semibold">${item.precio.toLocaleString()}</span>
                  </p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
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
              <input
                type="number"
                className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-slate-300 placeholder-gray-500"
                }`}
                placeholder="Precio"
                value={productoForm.precio}
                onChange={(e) => setProductoForm({ ...productoForm, precio: Number(e.target.value) })}
              />
              <input
                type="number"
                className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-slate-300 placeholder-gray-500"
                }`}
                placeholder="Cantidad"
                value={productoForm.cantidad}
                onChange={(e) => setProductoForm({ ...productoForm, cantidad: Number(e.target.value) })}
              />
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
