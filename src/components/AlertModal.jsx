import React from "react";

export default function AlertModal({
  visible,
  title = "Confirmar acción",
  message = "¿Estás seguro?",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  darkMode = false,
  showCancel = true
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        className={`relative w-full max-w-sm rounded-xl p-6 shadow-lg ${
          darkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"
        }`}
      >
        <h3 className={`text-lg font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>
          {title}
        </h3>
        <p className={`text-sm mb-5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {message}
        </p>
        <div className="flex justify-end gap-3">
          {showCancel && (
            <button
              onClick={onCancel}
              className={`px-4 py-2 rounded text-sm ${
                darkMode
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-sm font-medium ${
              darkMode
                ? "bg-pink-600 hover:bg-pink-700 text-white"
                : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
