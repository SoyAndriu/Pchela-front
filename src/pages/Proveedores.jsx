import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon, 
  TruckIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  XMarkIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";

export default function Proveedores({ darkMode }) {
  const navigate = useNavigate();

  // Estado para proveedores
  const [proveedores, setProveedores] = useState([
    { 
      id: 1, 
      nombre: "Distribuidora Belleza Total", 
      localidad: "Buenos Aires", 
      telefono: "11-1234-5678", 
      direccion: "Av. Corrientes 1234",
      email: "ventas@bellezatotal.com"
    },
    { 
      id: 2, 
      nombre: "Cosméticos del Norte", 
      localidad: "Córdoba", 
      telefono: "351-9876-5432", 
      direccion: "San Martín 456",
      email: "contacto@cosmeticosnorte.com"
    },
    { 
      id: 3, 
      nombre: "Perfumería Central", 
      localidad: "Rosario", 
      telefono: "341-5555-7890", 
      direccion: "Pellegrini 789",
      email: "info@perfumeriacentral.com"
    },
  ]);

  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: "",
    localidad: "",
    telefono: "",
    direccion: "",
    email: "",
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Agregar proveedor
  const handleAgregar = () => {
    if (!nuevoProveedor.nombre || !nuevoProveedor.localidad) {
      alert("Por favor completa al menos el nombre y la localidad");
      return;
    }
    const id = Math.max(...proveedores.map(p => p.id), 0) + 1;
    setProveedores([...proveedores, { id, ...nuevoProveedor }]);
    resetForm();
  };

  // Editar proveedor
  const handleEditar = (id) => {
    const proveedor = proveedores.find((p) => p.id === id);
    setProveedorEditando(proveedor);
    setNuevoProveedor(proveedor);
    setModoEdicion(true);
    setMostrarFormulario(true);
  };

  const handleGuardarEdicion = () => {
    if (!nuevoProveedor.nombre || !nuevoProveedor.localidad) {
      alert("Por favor completa al menos el nombre y la localidad");
      return;
    }
    setProveedores(
      proveedores.map((p) =>
        p.id === proveedorEditando.id ? { ...proveedorEditando, ...nuevoProveedor } : p
      )
    );
    resetForm();
  };

  // Eliminar proveedor
  const handleEliminar = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este proveedor?")) {
      setProveedores(proveedores.filter((p) => p.id !== id));
    }
  };

  const resetForm = () => {
    setModoEdicion(false);
    setProveedorEditando(null);
    setNuevoProveedor({ nombre: "", localidad: "", telefono: "", direccion: "", email: "" });
    setMostrarFormulario(false);
  };

  // Filtrar proveedores
  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.localidad.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Gestión de Proveedores
        </h1>
        <div className="w-[90px]" />
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-pink-600"}`}>
            Total Proveedores
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-700"}`}>
            {proveedores.length}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-pink-600"}`}>
            Localidades
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-700"}`}>
            {new Set(proveedores.map(p => p.localidad)).size}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
        }`}>
          <h3 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-pink-600"}`}>
            Con Email
          </h3>
          <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-700"}`}>
            {proveedores.filter(p => p.email).length}
          </p>
        </div>
      </div>

      {/* Tarjeta principal */}
      <div className={`rounded-lg border shadow-sm mb-6 ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
      }`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TruckIcon className={`h-6 w-6 ${darkMode ? "text-pink-400" : "text-pink-600"}`} />
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
              Gestión de Proveedores
            </h2>
          </div>
          <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Administra aquí tus proveedores: Nombre, Localidad, Teléfono, Dirección y Email.
          </p>
          
          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar proveedores..."
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
            Agregar Proveedor
          </button>
        </div>
      </div>

      {/* Lista de proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProveedores.length > 0 ? (
          filteredProveedores.map((proveedor) => (
            <div 
              key={proveedor.id} 
              className={`rounded-lg border shadow-sm transition-shadow hover:shadow-md ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-pink-100"
              }`}
            >
              <div className="p-4">
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? "text-pink-400" : "text-pink-600"}`}>
                  {proveedor.nombre}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {proveedor.localidad}
                    </span>
                  </div>
                  
                  {proveedor.telefono && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                      <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {proveedor.telefono}
                      </span>
                    </div>
                  )}
                  
                  {proveedor.direccion && (
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className={`h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                      <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {proveedor.direccion}
                      </span>
                    </div>
                  )}

                  {proveedor.email && (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        📧 {proveedor.email}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditar(proveedor.id)}
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
                    onClick={() => handleEliminar(proveedor.id)}
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
            {searchTerm ? `No se encontraron proveedores que coincidan con "${searchTerm}"` : "No hay proveedores registrados"}
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
                {modoEdicion ? "Editar Proveedor" : "Agregar Proveedor"}
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
                type="text"
                placeholder="Nombre del proveedor *"
                value={nuevoProveedor.nombre}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Localidad *"
                value={nuevoProveedor.localidad}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, localidad: e.target.value })}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={nuevoProveedor.telefono}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, telefono: e.target.value })}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Dirección"
                value={nuevoProveedor.direccion}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, direccion: e.target.value })}
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-pink-200 placeholder-gray-500"
                }`}
              />
              <input
                type="email"
                placeholder="Email"
                value={nuevoProveedor.email}
                onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, email: e.target.value })}
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
                {modoEdicion ? "Guardar Cambios" : "Agregar"}
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