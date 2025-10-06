// COMPONENTE ZONA DE DRAG & DROP PARA IMÁGENES

import React from 'react';

/**
 * Componente para subir imágenes mediante drag & drop o click
 * @param {Object} props - Props del componente
 * @param {File} props.selectedFile - Archivo seleccionado
 * @param {Function} props.onFileChange - Función para cambiar archivo
 * @param {boolean} props.darkMode - Si está en modo oscuro
 */
const ImageDropZone = ({ selectedFile, onFileChange, darkMode }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleClick = () => {
    document.getElementById('fileInput').click();
  };

  return (
    <div
      className={`w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors mb-2 ${
        darkMode 
          ? "border-pink-700 bg-gray-700 hover:bg-gray-600" 
          : "border-pink-400 bg-pink-50 hover:bg-pink-100"
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        // Mostrar previsualización de la imagen seleccionada
        <img
          src={URL.createObjectURL(selectedFile)}
          alt="Previsualización"
          className="w-24 h-24 object-cover rounded mb-2"
        />
      ) : (
        // Mostrar icono y texto cuando no hay imagen
        <>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 mb-2 text-pink-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 16V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12l2 2 4-4" 
            />
          </svg>
          <span className={`text-sm ${darkMode ? "text-pink-300" : "text-pink-600"}`}>
            Arrastra una imagen aquí o haz clic para seleccionar
          </span>
        </>
      )}
      
      {/* Input oculto para seleccionar archivos */}
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
};

export default ImageDropZone;