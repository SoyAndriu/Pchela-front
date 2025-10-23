import React from "react";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", danger = false, darkMode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`p-6 rounded-xl shadow-lg max-w-md w-full mx-auto border ${
        darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-800"
      }`}>
        <h2 className={`text-lg font-bold mb-2 ${danger ? 'text-red-500' : 'text-pink-500'}`}>{title}</h2>
        <p className="mb-5 text-sm">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${danger
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-pink-600 text-white hover:bg-pink-700'}`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg border text-sm font-medium ${darkMode
              ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
