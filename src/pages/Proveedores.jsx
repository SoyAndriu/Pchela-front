import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  TruckIcon,
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
import { useToast } from "../components/ToastProvider";

export default function Proveedores({ darkMode }) {
  // Navegación + contexto
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  // Estados para modales
  const [mostrarModalConfirmarEliminar, setMostrarModalConfirmarEliminar] = useState(false);
  const [proveedorAConfirmarEliminar, setProveedorAConfirmarEliminar] = useState(null);

  const [mostrarModalInactivar, setMostrarModalInactivar] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  // Hook de proveedores
  const {
    proveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    fetchProveedores,
    existsProveedor,
    inactivarProveedor,
    reactivarProveedor,
  } = useProveedores();

  // Estados de UI
  const [verInactivos, setVerInactivos] = useState(false);
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

  // Cargar lista
  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const resetForm = () => {
    setModoEdicion(false);
    setProveedorEditando(null);
    setNuevoProveedor({ nombre: "", localidad: "", telefono: "", direccion: "", email: "" });
    setMostrarFormulario(false);
  };

  // Normalizar (quita acentos y case-insensitive)
  const normalize = (str) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // FILTRO: solo por NOMBRE o CUIL
  const filteredProveedores = (Array.isArray(proveedores) ? proveedores : []).filter((p) => {
    const raw = searchTerm.trim();
    if (!raw) {
      return verInactivos ? p.activo === false : (p.activo === true || p.activo === undefined);
    }

    const textNorm = normalize(raw);
    const nameNorm = normalize(p.nombre);
    const cuilDigits = p.cuil ? String(p.cuil).replace(/\D+/g, "") : "";
    const digitsSearch = raw.replace(/\D+/g, "");

    const matchName = nameNorm.includes(textNorm);
    const matchCuil = cuilDigits.includes(digitsSearch);
    const coincide = matchName || matchCuil;

    return verInactivos
      ? coincide && p.activo === false
      : coincide && (p.activo === true || p.activo === undefined);
  });

  // Alta
  const handleAgregar = async () => {
    const role = (user?.role || "").toString().toUpperCase();
    const canCreate =
      role.includes("GERENTE") || role.includes("DUENO") || role.includes("DUEÑO") || role.includes("ENCARGADO");
    if (!canCreate) return toast.error("No tenés permisos para crear proveedores");

    const nombre = (nuevoProveedor.nombre || "").trim();
    const localidad = (nuevoProveedor.localidad || "").trim();
    if (!nombre || !localidad) return toast.info("Completá nombre y localidad");

    const email = (nuevoProveedor.email || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast.info("Email inválido");

    try {
      const dup = await existsProveedor({ cuil: nuevoProveedor.cuil, nombre });
      if (dup)
        return toast.info(`Ya existe un proveedor con esos datos (${dup.nombre || dup.cuil})`);
      await createProveedor(nuevoProveedor);
      toast.success("Proveedor registrado");
      resetForm();
    } catch (e) {
      toast.error(e?.message || "Error creando proveedor");
    }
  };

  // Editar
  const handleEditar = (id) => {
    const proveedor = proveedores.find((p) => p.id === id);
    setProveedorEditando(proveedor);
    setNuevoProveedor(proveedor);
    setModoEdicion(true);
    setMostrarFormulario(true);
  };

  // Eliminar: abre modal de confirmación (no llama backend todavía)
  const handleEliminar = (proveedor) => {
    const role = (user?.role || "").toString().toUpperCase();
    const canDelete = role.includes("GERENTE") || role.includes("DUENO") || role.includes("DUEÑO");
    if (!canDelete) return toast.error("No tenés permisos para eliminar");

    setProveedorAConfirmarEliminar(proveedor);
    setMostrarModalConfirmarEliminar(true);
  };

  // Confirmación de borrar: acá sí llamamos a delete
  const confirmarEliminarDefinitivo = async () => {
    if (!proveedorAConfirmarEliminar) return;
    try {
      await deleteProveedor(proveedorAConfirmarEliminar.id);
      toast.success("Proveedor eliminado");
      setMostrarModalConfirmarEliminar(false);
      setProveedorAConfirmarEliminar(null);
      await fetchProveedores();
    } catch (e) {
      const msg = String(e?.message || "").toLowerCase();
      setMostrarModalConfirmarEliminar(false);

      // Si backend no deja borrar por vínculos, ofrecer inactivar (soft delete)
      if (msg.includes("lotes asociados")) {
        setProveedorAEliminar(proveedorAConfirmarEliminar);
        setMostrarModalInactivar(true);
      } else {
        toast.error(e?.message || "Error eliminando proveedor");
        setProveedorAConfirmarEliminar(null);
      }
    }
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"}`}>
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            darkMode
              ? "border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>
        <h1 className="text-2xl font-semibold">Gestión de Proveedores</h1>
        <div className="w-[90px]" />
      </header>

      {/* Acciones */}
      <div
        className={`rounded-xl border shadow-sm mb-6 p-5 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <TruckIcon className={`h-6 w-6 ${darkMode ? "text-pink-400" : "text-pink-600"}`} />
            <input
              type="text"
              placeholder="Buscar proveedor (nombre o cuil)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full sm:w-80 p-2 rounded-lg border focus:ring-2 focus:ring-pink-500 transition-colors ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500"
              }`}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const role = (user?.role || "").toString().toUpperCase();
                const canCreate =
                  role.includes("GERENTE") ||
                  role.includes("DUENO") ||
                  role.includes("DUEÑO") ||
                  role.includes("ENCARGADO");
                if (!canCreate) return toast.error("No tenés permisos");
                setMostrarFormulario(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Nuevo
            </button>

            <button
              onClick={() => setVerInactivos((v) => !v)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                darkMode
                  ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {verInactivos ? "Ver Activos" : "Ver Inactivos"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div
        className={`rounded-xl border shadow-sm overflow-hidden ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className={`grid grid-cols-6 font-medium text-sm px-5 py-3 border-b ${
          darkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"
        }`}>
          <span>Nombre</span>
          <span>Localidad</span>
          <span>Teléfono</span>
          <span>Dirección</span>
          <span>Email</span>
          <span className="text-right">Acciones</span>
        </div>

        {filteredProveedores.length > 0 ? (
          filteredProveedores.map((p) => (
            <div
              key={p.id}
              className={`grid grid-cols-6 items-center text-sm px-5 py-3 border-t ${
                darkMode
                  ? "border-gray-700 hover:bg-gray-700/50"
                  : "border-gray-200 hover:bg-gray-50"
              } transition-colors`}
            >
              <span className="truncate font-medium">{p.nombre}</span>
              <span className="truncate">{p.localidad || "-"}</span>
              <span className="truncate">{p.telefono || "-"}</span>
              <span className="truncate">{p.direccion || "-"}</span>
              <span className="truncate">{p.email || "-"}</span>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleEditar(p.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm border ${
                    darkMode
                      ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <PencilIcon className="h-3 w-3" />
                  Editar
                </button>

                {!verInactivos && (
                  <button
                    onClick={() => handleEliminar(p)}
                    className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-500 hover:bg-red-600 text-white"
                  >
                    <TrashIcon className="h-3 w-3" />
                    Eliminar
                  </button>
                )}

                {verInactivos && (
                  <button
                    onClick={async () => {
                      try {
                        await reactivarProveedor(p.id);
                        toast.success("Proveedor reactivado");
                        fetchProveedores();
                      } catch (e) {
                        toast.error(e?.message || "Error reactivando");
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-green-500 hover:bg-green-600 text-white"
                  >
                    <PlusIcon className="h-3 w-3" />
                    Reactivar
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

      {/* Modal de confirmación de eliminación */}
      {mostrarModalConfirmarEliminar && proveedorAConfirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setMostrarModalConfirmarEliminar(false);
              setProveedorAConfirmarEliminar(null);
            }}
          />
          <div
            className={`relative w-full sm:max-w-md mx-2 my-4 rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto ${
              darkMode
                ? "bg-gray-900 border border-gray-700 text-gray-100"
                : "bg-white border border-slate-200 text-gray-800"
            }`}
          >
            <h2 className="text-lg font-bold mb-2">¿Eliminar proveedor?</h2>
            <p className="mb-4">
              ¿Seguro que deseás eliminar definitivamente a{" "}
              <span className="font-semibold">{proveedorAConfirmarEliminar?.nombre}</span>?
              <br />Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={confirmarEliminarDefinitivo}
                className={`px-4 py-2 rounded font-medium ${
                  darkMode ? "bg-red-600 text-white" : "bg-red-500 text-white"
                }`}
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setMostrarModalConfirmarEliminar(false);
                  setProveedorAConfirmarEliminar(null);
                }}
                className={`px-4 py-2 rounded font-medium border ${
                  darkMode
                    ? "bg-gray-900 border-gray-700 text-gray-300"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de inactivar (soft delete) */}
      {mostrarModalInactivar && proveedorAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`p-6 rounded-xl shadow-lg max-w-md w-full mx-4 border ${
              darkMode
                ? "bg-gray-900 border-gray-700 text-gray-100"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            <h2 className="text-lg font-semibold mb-2 text-pink-500">
              No se puede eliminar el proveedor
            </h2>
            <p className="text-sm mb-5">
              Este proveedor está vinculado a una compra. <br />
              ¿Deseás inactivarlo en su lugar?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={async () => {
                  try {
                    await inactivarProveedor(proveedorAEliminar.id);
                    toast.info("Proveedor inactivado");
                    await fetchProveedores();
                  } catch (e) {
                    toast.error(e?.message || "Error inactivando");
                  } finally {
                    setMostrarModalInactivar(false);
                    setProveedorAEliminar(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 text-sm font-medium"
              >
                Inactivar
              </button>

              <button
                onClick={() => {
                  setMostrarModalInactivar(false);
                  setProveedorAEliminar(null);
                }}
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                  darkMode
                    ? "border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de alta/edición */}
      {mostrarFormulario && (
        <ProveedorModal
          visible={mostrarFormulario}
          onClose={resetForm}
          onSave={
            modoEdicion
              ? async (form) => {
                  await updateProveedor(proveedorEditando.id, form);
                  resetForm();
                }
              : async (form) => {
                  await createProveedor(form);
                  resetForm();
                }
          }
          proveedor={modoEdicion ? proveedorEditando : null}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
