import React, { useState } from 'react';
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import SearchableProductSelect from './SearchableProductSelect';

export default function CompraLineItem({
  index,
  d,
  darkMode,
  inputClass,
  options,
  loadingProductos,
  onChangeDetalle,
  onEliminar,
  getLineAmounts,
  onNewProduct,
  savingProducto,
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="grid md:grid-cols-6 gap-3 mb-3 items-end">
      <div className="md:col-span-2">
        <label className="text-sm block mb-1">Producto</label>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <SearchableProductSelect
              value={d.producto}
              onChange={(val) => onChangeDetalle(index, "producto", val)}
              options={options}
              loading={loadingProductos}
              darkMode={darkMode}
            />
          </div>
          {typeof onNewProduct === 'function' && (
            <div className="relative">
              <button
                type="button"
                aria-label="Crear nuevo producto"
                role="button"
                onClick={() => onNewProduct(index)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className={`transition-all duration-150 px-3 rounded flex items-center justify-center shadow-sm focus:outline-none ${darkMode ? 'bg-gray-700 text-gray-100 hover:bg-pink-700 focus:bg-pink-700' : 'bg-gray-200 text-gray-800 hover:bg-pink-500 focus:bg-pink-500'} ${savingProducto ? 'cursor-wait opacity-70' : ''}`}
                style={{ height: '2.25rem', minWidth: '2.25rem', width: '2.25rem', fontSize: '1.25rem', fontWeight: 600, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)' }}
                disabled={savingProducto}
              >
                {savingProducto ? (
                  <span className="animate-spin w-5 h-5 border-2 border-t-transparent border-pink-500 rounded-full"></span>
                ) : (
                  <PlusIcon className="w-6 h-6" />
                )}
              </button>
              {showTooltip && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded text-xs shadow-lg z-10 ${darkMode ? 'bg-gray-900 text-pink-200' : 'bg-white text-pink-600 border border-pink-200'}`}>
                  Crear nuevo producto
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm block mb-1">Cantidad</label>
        <input
          type="number"
          min="1"
          step="1"
          value={d.cantidad}
          onChange={(e) => onChangeDetalle(index, "cantidad", e.target.value)}
          onBlur={(e) => {
            const val = String(e.target.value || "");
            const digits = val.replace(/\D/g, "");
            let n = parseInt(digits || "", 10);
            if (!Number.isFinite(n) || n < 1) n = 1;
            onChangeDetalle(index, "cantidad", String(n));
          }}
          onKeyDown={(e) => {
            if (["e","E","+","-",".",","].includes(e.key)) {
              e.preventDefault();
            }
          }}
          className={`w-full p-2 rounded border ${inputClass}`}
        />
      </div>

      <div>
        <label className="text-sm block mb-1">Precio unitario</label>
        <input
          type="number"
          min="0"
          value={d.precio}
          onChange={(e) => onChangeDetalle(index, "precio", e.target.value)}
          className={`w-full p-2 rounded border ${inputClass}`}
          placeholder="0"
        />
      </div>

      <div>
        <label className="text-sm block mb-1">N° Lote</label>
        <input
          type="text"
          value={d.numeroLote || ""}
          onChange={(e) => onChangeDetalle(index, "numeroLote", e.target.value)}
          className={`w-full p-2 rounded border ${inputClass}`}
          placeholder="Ej: L-12345"
          required
        />
      </div>

      <div>
        <label className="text-sm block mb-1">Confirmar N° Lote</label>
        <input
          type="text"
          value={d.confirmarLote || ""}
          onChange={(e) => onChangeDetalle(index, "confirmarLote", e.target.value)}
          className={`w-full p-2 rounded border ${inputClass}`}
          placeholder="Repite el número de lote"
          required
        />
      </div>

      <div className="md:col-span-6 grid md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm block mb-1">Tipo Descuento</label>
          <select
            value={d.descuentoTipo}
            onChange={(e) => onChangeDetalle(index, "descuentoTipo", e.target.value)}
            className={`w-full p-2 rounded border ${inputClass}`}
          >
            <option value="">Ninguno</option>
            <option value="porc">% Porcentaje</option>
            <option value="valor">Valor total</option>
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1">Descuento</label>
          <input
            type="number"
            step="0.01"
            value={d.descuentoValor}
            disabled={!d.descuentoTipo}
            onChange={(e) => onChangeDetalle(index, "descuentoValor", e.target.value)}
            className={`w-full p-2 rounded border ${inputClass}`}
            placeholder={d.descuentoTipo === 'porc' ? 'Ej: 10 (para 10%)' : 'Ej: 5000'}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm block mb-1">Notas</label>
          <input
            type="text"
            value={d.notas || ''}
            onChange={(e) => onChangeDetalle(index, "notas", e.target.value)}
            className={`w-full p-2 rounded border ${inputClass}`}
            placeholder="Notas opcionales"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          {(() => {
            const a = getLineAmounts(d);
            return (
              <>
                <span className="font-semibold">Subtotal neto:</span> ${a.net.toFixed(2)}
                {a.discount > 0 && (
                  <span className="opacity-75 ml-2">(antes: ${a.subtotal.toFixed(2)} • desc: -${a.discount.toFixed(2)})</span>
                )}
              </>
            );
          })()}
        </div>
        <div>
          <button
            onClick={() => onEliminar(index)}
            className="text-red-500 hover:text-red-600"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
