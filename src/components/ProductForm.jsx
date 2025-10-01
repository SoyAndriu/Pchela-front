import React, { useState } from "react";

export default function ProductForm({ onSave, initialData, onCancel, darkMode }) {
    const [formData, setFormData] = useState(
        initialData || { name: "", price: "", stock: "" }
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={`p-6 rounded-lg shadow-sm border mb-4 ${
        darkMode 
            ? "bg-gray-800 text-white border-gray-700" 
            : "bg-white text-gray-900 border-pink-100"
    }`}>
      <h3 className="text-lg font-bold mb-2">
        {initialData ? "Editar producto" : "Agregar producto"}
      </h3>

      <div className="mb-2">
        <label className="block text-sm">Nombre</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`border p-2 w-full rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
              darkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-pink-200"
          }`}
          required
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm">Precio</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className={`border p-2 w-full rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
              darkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-pink-200"
          }`}
          required
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm">Stock</label>
        <input
          type="number"
          name="stock"
          value={formData.stock}
          onChange={handleChange}
          className={`border p-2 w-full rounded focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
              darkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-pink-200"
          }`}
          required
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className={`px-4 py-2 rounded transition-colors ${
              darkMode 
                  ? "bg-pink-600 text-white hover:bg-pink-700" 
                  : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2 rounded transition-colors ${
              darkMode 
                  ? "bg-gray-600 text-white hover:bg-gray-700" 
                  : "bg-gray-400 text-white hover:bg-gray-500"
          }`}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
