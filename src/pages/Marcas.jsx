import React, { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import MarcaModal from '../components/marcas/MarcaModal';
import useMarcas from '../hooks/useMarcas';

export default function Marcas({ darkMode, onBack }) {
  const {
    marcas,
    fetchMarcas,
    createMarca,
    updateMarca,
    deleteMarca,
    loading,
    error
  } = useMarcas();

  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchMarcas(); }, [fetchMarcas]);

  const handleAdd = () => {
    setEditando(null);
    setModalVisible(true);
  };
  const handleEdit = (marca) => {
    setEditando(marca);
    setModalVisible(true);
  };
  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar marca?")) await deleteMarca(id);
  };

  const handleSave = async (form) => {
    if (editando) await updateMarca(editando.id, form);
    else await createMarca(form);
    setModalVisible(false);
  };

  const filtered = marcas.filter(m => m.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900" : "bg-pink-25"}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Volver"
              aria-label="Volver"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
          )}
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-pink-600"}`}>Gestión de Marcas</h1>
        </div>
        <button onClick={handleAdd} className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${darkMode ? "bg-pink-600 hover:bg-pink-700 text-white" : "bg-pink-500 hover:bg-pink-600 text-white"}`}>
          <PlusIcon className="h-4 w-4" />
          Agregar Marca
        </button>
      </div>
      <input type="text" placeholder="Buscar marcas..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className={`w-full p-3 rounded-lg border mb-6 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-slate-200 placeholder-gray-500"}`} />
      {loading && <p className="text-sm opacity-70">Cargando...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? filtered.map(marca => (
          <div key={marca.id} className={`rounded-lg border shadow-sm p-4 flex flex-col gap-2 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? "text-pink-400" : "text-pink-600"}`}>{marca.nombre}</h3>
            {marca.notas && <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{marca.notas}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={()=>handleEdit(marca)} className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${darkMode ? "border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}><PencilIcon className="h-3 w-3" />Editar</button>
              <button onClick={()=>handleDelete(marca.id)} className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${darkMode ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-500 text-white hover:bg-red-600"}`}><TrashIcon className="h-3 w-3" />Eliminar</button>
            </div>
          </div>
        )) : <div className={`col-span-full text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No hay marcas registradas</div>}
      </div>
      <MarcaModal visible={modalVisible} onClose={()=>setModalVisible(false)} onSave={handleSave} marca={editando} darkMode={darkMode} existingMarcas={marcas} />
    </div>
  );
}
