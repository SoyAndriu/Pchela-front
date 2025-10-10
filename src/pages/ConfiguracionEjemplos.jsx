import React from "react";
import useSettings from "../hooks/useSettings";

// Página de configuración de ejemplo: muestra categorías de ajustes como demostración.
// No persiste ni modifica nada; es solo mock UI para explorar opciones futuras.
export default function ConfiguracionEjemplos({ darkMode }) {
  const { settings, loading, save, reset } = useSettings();
  const sectionCls = `${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"} border rounded-lg p-4`;
  const titleCls = `${darkMode ? "text-white" : "text-slate-900"} text-lg font-semibold`;
  const itemTitle = `${darkMode ? "text-gray-100" : "text-slate-800"} font-medium`;
  const itemDesc = `${darkMode ? "text-gray-400" : "text-slate-500"} text-sm`;

  const Chip = ({ children }) => (
    <span className={`inline-block rounded px-2 py-0.5 text-xs ${darkMode ? "bg-gray-700 text-gray-300" : "bg-slate-100 text-slate-600"}`}>{children}</span>
  );

  const Section = ({ title, children }) => (
    <section className={sectionCls}>
      <h3 className={titleCls}>{title}</h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </section>
  );

  const Row = ({ title, desc, tags = [] }) => (
    <div className={`${darkMode ? "border-gray-700" : "border-slate-200"} border rounded p-3`}> 
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className={itemTitle}>{title}</div>
          <div className={itemDesc}>{desc}</div>
        </div>
        <div className="flex gap-2 flex-wrap">{tags.map((t, i) => <Chip key={i}>{t}</Chip>)}</div>
      </div>
    </div>
  );

  if (loading) return <div className={darkMode ? "text-gray-300" : "text-slate-600"}>Cargando opciones…</div>;

  const Input = ({ label, value, onChange, type = 'text', min, max, step }) => (
    <label className="grid gap-1 text-sm">
      <span className={darkMode ? "text-gray-300" : "text-slate-700"}>{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className={`px-2 py-1 rounded border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"}`}
      />
    </label>
  );

  const Toggle = ({ label, checked, onChange }) => (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-pink-600" />
      <span className={darkMode ? "text-gray-300" : "text-slate-700"}>{label}</span>
    </label>
  );

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? "text-pink-200" : "text-pink-700"}`}>Configuración (ejemplos)</h2>
      <p className={`${darkMode ? "text-gray-400" : "text-slate-600"}`}>
        Esta página muestra opciones de configuración de ejemplo. Guardan en tu navegador, pero no afectan otras pantallas ni el backend.
      </p>
      <div className="flex gap-2">
        <button onClick={() => reset()} className={`px-3 py-1.5 rounded border ${darkMode ? "border-gray-600 hover:bg-gray-700" : "border-slate-300 hover:bg-slate-50"}`}>Restablecer a valores por defecto</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Generales">
          <div className="grid gap-3">
            <Input label="Moneda" value={settings.general.currency} onChange={(v) => save({ general: { currency: v } })} />
            <Input label="Formato de número" value={settings.general.numberFormat} onChange={(v) => save({ general: { numberFormat: v } })} />
            <Input label="Formato de fecha" value={settings.general.dateFormat} onChange={(v) => save({ general: { dateFormat: v } })} />
            <Input label="Zona horaria" value={settings.general.timezone} onChange={(v) => save({ general: { timezone: v } })} />
            <Input label="IVA por defecto (%)" type="number" min={0} max={100} step={1} value={settings.general.vat} onChange={(v) => save({ general: { vat: Number(v) } })} />
            <Toggle label="Modo oscuro por defecto" checked={settings.general.branding.darkModeDefault} onChange={(v) => save({ general: { branding: { darkModeDefault: v } } })} />
          </div>
        </Section>

        <Section title="Inventario y lotes">
          <div className="grid gap-3">
            <div className="grid md:grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className={darkMode ? "text-gray-300" : "text-slate-700"}>Método de costeo</span>
                <select
                  value={settings.inventory.costingMethod}
                  onChange={(e) => save({ inventory: { costingMethod: e.target.value } })}
                  className={`px-2 py-1 rounded border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"}`}
                >
                  <option value="weighted_avg">Promedio ponderado</option>
                  <option value="fifo">FIFO</option>
                  <option value="lifo">LIFO</option>
                </select>
              </label>
              <Input label="Stock mínimo (global)" type="number" min={0} value={settings.inventory.lowStockThreshold} onChange={(v) => save({ inventory: { lowStockThreshold: Number(v) } })} />
            </div>
            <Toggle label="Lote obligatorio" checked={settings.inventory.lot.required} onChange={(v) => save({ inventory: { lot: { required: v } } })} />
            <Toggle label="Confirmar número de lote" checked={settings.inventory.lot.confirmNumber} onChange={(v) => save({ inventory: { lot: { confirmNumber: v } } })} />
            <Toggle label="Permitir lotes duplicados" checked={settings.inventory.lot.allowDuplicates} onChange={(v) => save({ inventory: { lot: { allowDuplicates: v } } })} />
            <Input label="Días de alerta antes del vencimiento" type="number" min={0} value={settings.inventory.lot.expiryAlertDays} onChange={(v) => save({ inventory: { lot: { expiryAlertDays: Number(v) } } })} />
            <Toggle label="Unidades y conversiones" checked={settings.inventory.unitsEnabled} onChange={(v) => save({ inventory: { unitsEnabled: v } })} />
            <Toggle label="Códigos de barras/QR" checked={settings.inventory.barcodeEnabled} onChange={(v) => save({ inventory: { barcodeEnabled: v } })} />
          </div>
        </Section>

        <Section title="Ventas y caja">
          <div className="grid gap-3">
            <div className="grid md:grid-cols-3 gap-3">
              <Input label="Desc. máx. cajero (%)" type="number" min={0} max={100} value={settings.sales.discountLimits.cajero} onChange={(v) => save({ sales: { discountLimits: { cajero: Number(v) } } })} />
              <Input label="Desc. máx. empleado (%)" type="number" min={0} max={100} value={settings.sales.discountLimits.empleado} onChange={(v) => save({ sales: { discountLimits: { empleado: Number(v) } } })} />
              <Input label="Desc. máx. gerente (%)" type="number" min={0} max={100} value={settings.sales.discountLimits.gerente} onChange={(v) => save({ sales: { discountLimits: { gerente: Number(v) } } })} />
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <Toggle label="Efectivo" checked={settings.sales.paymentMethods.cash} onChange={(v) => save({ sales: { paymentMethods: { cash: v } } })} />
              <Toggle label="Tarjeta" checked={settings.sales.paymentMethods.card} onChange={(v) => save({ sales: { paymentMethods: { card: v } } })} />
              <Toggle label="Transferencia" checked={settings.sales.paymentMethods.transfer} onChange={(v) => save({ sales: { paymentMethods: { transfer: v } } })} />
              <Toggle label="QR" checked={settings.sales.paymentMethods.qr} onChange={(v) => save({ sales: { paymentMethods: { qr: v } } })} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Decimales" type="number" min={0} max={4} value={settings.sales.rounding.decimals} onChange={(v) => save({ sales: { rounding: { decimals: Number(v) } } })} />
              <label className="grid gap-1 text-sm">
                <span className={darkMode ? "text-gray-300" : "text-slate-700"}>Modo de redondeo</span>
                <select
                  value={settings.sales.rounding.mode}
                  onChange={(e) => save({ sales: { rounding: { mode: e.target.value } } })}
                  className={`px-2 py-1 rounded border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"}`}
                >
                  <option value="nearest">Más cercano</option>
                  <option value="up">Hacia arriba</option>
                  <option value="down">Hacia abajo</option>
                </select>
              </label>
            </div>
            <Toggle label="Imprimir ticket automáticamente" checked={settings.sales.autoPrintTicket} onChange={(v) => save({ sales: { autoPrintTicket: v } })} />
            <Toggle label="Comprobantes por sucursal" checked={settings.sales.comprobantes.perSucursal} onChange={(v) => save({ sales: { comprobantes: { perSucursal: v } } })} />
          </div>
        </Section>

        <Section title="Usuarios y seguridad">
          <div className="grid gap-3">
            <Toggle label="Recordarme por defecto" checked={settings.security.rememberDefault} onChange={(v) => save({ security: { rememberDefault: v } })} />
            <Input label="Expiración por inactividad (min)" type="number" min={5} step={5} value={settings.security.sessionTimeoutMin} onChange={(v) => save({ security: { sessionTimeoutMin: Number(v) } })} />
            <Toggle label="Habilitar 2FA" checked={settings.security.twoFA} onChange={(v) => save({ security: { twoFA: v } })} />
            <Toggle label="Auditoría de eventos" checked={settings.security.audit} onChange={(v) => save({ security: { audit: v } })} />
          </div>
        </Section>

        <Section title="Integraciones">
          <div className="grid gap-3">
            <Toggle label="SMTP habilitado" checked={settings.integrations.smtpEnabled} onChange={(v) => save({ integrations: { smtpEnabled: v } })} />
            <Toggle label="WhatsApp habilitado" checked={settings.integrations.whatsappEnabled} onChange={(v) => save({ integrations: { whatsappEnabled: v } })} />
          </div>
          <Row title="Webhooks" desc="Esta sección soportará agregar endpoints y eventos (solo demo)." tags={["webhooks"]} />
          <Row title="Backups" desc="Respaldo a Google Drive/Dropbox (solo demo)." tags={["backups"]} />
          <Row title="Contabilidad" desc="Exportación a contabilidad (solo demo)." tags={["export"]} />
        </Section>

        <Section title="Sucursales y almacenes">
          <div className="grid gap-3">
            <Toggle label="Habilitar multi-sucursal" checked={settings.branches.multiSucursal} onChange={(v) => save({ branches: { multiSucursal: v  } })} />
            <Toggle label="Prefijos por sucursal" checked={settings.branches.prefijosPorSucursal} onChange={(v) => save({ branches: { prefijosPorSucursal: v } })} />
          </div>
        </Section>

        <Section title="UI y datos maestros">
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className={darkMode ? "text-gray-300" : "text-slate-700"}>Inicio por rol</span>
              <input
                value={settings.ui.landingByRole.gerente}
                onChange={(e) => save({ ui: { landingByRole: { gerente: e.target.value } } })}
                className={`px-2 py-1 rounded border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"}`}
              />
              <div className={itemDesc}>Gerente</div>
            </label>
            <label className="grid gap-1 text-sm">
              <input
                value={settings.ui.landingByRole.empleado}
                onChange={(e) => save({ ui: { landingByRole: { empleado: e.target.value } } })}
                className={`px-2 py-1 rounded border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"}`}
              />
              <div className={itemDesc}>Empleado</div>
            </label>
            <label className="grid gap-1 text-sm">
              <input
                value={settings.ui.landingByRole.cajero}
                onChange={(e) => save({ ui: { landingByRole: { cajero: e.target.value } } })}
                className={`px-2 py-1 rounded border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"}`}
              />
              <div className={itemDesc}>Cajero</div>
            </label>
            <label className="grid gap-1 text-sm">
              <span className={darkMode ? "text-gray-300" : "text-slate-700"}>Densidad de tabla</span>
              <select
                value={settings.ui.tableDensity}
                onChange={(e) => save({ ui: { tableDensity: e.target.value  } })}
                className={`px-2 py-1 rounded border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-slate-300"}`}
              >
                <option value="compact">Compacta</option>
                <option value="comfortable">Cómoda</option>
                <option value="spacious">Espaciada</option>
              </select>
            </label>
            <Toggle label="Atajos y confirmaciones" checked={settings.ui.shortcuts} onChange={(v) => save({ ui: { shortcuts: v } })} />
          </div>
          <Row title="Atributos y campos personalizados" desc="Atributos de producto/campos custom (demo)." tags={["custom fields"]} />
          <Row title="Filtros guardados" desc="Guardar filtros frecuentes (demo)." tags={["filtros"]} />
        </Section>
      </div>

      <div className={`${darkMode ? "text-gray-400" : "text-slate-500"} text-sm`}>
        Nota: Esta página es demostrativa. Las opciones se guardan localmente como referencia. Activarlas de verdad requerirá wiring en backend y vistas.
      </div>
    </div>
  );
}
