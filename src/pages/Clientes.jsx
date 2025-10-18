import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientesInactivos from "./ClientesInactivos";
import useClientes from "../hooks/useClientes";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Clientes({ darkMode }) {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const navigate = useNavigate();
  const { items, loading, error, update, fetchAll } = useClientes();
  const [editingCliente, setEditingCliente] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre_completo: "",
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
      nombre_completo: cliente.nombre_completo || "",
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
    try {
      await update(editingCliente.id, editForm);
      closeEdit();
      fetchAll();
    } catch (err) {
      alert(err.message || "Error actualizando cliente");
    }
  };

  const handleDelete = async (cliente) => {
    if (!confirm("¿Seguro que deseas dejar inactivo este cliente?")) return;
    try {
      await update(cliente.id, { activo: false, email: cliente.email });
      fetchAll();
    } catch (err) {
      alert(err.message || "Error al dejar inactivo");
    }
  };

  if (showInactivos) {
    return (
      <ClientesInactivos darkMode={darkMode} onBack={() => setShowInactivos(false)} />
    );
  }

  return (
    <div
      className={`space-y-8 p-6 min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
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
      <div className="my-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar por nombre o DNI..."
          className={`w-full md:w-64 rounded p-2 border ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-gray-100"
              : "bg-white border-slate-300"
          } focus:outline-none focus:ring-2 focus:ring-pink-500`}
        />
      </div>

      {/* Tabla de clientes activos */}
      <div className="space-y-4">
        <h3
          className={`text-lg font-semibold ${
            darkMode ? "text-gray-100" : "text-slate-800"
          }`}
        >
          Lista de Clientes Activos
        </h3>
        <div
          className={`overflow-x-auto border rounded-lg shadow-sm ${
            darkMode ? "border-gray-700" : "border-slate-200"
          }`}
        >
          <table className="w-full text-sm">
            <thead
              className={
                darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-slate-800"
              }
            >
              <tr>
                <th className="px-4 py-2 text-left">Nombre</th>
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
                  <td colSpan="6" className="text-red-500 px-4 py-6 text-center">
                    {error}
                  </td>
                </tr>
              ) : (
                items
                  .filter(
                    (c) =>
                      c.activo &&
                      (c.nombre_completo
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                        c.dni?.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((cliente) => (
                    <tr
                      key={cliente.id}
                      className={
                        darkMode
                          ? "border-t border-gray-700"
                          : "border-t border-slate-200"
                      }
                    >
                      <td className="px-4 py-2">{cliente.nombre_completo}</td>
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
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black/50`}
        >
          <div
            className={`p-6 rounded-lg w-full max-w-md ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <h3 className="text-xl font-bold mb-4">Editar Cliente</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-sm">Nombre completo</label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={editForm.nombre_completo}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100"
                      : "bg-white border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>
              <div>
                <label className="block text-sm">DNI</label>
                <input
                  type="text"
                  name="dni"
                  value={editForm.dni}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100"
                      : "bg-white border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>
              <div>
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100"
                      : "bg-white border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>
              <div>
                <label className="block text-sm">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={editForm.telefono}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100"
                      : "bg-white border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>
              <div>
                <label className="block text-sm">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={editForm.direccion}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100"
                      : "bg-white border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeEdit}
                  className={`px-4 py-2 rounded border ${
                    darkMode
                      ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
