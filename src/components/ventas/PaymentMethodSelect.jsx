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
  const options = Object.entries(pm).filter(([,enabled])=>enabled).map(([k])=>({ key:k, label: ({cash:'Efectivo', card:'Tarjeta', transfer:'Transferencia', qr:'QR'})[k] || k, value: map[k] }))

  return (
    <div>
      <label className="block text-sm mb-1">Medio de pago</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}>
        {options.map(o => <option key={o.key} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
