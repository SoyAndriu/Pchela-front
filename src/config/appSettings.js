// Defaults de configuración de ejemplo (solo UI; no afectan otras vistas)
export const DEFAULT_SETTINGS = {
  general: {
    currency: 'ARS',
    numberFormat: '1.234,56',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'America/Argentina/Buenos_Aires',
    branding: {
      darkModeDefault: false,
    },
    vat: 21,
  },
  inventory: {
    costingMethod: 'weighted_avg', // 'weighted_avg' | 'fifo' | 'lifo'
    lowStockThreshold: 10,
    lot: {
      required: true,
      confirmNumber: true,
      allowDuplicates: false,
      expiryAlertDays: 30,
    },
    unitsEnabled: false,
    barcodeEnabled: false,
  },
  sales: {
    discountLimits: { cajero: 5, empleado: 10, gerente: 100 },
    paymentMethods: { cash: true, card: true, transfer: true, qr: false },
    rounding: { decimals: 2, mode: 'nearest' }, // 'up' | 'down' | 'nearest'
    autoPrintTicket: false,
    enableVentasApi: true,
    comprobantes: { perSucursal: false },
  },
  security: {
    rememberDefault: false,
    sessionTimeoutMin: 60,
    twoFA: false,
    audit: true,
  },
  integrations: {
    smtpEnabled: false,
    whatsappEnabled: false,
    webhooks: [],
  },
  branches: {
    multiSucursal: false,
    prefijosPorSucursal: false,
  },
  ui: {
    landingByRole: { gerente: '/gerente', empleado: '/empleado', cajero: '/cajero' },
    tableDensity: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
    shortcuts: true,
  },
  masterData: {
    productAttributes: [],
    customFields: { proveedores: [], clientes: [] },
    savedFilters: [],
  },
  _meta: {
    version: 1,
  },
};

export const SETTINGS_STORAGE_KEY = 'appSettings';
