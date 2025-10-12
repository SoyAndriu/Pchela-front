import React from 'react';

export default function CompraTotals({ detalles, totalBruto, totalDescuento, totalNeto, cardClass }) {
  return (
    <div className={`p-4 rounded-lg shadow mb-6 ${cardClass}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-lg font-semibold">
        <div className="flex justify-between">
          <span>Ítems:</span>
          <span>{detalles.reduce((s, d) => s + Number(d.cantidad || 0), 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Líneas:</span>
          <span>{detalles.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Total bruto:</span>
          <span>${totalBruto.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Descuento:</span>
          <span>- ${totalDescuento.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total neto:</span>
          <span>${totalNeto.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
