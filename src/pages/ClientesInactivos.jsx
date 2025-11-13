import React, { useEffect, useMemo, useState } from "react";
import useClientes from "../hooks/useClientes";
import Pagination from "../components/Pagination";

export default function ClientesInactivos({ darkMode, onBack }) {
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const { items, loading, error, update, fetchAll } = useClientes();
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    const list = Array.isArray(items) ? items.filter(c => !c.activo) : [];
    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((c) =>
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c.apellido && c.apellido.toLowerCase().includes(q)) ||
      (c.dni && String(c.dni).toLowerCase().includes(q))
    );
  }, [items, searchTerm]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);
  useEffect(() => { setPage(1); }, [searchTerm, pageSize]);

  return (
    <div className={`space-y-8 p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>Clientes Inactivos</h2>
        <button
          onClick={() => typeof onBack === 'function' && onBack()}
          className={`px-4 py-2 rounded font-semibold shadow transition ${darkMode ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700'}`}
        >
          Ver clientes activos
        </button>
      </div>
      <div className="mb-2">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar por nombre o DNI..."
          className={`w-full rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"} focus:outline-none focus:ring-2 focus:ring-pink-500`}
        />
      </div>
      <div className="space-y-4">
        {loading ? (
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cargando...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filtered.length === 0 ? (
          <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No hay clientes inactivos.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {current.map((cliente) => (
              <li
                key={cliente.id}
                className={`p-4 rounded-xl shadow-sm border border-dashed transition ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-slate-300"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-lg font-semibold`}>
                    {(cliente.nombre || '') + ' ' + (cliente.apellido || '')}
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await update(cliente.id, { activo: true, email: cliente.email });
                        fetchAll();
                      } catch (err) {
                        alert(err.message || "Error al reactivar");
                      }
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold ${darkMode ? 'bg-pink-700 text-white hover:bg-pink-600' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}
                  >
                    Reactivar
                  </button>
                </div>
                <p className={`${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                  <strong>DNI: </strong> {cliente.dni}
                </p>
                <p className={`${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                  <strong>Email:</strong> {cliente.email}
                </p>
                <p className={`${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                  <strong>Teléfono:</strong> {cliente.telefono || "No registrado"}
                </p>
                <p className={`${darkMode ? "text-gray-400" : "text-slate-500"}`}>
                  <strong>Dirección:</strong> {cliente.direccion || "No registrada"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p)=> setPage(Math.min(Math.max(1,p), totalPages))}
        onPageSizeChange={(s)=> setPageSize(s)}
        darkMode={darkMode}
        className="mt-4"
      />
    </div>
  );
}
