# Pchela Frontend (React + Vite)

(Documento alternativo mientras se migra el README principal; este archivo contiene la documentación actualizada completa.)

Aplicación React (Vite) para gestión de productos, clientes, ventas y caja. Usa Tailwind para estilos y React Router para navegación.

## Características Clave

- Gestión de productos con filtros, lotes y estadísticas.
- Módulo de clientes con búsqueda inteligente (email / DNI / nombre) y prevención de duplicados.
- Flujo de ventas soportando cliente opcional ("Consumidor final").
- Estado de caja con apertura/cierre y badge reactivo en sidebar.
- Dark mode toggle.

## Configuración Rápida

```powershell
npm install
npm run dev
```

Asegurate de tener el backend corriendo en la URL definida en `API_BASE` (`src/config/productConfig.js`).

## CajaStatusBadge

Componente que muestra el estado de la caja (abierta / cerrada) y permite abrir o cerrar.

Props principales:
- `darkMode`: estilos oscuros.
- `compact`: modo compacto (usa tooltip + aria-label, sin botones). Ideal para sidebars.
- `ariaLabel`: etiqueta accesible personalizada (opcional).

Modo compacto: indicador de color + texto abreviado en pantallas grandes (`hidden xl:inline`), con `title` y `aria-label`.

## Prevención de Duplicados (Clientes)

El hook `useClientes` hace pre-validación con `/clientes/unique-check/` antes del POST:

1. Si `exists: true`, evita crear duplicado.
2. Si el endpoint (futuro) devuelve `cliente`, se reutiliza directamente sin segundo fetch.
3. Fallback: hace GET filtrado para traer el registro y autoseleccionarlo.

### Métricas de Desarrollo

En desarrollo se loguea:
`[useClientes.metrics] uniqueCheck #N duplicados=X (Y%)`.

Sirve para evaluar efectividad del pre-check.

## Búsqueda de Clientes

Heurística del parámetro según término ingresado:
- Contiene `@` -> `email=` exacto.
- Solo dígitos (>=6) -> `dni=` exacto.
- Caso contrario -> `search=` (nombre).

Errores 5xx se manejan con mensaje suave y se permite continuar creando cliente.

## Ordering (Flag Interno)

`ENABLE_ORDERING` (actualmente `false`) en `useClientes.search`. Activarlo cuando el backend estabilice ordering para ordenar por `nombre_completo`.

## Variables / Flags Clave

Archivo `src/config/productConfig.js`:
- `API_BASE`: URL base API.
- `PAGE_SIZE`: tamaño de página de productos.
- `DEBUG_CAJA`: logs detallados de caja (mantener `false` en prod).

## Accesibilidad

- `CajaStatusBadge` (modo completo): `role="status"`, `aria-live="polite"`.
- Modo compacto: `aria-label` + `title`.

## Scripts

```jsonc
"dev": "vite",
"build": "vite build",
"preview": "vite preview",
"lint": "eslint ."
```

## Requisitos

- Node 18+
- Backend con endpoints: `/api/clientes/`, `/api/clientes/unique-check/`, `/api/ventas/`, etc.

## Estructura Simplificada

```
src/
  components/
    CajaStatusBadge.jsx
    clientes/ClienteFormModal.jsx
  hooks/useClientes.js
  config/productConfig.js
```

## Futuras Mejoras

- Tests unitarios `uniqueCheck`.
- Sidebar colapsable completo con iconos.
- Devolver cliente en unique-check.
- i18n.

---

# Descripción General y Propósito

Pchela Frontend es la interfaz web para la gestión integral de una empresa de productos y servicios. Permite administrar productos, lotes, clientes, ventas y caja, integrándose con un backend RESTful. El objetivo es ofrecer una experiencia ágil, robusta y accesible para usuarios de distintos roles (cajero, gerente, empleado).

# Módulos Principales y Funcionalidades

- **Productos**: Alta, edición, filtros por stock, lotes, estadísticas, imágenes.
- **Clientes**: Búsqueda inteligente, creación/actualización, validación de duplicados, selección rápida, integración con ventas.
- **Ventas**: Flujo de cobro, integración con caja, soporte para "Consumidor final" (sin cliente).
- **Caja**: Estado en tiempo real, apertura/cierre, badge visual en sidebar, logs de depuración.
- **Reportes**: (opcional/futuro) exportación y visualización de métricas.
- **Usuarios/Roles**: Permisos y vistas diferenciadas según rol (cajero, gerente, empleado).

# Estructura de Carpetas y Archivos Clave

```
frontend/
├── public/           # Imágenes y assets estáticos
├── src/
│   ├── components/   # Componentes reutilizables (Header, Badge, Modals)
│   ├── hooks/        # Hooks personalizados (useClientes, useCaja, etc)
│   ├── pages/        # Vistas principales (Dashboard, Products, Clientes)
│   ├── fronts/       # Layouts y vistas por rol (cajero, gerente, empleado)
│   ├── config/       # Configuración global (API_BASE, flags)
│   ├── utils/        # Utilidades compartidas
│   └── assets/       # Imágenes internas
├── package.json      # Dependencias y scripts
├── README.md         # Documentación principal (migrar desde PROJECT_DOC.md)
└── PROJECT_DOC.md    # Documentación extendida
```

# Dependencias y Herramientas

- **React 19**: UI principal.
- **Vite**: Bundler y servidor dev.
- **TailwindCSS**: Estilos utilitarios y responsivos.
- **Heroicons**: Iconografía SVG.
- **React Router**: Navegación SPA.
- **ESLint**: Linting y calidad de código.

# Flujo de Trabajo Típico

1. Instalar dependencias: `npm install`
2. Levantar entorno dev: `npm run dev`
3. Editar código en `src/` según módulo.
4. Validar cambios con ESLint: `npm run lint`
5. Build para producción: `npm run build`
6. Desplegar carpeta `dist/` en servidor web.

# Integración con Backend

- **API_BASE**: Definido en `src/config/productConfig.js`.
- **Endpoints clave**:
  - `/api/clientes/` (GET, POST, PATCH)
  - `/api/clientes/unique-check/` (GET)
  - `/api/ventas/` (POST)
  - `/api/caja/` (GET, POST, PATCH)
- **Contratos**: El frontend espera respuestas JSON con paginación (`results`), validaciones (`exists`), y objetos completos para selección rápida.
- **Errores**: Manejo resiliente de 400/500, mensajes amigables y fallback manual.

# Decisiones Técnicas y Convenciones

- **Hooks**: Toda la lógica de negocio y fetch se encapsula en hooks (`useClientes`, `useCaja`).
- **Validación**: Se sanitizan payloads antes de enviar al backend para evitar errores por campos vacíos.
- **Accesibilidad**: Uso de roles, aria-labels y tooltips en componentes clave.
- **Dark Mode**: Toggle global, persistente por sesión.
- **Modularidad**: Componentes y hooks desacoplados para facilitar mantenimiento y testing.

# Accesibilidad y UX

- Navegación clara y responsiva.
- Badges e indicadores visuales con soporte para lectores de pantalla.
- Mensajes de error y confirmación accesibles.
- Formularios con validación en tiempo real y feedback inmediato.

# Recomendaciones de Despliegue y Ambiente

- Node 18+ y npm actualizado.
- Backend corriendo en la URL configurada.
- Desplegar `dist/` en servidor web (Nginx, Apache, Vercel, Netlify, etc).
- Mantener `DEBUG_CAJA` en `false` en producción.
- Revisar variables de entorno y CORS en backend.

# Mejoras Futuras y Notas de Contribución

- Tests unitarios y de integración (Jest, React Testing Library).
- Sidebar colapsable y personalizable.
- Internacionalización (i18n) y soporte multilenguaje.
- Mejorar feedback visual en ventas y caja.
- Documentar endpoints backend y contratos esperados.
- Abrir issues y PRs siguiendo convenciones de commit y revisión.

---

Para dudas, sugerencias o contribuciones, contactá al responsable del repo o abrí un issue. Este documento puede copiarse directamente en el README principal.
