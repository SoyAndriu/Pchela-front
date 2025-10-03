import React, { useState } from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Clientes({ darkMode }) {
  const [clientes, setClientes] = useState([
    { nombre_completo: "María Gómez", email: "maria@example.com", telefono: "1122334455", direccion: "Av. Siempre Viva 123" },
    { nombre_completo: "Juan Pérez", email: "juan@example.com", telefono: "", direccion: "" },
  ]);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setClientes((prev) => [...prev, formData]);
    setFormData({ nombre_completo: "", email: "", telefono: "", direccion: "" });
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setClientes((prev) =>
      prev.map((c, i) => (i === editingIndex ? { ...c, [name]: value } : c))
    );
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;
    setClientes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-8 p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      {/* Título */}
      <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>Clientes</h2>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className={`p-6 rounded-2xl space-y-4 shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}
      >
        <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-slate-800"}`}>Agregar Cliente</h3>

        <input
          type="text"
          name="nombre_completo"
          value={formData.nombre_completo}
          onChange={handleChange}
          placeholder="Nombre completo"
          className={`w-full rounded-lg p-3 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
          required
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className={`w-full rounded-lg p-3 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
          required
        />

        <input
          type="text"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          placeholder="Teléfono"
          className={`w-full rounded-lg p-3 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
        />

        <input
          type="text"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          placeholder="Dirección"
          className={`w-full rounded-lg p-3 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
        />

        <button
          type="submit"
          className="px-5 py-2 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition"
        >
          Guardar Cliente
        </button>
      </form>

      {/* Listado de clientes */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-slate-800"}`}>Lista de Clientes</h3>
        {clientes.length === 0 ? (
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No hay clientes registrados.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {clientes.map((cliente, index) => (
              <li
                key={index}
                className={`p-4 rounded-xl shadow-sm border transition ${darkMode ? "bg-gray-800 border-gray-700 hover:shadow" : "bg-white border-slate-200 hover:shadow-md"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`${darkMode ? "text-pink-300" : "text-pink-600"} text-lg font-semibold`}>
                    {cliente.nombre_completo}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(index)}
                      className={`${darkMode ? "p-1 rounded border border-gray-600 text-gray-200 hover:bg-gray-700" : "p-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                      title="Editar"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className={`${darkMode ? "p-1 rounded border border-red-500 text-red-400 hover:bg-red-900/20" : "p-1 rounded border border-red-300 text-red-600 hover:bg-red-50"}`}
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className={`${darkMode ? "text-gray-300" : "text-slate-700"}`}>
                  <strong>Email:</strong> {cliente.email}
                </p>
                <p className={`${darkMode ? "text-gray-300" : "text-slate-700"}`}>
                  <strong>Teléfono:</strong> {cliente.telefono || "No registrado"}
                </p>
                <p className={`${darkMode ? "text-gray-300" : "text-slate-700"}`}>
                  <strong>Dirección:</strong> {cliente.direccion || "No registrada"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showEditModal && editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className={`${darkMode ? "bg-gray-800 text-white border border-gray-700" : "bg-white text-gray-900 border border-slate-200"} p-6 rounded-lg shadow-xl w-full max-w-md`}>
            <h3 className="text-lg font-semibold mb-4">Editar cliente</h3>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); closeEdit(); }}>
              <div>
                <label className="block text-sm">Nombre completo</label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={clientes[editingIndex]?.nombre_completo || ""}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  name="email"
                  value={clientes[editingIndex]?.email || ""}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>
              <div>
                <label className="block text-sm">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={clientes[editingIndex]?.telefono || ""}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>
              <div>
                <label className="block text-sm">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={clientes[editingIndex]?.direccion || ""}
                  onChange={handleEditChange}
                  className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeEdit}
                  className={`${darkMode ? "px-4 py-2 rounded border border-gray-600 text-gray-200 hover:bg-gray-700" : "px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
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
