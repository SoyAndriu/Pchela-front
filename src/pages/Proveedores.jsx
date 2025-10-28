import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import ProveedorModal from "../components/proveedores/ProveedorModal";
import useProveedores from "../hooks/useProveedores";
import { useAuth } from "../auth/AuthContext";
import { useAlert } from "../components/AlertProvider";

export default function Proveedores({ darkMode }) {
  // Navegación + contexto
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useAlert();

  const {
    proveedores,
    fetchProveedores,
    existsProveedor,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    inactivarProveedor,
    reactivarProveedor,
  } = useProveedores();

  const [verInactivos, setVerInactivos] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [proveedorAInactivar, setProveedorAInactivar] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const resetForm = () => {
    setProveedorEditando(null);
    setMostrarFormulario(false);
  };

  const normalize = (str) =>
    (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredProveedores = (Array.isArray(proveedores) ? proveedores : []).filter(
    (p) => {
      const raw = searchTerm.trim();
      const coincide = !raw
        ? true
        : normalize(p.nombre).includes(normalize(raw)) ||
          normalize(p.localidad).includes(normalize(raw)) ||
          normalize(p.contacto).includes(normalize(raw));
      return verInactivos ? coincide && !p.activo : coincide && (p.activo || p.activo === undefined);
    }
  );

  // EDITAR
  const handleEditar = (id) => {
    const proveedor = proveedores.find((p) => p.id === id);
    if (!proveedor) return alert("Proveedor no encontrado");
    setProveedorEditando(proveedor);
    setMostrarFormulario(true);
  };

  // ELIMINAR
  const handleEliminar = async (proveedor) => {
    const role = (user?.role || "").toUpperCase();
    const canDelete = ["GERENTE", "DUENO", "DUEÑO"].some((r) => role.includes(r));
    if (!canDelete) return alert("No tenés permisos para eliminar proveedores");

    const confirmed = await confirm(`¿Eliminar proveedor "${proveedor.nombre}"?`, {
      title: "Eliminar proveedor",
      confirmText: "Sí",
      cancelText: "Cancelar",
    });
    if (!confirmed) return;

    try {
      await deleteProveedor(proveedor.id);
      await confirm("Proveedor eliminado correctamente", { title: "OK" });
      fetchProveedores();
    } catch (e) {
      if ((e?.message || "").toLowerCase().includes("asociado")) {
        setProveedorAInactivar(proveedor);
      } else {
        alert(e?.message || "Error eliminando proveedor");
      }
    }
  };

  // INACTIVAR
  const handleInactivar = async (proveedor) => {
    const confirmed = await confirm(
      `No se puede eliminar "${proveedor.nombre}" porque tiene registros asociados. ¿Deseás inactivarlo?`,
      { title: "Inactivar proveedor", confirmText: "Sí", cancelText: "Cancelar" }
    );
    if (!confirmed) return;

    try {
      await inactivarProveedor(proveedor.id);
      await confirm("Proveedor inactivado correctamente", { title: "OK" });
      fetchProveedores();
    } catch (e) {
      alert(e?.message || "Error inactivando proveedor");
    } finally {
      setProveedorAInactivar(null);
    }
  };

  // REACTIVAR
  const handleReactivar = async (id) => {
    try {
      await reactivarProveedor(id);
      await confirm("Proveedor reactivado correctamente", { title: "OK" });
      fetchProveedores();
    } catch (e) {
      alert(e?.message || "Error reactivando proveedor");
    }
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            darkMode ? "border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ArrowLeftIcon className="h-4 w-4" /> Volver
        </button>
        <h1 className="text-2xl font-semibold">Gestión de Proveedores</h1>
        <div className="w-[90px]" />
      </header>

      {/* Acciones y búsqueda */}
      <div className={`rounded-xl border shadow-sm mb-6 p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <UserGroupIcon className={`h-6 w-6 ${darkMode ? "text-pink-400" : "text-pink-600"}`} />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full sm:w-80 p-2 rounded-lg border focus:ring-2 focus:ring-pink-500 transition-colors ${
                darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500"
              }`}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" /> Nuevo
            </button>
            <button
              onClick={() => setVerInactivos((v) => !v)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                darkMode ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {verInactivos ? "Ver Activos" : "Ver Inactivos"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className={`grid grid-cols-6 font-medium text-sm px-5 py-3 border-b ${darkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"}`}>
          <span>Nombre</span>
          <span>Localidad</span>
          <span>Contacto</span>
          <span>Teléfono</span>
          <span>Email</span>
          <span className="text-right">Acciones</span>
        </div>

        {filteredProveedores.length > 0 ? (
          filteredProveedores.map((p) => (
            <div
              key={p.id}
              className={`grid grid-cols-6 items-center text-sm px-5 py-3 border-t ${darkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50"} transition-colors`}
            >
              <span className="truncate font-medium">{p.nombre}</span>
              <span className="truncate">{p.localidad || '-'}</span>
              <span className="truncate">{p.contacto || '-'}</span>
              <span className="truncate">{p.telefono || '-'}</span>
              <span className="truncate">{p.email || '-'}</span>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleEditar(p.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm border ${darkMode ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"}`}
                >
                  <PencilIcon className="h-3 w-3" /> Editar
                </button>

                {!verInactivos && (
                  <button
                    onClick={() => handleEliminar(p)}
                    className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-500 hover:bg-red-600 text-white"
                  >
                    <TrashIcon className="h-3 w-3" /> Eliminar
                  </button>
                )}

                {verInactivos && (
                  <button
                    onClick={() => handleReactivar(p.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-green-500 hover:bg-green-600 text-white"
                  >
                    <PlusIcon className="h-3 w-3" /> Reactivar
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            {searchTerm
              ? `No se encontraron proveedores que coincidan con "${searchTerm}"`
              : "No hay proveedores registrados"}
          </div>
        )}
      </div>

      {/* Modal de alta/edición */}
      {mostrarFormulario && (
        <ProveedorModal
          visible={mostrarFormulario}
          onClose={resetForm}
          proveedor={proveedorEditando}
          darkMode={darkMode}
        />
      )}

      {/* Modal de inactivar si eliminación falla */}
      {proveedorAInactivar && handleInactivar(proveedorAInactivar)}
    </div>
  );
}
