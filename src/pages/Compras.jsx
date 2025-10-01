import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon, 
  ShoppingCartIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserIcon,
  TruckIcon
} from "@heroicons/react/24/outline";

export default function Compras({ darkMode }) {
  const navigate = useNavigate();

  // Estado de compras mockeadas con datos de cosmética
  const [compras, setCompras] = useState([
    {
      id: 1,
      monto_total: 125000,
      fecha_compra: "2025-09-29",
      proveedor: "Distribuidora Belleza Total",
      usuario: "María García",
      productos: "Labiales, Bases, Máscaras",
      cantidad_items: 25
    },
    {
      id: 2,
      monto_total: 78000,
      fecha_compra: "2025-09-28",
      proveedor: "Cosméticos del Norte",
      usuario: "Ana López",
      productos: "Perfumes, Cremas faciales",
      cantidad_items: 15
    },
    {
      id: 3,
      monto_total: 95500,
      fecha_compra: "2025-09-27",
      proveedor: "Perfumería Central",
      usuario: "Carlos Ruiz",
      productos: "Desmaquillantes, Tónicos",
      cantidad_items: 20
    },
  ]);

  const [nuevaCompra, setNuevaCompra] = useState({
    monto_total: "",
    proveedor: "",
    usuario: "",
    productos: "",
    cantidad_items: ""
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [compraEditando, setCompraEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Agregar compra
  const handleAgregar = () => {
    if (!nuevaCompra.monto_total || !nuevaCompra.proveedor || !nuevaCompra.usuario) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    const id = Math.max(...compras.map(c => c.id), 0) + 1;
    const fecha = new Date().toISOString().split("T")[0];
    setCompras([...compras, { 
      id, 
      fecha_compra: fecha, 
      ...nuevaCompra,
      monto_total: parseFloat(nuevaCompra.monto_total),
      cantidad_items: parseInt(nuevaCompra.cantidad_items) || 0
    }]);
    resetForm();
  };

  // Editar compra
  const handleEditar = (id) => {
    const compra = compras.find((c) => c.id === id);
    setCompraEditando(compra);
    setNuevaCompra(compra);
    setModoEdicion(true);
    setMostrarFormulario(true);
  };

  const handleGuardarEdicion = () => {
    if (!nuevaCompra.monto_total || !nuevaCompra.proveedor || !nuevaCompra.usuario) {
      alert("Por favor completa los campos obligatorios");
      return;
    }
    setCompras(
      compras.map((c) =>
        c.id === compraEditando.id ? { 
          ...compraEditando, 
          ...nuevaCompra,
          monto_total: parseFloat(nuevaCompra.monto_total),
          cantidad_items: parseInt(nuevaCompra.cantidad_items) || 0
        } : c
      )
    );
    resetForm();
  };

  // Eliminar compra
  const handleEliminar = (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta compra?")) {
      setCompras(compras.filter((c) => c.id !== id));
    }
  };

  const resetForm = () => {
    setModoEdicion(false);
    setCompraEditando(null);
    setNuevaCompra({ monto_total: "", proveedor: "", usuario: "", productos: "", cantidad_items: "" });
    setMostrarFormulario(false);
  };

  // Filtrar compras
  const filteredCompras = compras.filter(compra =>
    compra.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compra.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (compra.productos && compra.productos.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Estadísticas
  const totalCompras = compras.length;
  const montoTotal = compras.reduce((sum, c) => sum + c.monto_total, 0);
  const promedioCompra = totalCompras > 0 ? montoTotal / totalCompras : 0;
  const proveedoresUnicos = new Set(compras.map(c => c.proveedor)).size;

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            darkMode 
              ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600" 
              : "border-pink-200 bg-white text-pink-700 hover:bg-pink-50"
          }`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>
          Gestión de Compras
        </h1>
        <div className="w-[90px]" />
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-pink-600"}`}>
            Total Compras
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-700"}`}>
            {totalCompras}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-pink-600"}`}>
            Monto Total
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-700"}`}>
            ${montoTotal.toLocaleString()}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-pink-600"}`}>
            Promedio por Compra
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-700"}`}>
            ${Math.round(promedioCompra).toLocaleString()}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-pink-600"}`}>
            Proveedores Activos
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-700"}`}>
            {proveedoresUnicos}
          </p>
        </div>
      </div>

      {/* Tarjeta principal */}
      <div className={`rounded-lg border shadow-sm mb-6 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
      }`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCartIcon className={`h-6 w-6 ${darkMode ? "text-pink-400" : "text-pink-600"}`} />
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
              Gestión de Compras
            </h2>
          </div>
          <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Administra las compras registradas: Monto, Proveedor, Usuario, Productos y Fecha.
          </p>

          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por proveedor, usuario o productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                darkMode 
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                  : "bg-white border-pink-200 placeholder-gray-500"
              }`}
            />
          </div>
          
          <button
            onClick={() => setMostrarFormulario(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              darkMode 
                ? "bg-pink-600 hover:bg-pink-700 text-white" 
                : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            <PlusIcon className="h-4 w-4" />
            Registrar Compra
          </button>
        </div>
      </div>

      {/* Lista de compras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompras.length > 0 ? (
          filteredCompras.map((compra) => (
            <div 
              key={compra.id} 
              className={`rounded-lg border shadow-sm transition-shadow hover:shadow-md ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
              }`}
            >
              <div className="p-4">
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? "text-pink-400" : "text-pink-600"}`}>
                  Compra #{compra.id}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <span className={`text-sm font-semibold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                      ${compra.monto_total.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {compra.fecha_compra}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TruckIcon className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {compra.proveedor}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <UserIcon className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {compra.usuario}
                    </span>
                  </div>

                  {compra.productos && (
                    <div className="mt-2 p-2 rounded bg-pink-50 dark:bg-gray-700">
                      <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Productos: {compra.productos}
                      </span>
                      {compra.cantidad_items && (
                        <span className={`block text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {compra.cantidad_items} items
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditar(compra.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                      darkMode 
                        ? "border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600" 
                        : "border border-pink-200 bg-white text-pink-700 hover:bg-pink-50"
                    }`}
                  >
                    <PencilIcon className="h-3 w-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(compra.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                      darkMode 
                        ? "bg-red-600 text-white hover:bg-red-700" 
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    <TrashIcon className="h-3 w-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={`col-span-full text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {searchTerm ? `No se encontraron compras que coincidan con "${searchTerm}"` : "No hay compras registradas"}
          </div>
        )}
      </div>

      {/* Formulario modal */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`rounded-lg shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>
                {modoEdicion ? "Editar Compra" : "Registrar Compra"}
              </h2>
              <button
                onClick={resetForm}
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
                type="number"
                step="0.01"
                placeholder="Monto Total *"
                value={nuevaCompra.monto_total}
                onChange={(e) =>
                  setNuevaCompra({ ...nuevaCompra, monto_total: e.target.value })
                }
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Proveedor *"
                value={nuevaCompra.proveedor}
                onChange={(e) =>
                  setNuevaCompra({ ...nuevaCompra, proveedor: e.target.value })
                }
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Usuario responsable *"
                value={nuevaCompra.usuario}
                onChange={(e) =>
                  setNuevaCompra({ ...nuevaCompra, usuario: e.target.value })
                }
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Productos adquiridos"
                value={nuevaCompra.productos}
                onChange={(e) =>
                  setNuevaCompra({ ...nuevaCompra, productos: e.target.value })
                }
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
              <input
                type="number"
                placeholder="Cantidad de items"
                value={nuevaCompra.cantidad_items}
                onChange={(e) =>
                  setNuevaCompra({ ...nuevaCompra, cantidad_items: e.target.value })
                }
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-pink-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={modoEdicion ? handleGuardarEdicion : handleAgregar}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? "bg-pink-600 hover:bg-pink-700 text-white" 
                    : "bg-pink-500 hover:bg-pink-600 text-white"
                }`}
              >
                {modoEdicion ? "Guardar Cambios" : "Registrar"}
              </button>
            </div>

            <p className={`text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              * Campos obligatorios
            </p>
          </div>
        </div>
      )}
    </div>
  );
}