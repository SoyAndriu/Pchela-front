import React, { useState, useEffect, useMemo } from "react";

import ClientesInactivos from "./ClientesInactivos";
import Pagination from "../components/Pagination";
import useClientes from "../hooks/useClientes";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Clientes({ darkMode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const { items, loading, error, update, fetchAll } = useClientes();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [showInactivos, setShowInactivos] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openEdit = (cliente) => {
    setEditingCliente(cliente);
    setEditForm({
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      dni: cliente.dni || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditingCliente(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCliente) return;
    if (editingCliente.id === 1) {
      alert("El cliente especial no puede ser editado.");
      return;
    }
    try {
      await update(editingCliente.id, editForm);
      closeEdit();
      fetchAll();
    } catch (err) {
      alert(err.message || "Error actualizando cliente");
    }
  };

  const handleDelete = async (cliente) => {
    if (cliente.id === 1) {
      alert("El cliente especial no puede ser eliminado.");
      return;
    }
    if (!confirm("¿Seguro que deseas dejar inactivo este cliente?")) return;
    try {
      await update(cliente.id, { activo: false, email: cliente.email });
      fetchAll();
    } catch (err) {
      alert(err.message || "Error al dejar inactivo");
    }
  };

  // Filtrado y paginado
  const filtered = useMemo(() => {
    const list = Array.isArray(items) ? items.filter((c) => c.activo) : [];
    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (c) =>
        (c.nombre && c.nombre.toLowerCase().includes(q)) ||
        (c.apellido && c.apellido.toLowerCase().includes(q)) ||
        (c.dni && String(c.dni).toLowerCase().includes(q))
    );
  }, [items, searchTerm]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div
      className={`space-y-8 p-6 min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* Vista condicional sin romper Hooks */}
      {showInactivos ? (
        <ClientesInactivos
          darkMode={darkMode}
          onBack={() => setShowInactivos(false)}
        />
      ) : (
        <>
          {/* Título y botón */}
          <div className="flex items-center justify-between">
            <h2
              className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-pink-600"
              }`}
            >
              Clientes
            </h2>
            <button
              onClick={() => setShowInactivos(true)}
              className={`px-4 py-2 rounded font-semibold shadow transition ${
                darkMode
                  ? "bg-pink-600 text-white"
                  : "bg-pink-100 text-pink-700"
              }`}
            >
              Ver clientes inactivos
            </button>
          </div>

          {/* Buscador */}
          <div className="mb-2">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o DNI..."
              className={`w-full rounded p-2 border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-gray-100"
                  : "bg-white border-slate-300"
              } focus:outline-none focus:ring-2 focus:ring-pink-500`}
            />
          </div>

          {/* Tabla */}
          <div
            className={`overflow-x-auto border rounded-lg shadow-sm ${
              darkMode ? "border-gray-700" : "border-slate-200"
            }`}
          >
            <table className="w-full text-sm">
              <thead
                className={
                  darkMode
                    ? "bg-gray-700 text-gray-100"
                    : "bg-gray-50 text-slate-800"
                }
              >
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Apellido</th>
                  <th className="px-4 py-2 text-left">DNI</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Teléfono</th>
                  <th className="px-4 py-2 text-left">Dirección</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-6 text-center text-gray-400"
                    >
                      Cargando...
                </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-red-500 px-4 py-6 text-center"
                    >
                      {error}
                    </td>
                  </tr>
                ) : (
                  current.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className={
                        darkMode
                          ? "border-t border-gray-700"
                          : "border-t border-slate-200"
                      }
                    >
                      <td className="px-4 py-2">{cliente.nombre}</td>
                      <td className="px-4 py-2">{cliente.apellido}</td>
                      <td className="px-4 py-2">{cliente.dni}</td>
                      <td className="px-4 py-2">{cliente.email}</td>
                      <td className="px-4 py-2">
                        {cliente.telefono || "No registrado"}
                      </td>
                      <td className="px-4 py-2">
                        {cliente.direccion || "No registrada"}
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button
                          onClick={() => openEdit(cliente)}
                          className={`px-3 py-1 rounded border ${
                            darkMode
                              ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                              : "border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                          title="Editar"
                          disabled={cliente.id === 1}
                        >
                          <PencilSquareIcon className="w-5 h-5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente)}
                          className={`px-3 py-1 rounded border ${
                            darkMode
                              ? "border-red-500 text-red-400 hover:bg-red-900/20"
                              : "border-red-300 text-red-600 hover:bg-red-50"
                          }`}
                          title="Dejar inactivo"
                          disabled={cliente.id === 1}
                        >
                          <TrashIcon className="w-5 h-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) =>
              setPage(Math.min(Math.max(1, p), totalPages))
            }
            onPageSizeChange={(s) => setPageSize(s)}
            darkMode={darkMode}
            className="px-1"
          />
        </>
      )}

      {/* Modal de edición */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div
            className={`p-6 rounded-lg w-full max-w-md ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <h3 className="text-xl font-bold mb-4">Editar Cliente</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              {/* Inputs… (sin cambios) */}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
