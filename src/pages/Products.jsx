import React, { useState } from "react";
import ProductForm from "../components/ProductForm";

export default function Products() {
  const [products, setProducts] = useState([
    { id: 1, name: "Producto A", price: 100, stock: 12 },
    { id: 2, name: "Producto B", price: 250, stock: 3 },
    { id: 3, name: "Producto C", price: 75, stock: 0 },
  ]);

  const [showForm, setShowForm] = useState(false);

  const handleAdd = (newProduct) => {
    const id = products.length ? products[products.length - 1].id + 1 : 1;
    setProducts([...products, { ...newProduct, id }]);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Agregar producto
        </button>
      </div>

      {showForm && (
        <ProductForm
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Precio</th>
              <th className="p-2 text-left">Stock</th>
              <th className="p-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.id}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2">${p.price}</td>
                <td className="p-2">{p.stock}</td>
                <td className="p-2">
                  <button className="mr-2 text-blue-600">Editar</button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
