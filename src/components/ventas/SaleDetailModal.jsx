import React from "react";

export default function SaleDetailModal({ open, onClose, sale, darkMode }) {
  if (!open || !sale) return null;

  const overlayClass = "fixed inset-0 bg-black/50 z-40";
  const modalClass = `fixed z-50 inset-0 flex items-center justify-center px-4 py-6`;
  const panelClass = `w-full max-w-xl rounded-lg shadow-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`;

  const currency = (n) => {
    const x = Number(n || 0);
    return `$${x.toFixed(2)}`;
  };

  const pmLabel = sale.paymentMethod === 'cash' ? 'Efectivo'
    : sale.paymentMethod === 'card' ? 'Tarjeta'
    : sale.paymentMethod === 'transfer' ? 'Transferencia'
    : (sale.paymentMethod || '').toString();

  const items = Array.isArray(sale.lineItems) ? sale.lineItems : [];
  const numero = sale.numero;
  const bruto = typeof sale.bruto === 'number' ? sale.bruto : undefined;
  const descuento = typeof sale.descuento === 'number' ? sale.descuento : undefined;
  const recargo = typeof sale.recargo === 'number' ? sale.recargo : undefined;
  const impuestos = typeof sale.impuestos === 'number' ? sale.impuestos : undefined;
  const neto = typeof sale.neto === 'number' ? sale.neto : undefined;
  const pay = sale.paymentDetails || {};

  return (
    <>
      <div className={overlayClass} onClick={onClose} />
      <div className={modalClass}>
        <div className={panelClass}>
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detalle de venta</h3>
              <button
                className={`px-3 py-1 text-sm rounded border ${darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}
                onClick={onClose}
              >Cerrar</button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="opacity-70">Fecha</div>
                <div>{sale.date} {sale.time}</div>
              </div>
              <div>
                <div className="opacity-70">Cliente</div>
                <div>{sale.cliente}</div>
              </div>
              {numero && (
                <div>
                  <div className="opacity-70">Comprobante</div>
                  <div>{numero}</div>
                </div>
              )}
              <div>
                <div className="opacity-70">Medio de pago</div>
                <div>{pmLabel}</div>
              </div>
              <div>
                <div className="opacity-70">Total</div>
                <div className="font-semibold">{currency(sale.total)}</div>
              </div>
            </div>

            <div className={`mt-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            <div>
              <div className="font-medium mb-2">Productos</div>
              {items.length === 0 && (
                <div className="text-sm opacity-70">Sin items disponibles.</div>
              )}
              {items.length > 0 && (
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      <tr>
                        <th className="text-left py-2 pr-2">Producto</th>
                        <th className="text-right py-2 px-2">Cant.</th>
                        <th className="text-right py-2 px-2">P. Unit.</th>
                        <th className="text-right py-2 pl-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className={darkMode ? 'border-t border-gray-800' : 'border-t border-gray-100'}>
                          <td className="py-2 pr-2">{it.producto_nombre}</td>
                          <td className="text-right py-2 px-2">{it.cantidad ?? ''}</td>
                          <td className="text-right py-2 px-2">{it.precio_unitario != null ? currency(it.precio_unitario) : '-'}</td>
                          <td className="text-right py-2 pl-2">{it.subtotal != null ? currency(it.subtotal) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={`mt-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            <div className="grid grid-cols-2 gap-3 text-sm">
              {typeof bruto === 'number' && (
                <div className="flex items-center justify-between col-span-2">
                  <div className="opacity-70">Bruto</div>
                  <div>{currency(bruto)}</div>
                </div>
              )}
              {typeof descuento === 'number' && descuento !== 0 && (
                <div className="flex items-center justify-between col-span-2">
                  <div className="opacity-70">Descuento</div>
                  <div className="text-green-600">- {currency(Math.abs(descuento))}</div>
                </div>
              )}
              {typeof recargo === 'number' && recargo !== 0 && (
                <div className="flex items-center justify-between col-span-2">
                  <div className="opacity-70">Recargo</div>
                  <div className="text-red-600">+ {currency(Math.abs(recargo))}</div>
                </div>
              )}
              {typeof impuestos === 'number' && (
                <div className="flex items-center justify-between col-span-2">
                  <div className="opacity-70">Impuestos</div>
                  <div>{currency(impuestos)}</div>
                </div>
              )}
              {typeof neto === 'number' && (
                <div className="flex items-center justify-between col-span-2">
                  <div className="font-medium">Total</div>
                  <div className="font-semibold">{currency(neto)}</div>
                </div>
              )}
            </div>

            {(pay.tarjeta_marca || pay.tarjeta_ultimos4 || pay.autorizacion || pay.banco || pay.referencia) && (
              <div className={`mt-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            )}
            {(pay.tarjeta_marca || pay.tarjeta_ultimos4 || pay.autorizacion || pay.banco || pay.referencia) && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {pay.tarjeta_marca && (
                  <div><div className="opacity-70">Tarjeta</div><div>{pay.tarjeta_marca}</div></div>
                )}
                {pay.tarjeta_ultimos4 && (
                  <div><div className="opacity-70">Últimos 4</div><div>{pay.tarjeta_ultimos4}</div></div>
                )}
                {pay.autorizacion && (
                  <div><div className="opacity-70">Autorización</div><div>{pay.autorizacion}</div></div>
                )}
                {pay.banco && (
                  <div><div className="opacity-70">Banco</div><div>{pay.banco}</div></div>
                )}
                {pay.referencia && (
                  <div><div className="opacity-70">Referencia</div><div>{pay.referencia}</div></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
