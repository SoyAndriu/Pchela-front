import React from "react";

export default function UsuarioVinculadoModal({ open, onClose, usuario, darkMode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={`rounded-lg shadow-xl p-6 w-full max-w-xs border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-slate-200 text-gray-900'}`}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Usuario vinculado
        </h2>
        <div className="space-y-2 mb-4">
          <div><span className="font-semibold">Usuario:</span> {usuario?.username || '-'}</div>
          <div><span className="font-semibold">Email:</span> {usuario?.email || '-'}</div>
          <div><span className="font-semibold">Rol:</span> {usuario?.role || '-'}</div>
        </div>
        <button
          onClick={onClose}
          className={`w-full mt-2 px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
