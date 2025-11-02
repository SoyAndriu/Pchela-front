import React from 'react';
import useSettings from '../../hooks/useSettings';

const map = {
  cash: 'EFECTIVO',
  card: 'TARJETA',
  transfer: 'TRANSFERENCIA',
  qr: 'QR',
};

export default function PaymentMethodSelect({ value, onChange, darkMode }) {
  const { settings } = useSettings();
  const pm = settings?.sales?.paymentMethods || {};
  // Forzar únicamente medios soportados por backend: efectivo y transferencia
  const allowed = new Set(['cash', 'transfer']);
  const labels = { cash: 'Efectivo', transfer: 'Transferencia' };
  const options = Object.entries(pm)
    .filter(([k, enabled]) => allowed.has(k) && enabled)
    .map(([k]) => ({ key: k, label: labels[k] || k, value: map[k] }))
    // Fallback: si settings no trae estos dos, mostrar ambos por defecto
  ;
  const finalOptions = options.length > 0
    ? options
    : [
        { key: 'cash', label: labels.cash, value: map.cash },
        { key: 'transfer', label: labels.transfer, value: map.transfer },
      ];

  return (
    <div>
      <label className="block text-sm mb-1">Medio de pago</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}>
        {finalOptions.map(o => <option key={o.key} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
