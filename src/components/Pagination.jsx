import React from 'react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  darkMode = false,
  className = ''
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const btn = `px-3 py-1.5 rounded border text-sm ${darkMode ? 'border-gray-700 text-gray-200' : 'border-slate-300 text-slate-700'} disabled:opacity-50`;
  const select = `px-2 py-1.5 rounded border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-slate-300 text-slate-700'}`;
  const text = `text-xs ${darkMode ? 'text-gray-300' : 'text-slate-600'}`;

  return (
    <div className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${className}`}>
      <div className={text}>
        {totalItems === 0 ? 'Sin resultados' : `Mostrando ${start}-${end} de ${totalItems}`}
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-2 mr-2">
            <span className={text}>Filas:</span>
            <select className={select} value={pageSize} onChange={(e)=>onPageSizeChange(Number(e.target.value))}>
              {pageSizeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}
        <button className={btn} onClick={()=>onPageChange(1)} disabled={currentPage <= 1}>« Primero</button>
        <button className={btn} onClick={()=>onPageChange(currentPage - 1)} disabled={currentPage <= 1}>‹ Anterior</button>
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>Página {currentPage} de {totalPages}</span>
        <button className={btn} onClick={()=>onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Siguiente ›</button>
        <button className={btn} onClick={()=>onPageChange(totalPages)} disabled={currentPage >= totalPages}>Última »</button>
      </div>
    </div>
  );
}
