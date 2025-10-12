import { useEffect, useMemo, useState } from "react";
import useCaja from "../../hooks/useCaja";

export default function Caja({ darkMode }) {
  const { getSesionAbierta, abrirCaja, cerrarCaja, getMovimientos } = useCaja();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null); // { open: boolean, ... }
  const [error, setError] = useState("");

  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [movs, setMovs] = useState([]);
  const [movsLoading, setMovsLoading] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);

  const isOpen = !!session?.open;

  const saldoEfectivo = useMemo(() => {
    // Compatibilidad: si el backend aún no envía saldo_efectivo, usamos saldo_actual
    return session?.saldo_efectivo ?? session?.saldo_actual;
  }, [session]);

  const saldoTotal = useMemo(() => {
    // Compatibilidad: si no hay saldo_total, usamos saldo_efectivo
    return session?.saldo_total ?? saldoEfectivo;
  }, [session, saldoEfectivo]);

  // Electrónicos neto = Total - Efectivo (puede ser negativo si hubo más egresos electrónicos que ingresos)
  const electronicosNet = useMemo(() => {
    if (saldoTotal == null || saldoEfectivo == null) return 0;
    const te = Number(saldoTotal);
    const ef = Number(saldoEfectivo);
    if (!isFinite(te) || !isFinite(ef)) return 0;
    return te - ef;
  }, [saldoTotal, saldoEfectivo]);

  // Total neto lo entrega el backend (efectivo + electrónicos), puede ser menor al efectivo si los electrónicos son negativos

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return "-";
    const n = Number(val);
    return isNaN(n) ? String(val) : n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  };

  // Helpers tolerantes a nombres alternativos del backend
  const getAperturaUser = (s) => {
    // posibles campos: usuario_nombre, user_name, usuario?.nombre, abierta_por?.nombre, opened_by_name, opened_by
    const cand = [
      s?.usuario_nombre,
      s?.user_name,
      s?.usuario?.nombre,
      s?.usuario?.username,
      s?.abierta_por?.nombre,
      s?.abierta_por?.username,
      s?.opened_by_name,
      s?.opened_by,
      s?.creado_por?.nombre,
    ].map((v) => (v == null ? "" : String(v).trim())).find((v) => v);
    return cand || null;
  };
  const getAperturaFecha = (s) => {
    const cand = [
      s?.fecha_apertura,
      s?.opened_at,
      s?.apertura,
      s?.created_at,
      s?.fecha,
    ].find((v) => v);
    return cand ? new Date(cand) : null;
  };
  const getMontoInicial = (s) => {
    const cand = [
      s?.opening_amount,
      s?.monto_inicial,
      s?.monto_apertura,
      s?.saldo_inicial,
      s?.monto_inicial_efectivo,
    ].find((v) => v !== undefined && v !== null);
    return cand ?? null;
  };

  // Normaliza nombre de medio de pago a categorías conocidas
  const normalizeMedio = (v) => {
    const s = String(v || "").trim().toUpperCase();
    if (["EFECTIVO", "CASH", "EF"].includes(s)) return "EFECTIVO";
    if (["TARJETA", "CARD"].includes(s)) return "TARJETA";
    if (["TRANSFERENCIA", "TRANSFER", "TRANSF"].includes(s)) return "TRANSFERENCIA";
    if (["CREDITO", "CRÉDITO"].includes(s)) return "CREDITO";
    return s || "OTRO";
  };

  // Sumario por medio: ingresos, egresos, neto
  const resumenPorMedio = useMemo(() => {
    const base = {
      EFECTIVO: { ingresos: 0, egresos: 0, neto: 0 },
      TARJETA: { ingresos: 0, egresos: 0, neto: 0 },
      TRANSFERENCIA: { ingresos: 0, egresos: 0, neto: 0 },
      CREDITO: { ingresos: 0, egresos: 0, neto: 0 },
      OTRO: { ingresos: 0, egresos: 0, neto: 0 },
    };
    for (const m of movs) {
      const medioRaw = m?.id_tipo_pago_nombre ?? m?.id_tipo_pago ?? m?.medio ?? "OTRO";
      const medio = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CREDITO"].includes(normalizeMedio(medioRaw))
        ? normalizeMedio(medioRaw)
        : "OTRO";
      const amt0 = Number(m?.monto);
      if (!isFinite(amt0)) continue;
      const abs = Math.abs(amt0);
      let signed = abs; // por defecto como ingreso
      const tipo = String(m?.tipo || "").toUpperCase();
      if (tipo === "EGRESO") signed = -abs;
      else if (tipo === "AJUSTE" || tipo === "REVERSO") {
        const s = Number(m?.ajuste_sign);
        if (s === 1) signed = abs;
        else if (s === -1) signed = -abs;
        else signed = amt0; // usar el signo del monto si viene con signo
      }
      if (signed >= 0) base[medio].ingresos += signed; else base[medio].egresos += -signed;
      base[medio].neto += signed;
    }
    return base;
  }, [movs]);

  async function refreshAll() {
    setLoading(true);
    setError("");
    try {
      const s = await getSesionAbierta();
      setSession(s);
      if (s?.open && s?.id) {
        setMovsLoading(true);
        try {
          const list = await getMovimientos({ caja: s.id });
          setMovs(Array.isArray(list) ? list : list.results || []);
        } finally {
          setMovsLoading(false);
        }
      } else {
        setMovs([]);
      }
    } catch (e) {
      setError(e.message || "Error cargando caja");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAbrir() {
    const amount = Number(openingAmount);
    if (!isFinite(amount) || amount < 0) {
      setError("Monto inicial inválido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await abrirCaja(amount);
      setOpeningAmount("");
      await refreshAll();
    } catch (e) {
      setError(e.message || "No se pudo abrir la caja");
    } finally {
      setSaving(false);
    }
  }

  async function handleCerrar() {
    const amount = Number(closingAmount);
    if (!isFinite(amount) || amount < 0) {
      setError("Conteo final inválido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await cerrarCaja({ counted_amount: amount, notes: closingNotes || undefined });
      setClosingAmount("");
      setClosingNotes("");
      await refreshAll();
    } catch (e) {
      setError(e.message || "No se pudo cerrar la caja");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`space-y-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
      <h1 className="text-2xl font-bold">Caja</h1>

      {error && (
        <div className={`p-3 rounded border ${darkMode ? "border-red-500 text-red-300" : "border-red-300 text-red-700"}`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-4">Cargando…</div>
      ) : !isOpen ? (
        <div className={`p-4 rounded border ${darkMode ? "border-gray-700 bg-gray-800" : "border-slate-200 bg-white"}`}>
          <p className="mb-3">No hay una caja abierta para tu usuario.</p>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm mb-1">Monto inicial</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                onBlur={() => {
                  if (openingAmount === "" || openingAmount === null) return;
                  const n = Number(openingAmount);
                  if (isFinite(n)) setOpeningAmount(n.toFixed(2));
                }}
                className={`rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-300"}`}
              />
            </div>
            <button
              onClick={handleAbrir}
              disabled={saving}
              className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
            >
              {saving ? "Abriendo…" : "Abrir caja"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded border flex items-center justify-between ${darkMode ? "border-gray-700 bg-gray-800" : "border-slate-200 bg-white"}`}>
            <div>
              <p className="text-sm opacity-75">Saldos</p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="opacity-75">Efectivo:</span>{' '}
                  <span className="font-semibold">{fmtCurrency(saldoEfectivo)}</span>
                </p>
                <p className="text-sm">
                  <span className="opacity-75">Total (efectivo + electrónicos):</span>{' '}
                  <span className="font-semibold">{fmtCurrency(saldoTotal)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowDetalle(v => !v)}
                  className="mt-2 text-xs underline opacity-80 hover:opacity-100"
                >
                  {showDetalle ? "Ocultar detalle" : "Ver detalle"}
                </button>
              </div>
              {showDetalle && (
                <div className={`mt-3 p-3 rounded ${darkMode ? 'bg-gray-900/40' : 'bg-gray-50'}`}>
                  <p className="text-sm mb-2">
                    <span className="opacity-75" title="Es el saldo Total menos el Efectivo. Puede ser negativo si los movimientos electrónicos netos son egresos.">Electrónicos neto</span>:{' '}
                    <span className={electronicosNet < 0 ? "font-semibold text-red-600" : electronicosNet > 0 ? "font-semibold text-emerald-600" : "font-semibold"}>
                      {fmtCurrency(electronicosNet)}
                    </span>
                  </p>
                  {electronicosNet < 0 && (
                    <p className="text-xs opacity-70 mb-2">
                      Nota: los egresos electrónicos superan a los ingresos electrónicos; el total puede ser menor al efectivo.
                    </p>
                  )}
                  {/* Resumen por medio de pago */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left">
                          <th className="px-2 py-1">Medio</th>
                          <th className="px-2 py-1 text-right">Ingresos</th>
                          <th className="px-2 py-1 text-right">Egresos</th>
                          <th className="px-2 py-1 text-right">Neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(resumenPorMedio).map(([medio, vals]) => (
                          <tr key={medio} className="border-t border-gray-700/30">
                            <td className="px-2 py-1">{medio}</td>
                            <td className="px-2 py-1 text-right">{fmtCurrency(vals.ingresos)}</td>
                            <td className="px-2 py-1 text-right">{fmtCurrency(vals.egresos)}</td>
                            <td className={`px-2 py-1 text-right ${vals.neto < 0 ? 'text-red-600' : vals.neto > 0 ? 'text-emerald-600' : ''}`}>{fmtCurrency(vals.neto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Mini resumen de auditoría de apertura */}
              <p className="text-xs mt-1 opacity-70">
                {(() => {
                  const u = getAperturaUser(session);
                  const f = getAperturaFecha(session);
                  const m = getMontoInicial(session);
                  const partes = [];
                  if (u) partes.push(`Abierta por ${u}`);
                  if (f) partes.push(f.toLocaleString());
                  if (m !== null) partes.push(`Monto inicial ${fmtCurrency(m)}`);
                  return partes.length ? partes.join(' — ') : 'Apertura no disponible';
                })()}
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-sm mb-1">Conteo final</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  onBlur={() => {
                    if (closingAmount === "" || closingAmount === null) return;
                    const n = Number(closingAmount);
                    if (isFinite(n)) setClosingAmount(n.toFixed(2));
                  }}
                  className={`rounded p-2 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-300"}`}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className={`rounded p-2 border w-64 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-300"}`}
                  placeholder="billetes contados, caja fuerte, etc."
                />
              </div>
              <button
                onClick={handleCerrar}
                disabled={saving}
                className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60"
              >
                {saving ? "Cerrando…" : "Cerrar caja"}
              </button>
            </div>
          </div>

          <div className={`p-4 rounded border ${darkMode ? "border-gray-700 bg-gray-800" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Movimientos</h2>
              <button onClick={refreshAll} className="text-sm px-3 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-700">
                Refrescar
              </button>
            </div>
            {movsLoading ? (
              <div>Cargando movimientos…</div>
            ) : movs.length === 0 ? (
              <div className="text-sm opacity-70">Sin movimientos</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-2 py-1">Fecha</th>
                      <th className="px-2 py-1">Tipo</th>
                      <th className="px-2 py-1">Origen</th>
                      <th className="px-2 py-1">Medio</th>
                      <th className="px-2 py-1">Afecta caja</th>
                      <th className="px-2 py-1">Referencia</th>
                      <th className="px-2 py-1 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movs.map((m) => (
                      <tr key={m.id} className="border-t border-gray-700/30">
                        <td className="px-2 py-1">{new Date(m.created_at || m.fecha).toLocaleString()}</td>
                        <td className="px-2 py-1">{m.tipo}</td>
                        <td className="px-2 py-1">{m.origen}</td>
                        <td className="px-2 py-1">{m.id_tipo_pago_nombre || m.id_tipo_pago || m.medio || '-'}</td>
                        <td className="px-2 py-1">{
                          typeof m.afecta_caja === 'boolean'
                            ? (m.afecta_caja ? 'Sí' : 'No')
                            : ((m.id_tipo_pago_nombre || m.id_tipo_pago || '').toUpperCase() === 'EFECTIVO' ? 'Sí' : 'No')
                        }</td>
                        <td className="px-2 py-1">{m.ref_type} #{m.ref_id}</td>
                        <td className="px-2 py-1 text-right">{Number(m.monto).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
