# Neo Business — Frontend

Panel de operaciones para negocios pequeños y medianos. Conecta con el backend de Rails 8 y cubre ventas, inventario, compras y reportes en tiempo real.

Stack: **Nuxt 3**, **Pinia**, **Tailwind CSS v4**, **shadcn-vue**.

---

## Requisitos

- Node.js 20+
- Backend Rails corriendo en `http://127.0.0.1:3000` (por defecto)

## Instalación

```bash
npm install
npm run dev       # http://localhost:3000
```

Para cambiar la URL del backend, crea un `.env`:

```env
NUXT_API_BASE=http://tu-backend.com/api/v1
NUXT_CABLE_URL=ws://tu-backend.com/cable
```

---

## Login

Entra con las credenciales de tu negocio en `/login`. La sesión se guarda en una cookie `httpOnly` — no hay tokens en `localStorage`. Si el token expira, te redirige al login con un aviso visible.

```
admin@example.com / password123   ← credenciales de seed local
```

---

## Módulos

### Panel (/)

Resumen del día en tiempo real vía ActionCable:
- Métricas: ventas del día, margen bruto, ticket promedio, stock bajo
- Gráfico de barras por hora
- Top productos, últimas ventas, métodos de pago
- Accesos rápidos a POS, compras, inventario, reportes

### POS (/pos)

Punto de venta con carrito, pagos mixtos y apertura/cierre de caja.

```
1. Abre caja → ingresa monto inicial
2. Busca productos y agrégalos al carrito
3. Ajusta cantidades o descuentos por línea
4. Agrega pagos (efectivo, tarjeta, transferencia o mezcla)
5. Selecciona tipo de documento (ticket / factura / CCF)
6. Cobra → Rails registra la venta y descuenta inventario
```

Soporta idempotencia: si haces clic dos veces en "Cobrar", no crea dos ventas.

### Ventas (/ventas)

Historial con filtros por fecha, número de venta y sesión de caja. Puedes anular una venta pagada con motivo obligatorio (mínimo 5 caracteres).

### Inventario (/inventario)

7 pestañas:

| Pestaña | Qué hace |
|---|---|
| Existencias | Stock por producto y bodega |
| Kardex | Movimientos cronológicos de un producto |
| Mínimos | Umbral de alerta editable |
| Ajustes | Entrada/salida manual con notas |
| Transferencias | Mover stock entre bodegas |
| Historial | Últimos movimientos de una bodega |
| Alertas | Productos bajo mínimo |

### Compras (/compras)

Registra compras a proveedor con múltiples líneas de producto. Cada línea puede actualizar el costo del producto automáticamente. Soporta anulación con motivo (revierte el inventario en Rails).

```
Proveedor → Bodega → Documento → Líneas (producto / cant / costo / IVA) → Registrar
```

### Reportes (/reportes)

5 reportes filtrables por fecha, sucursal y bodega. Todos exportan a CSV con BOM UTF-8 (compatible con Excel).

| Reporte | Endpoint |
|---|---|
| Ventas por rango | `/reports/sales` |
| Margen bruto | `/reports/gross_margin` |
| Productos más vendidos | `/reports/top_products` |
| Ventas por cajero | `/reports/sales_by_cashier` |
| Métodos de pago | `/reports/payment_methods` |

### Catálogos

Páginas CRUD para productos, categorías, unidades, marcas, clientes, proveedores y métodos de pago. Comparten el componente `ResourcePage` que gestiona listado, creación, edición y baja lógica.

### Administración

- **Mi negocio**: datos del store, NIT, NRC, actividad económica
- **Sucursales / Bodegas / Cajas**: gestión de infraestructura del negocio
- **Usuarios**: asignación de roles por usuario
- **Configuración**: preferencias de la cuenta

---

## Permisos

Cada página declara el permiso requerido:

```ts
definePageMeta({ middleware: 'permission', permission: 'sales.read' })
```

Si el usuario no tiene el permiso, ve una página de error 403 decorosa. Los roles `admin` y `superadmin` tienen acceso total. El sidebar solo muestra las secciones permitidas para el rol activo.

Roles disponibles: `superadmin`, `admin`, `manager`, `cajero`, `bodeguero`.

---

## Tiempo real

El dashboard se actualiza por ActionCable cuando Rails emite eventos:

- `sale_created` → incrementa contador y agrega a últimas ventas
- `daily_total_updated` → actualiza el total del día
- `low_stock` → dispara notificación de stock bajo
- `stock_updated` → registra en el feed de actividad

---

## Estructura del proyecto

```
app/
  pages/          ← una página por ruta
  components/
    base/         ← AppShell, Sidebar, GlobalSearch, MetricCard...
    ui/           ← Button, Badge, Card, Input (shadcn-vue)
    admin/        ← ResourcePage, CatalogOverview
    inventory/    ← MovementTable
  stores/         ← auth, pos, inventory, purchases, reports, dashboard...
  composables/    ← useApi (proxy al backend), usePermissions
  types/          ← normalización de respuestas Rails → tipos TS
  middleware/     ← auth.global.ts, permission.ts
server/
  api/
    auth/         ← login, logout, me, cable-token
    backend/      ← proxy [...path].ts → Rails (inyecta el token)
```

---

## Proxy al backend

El frontend no llama directo a Rails. Todo pasa por `/api/backend/[...path]` en el servidor de Nuxt, que inyecta el token JWT desde la cookie `httpOnly`. Así el token nunca queda expuesto en el navegador.

```
Browser → /api/backend/sales → Nuxt server → Rails /api/v1/sales
```

---

## Errores y sesión

- **401**: `useApi` detecta la respuesta, limpia la sesión local y redirige a `/login?reason=expired`
- **403**: `permission.ts` aborta la navegación y muestra la página de error con descripción
- **Errores de validación**: Rails devuelve `{errors: {...}}` y el frontend los muestra campo por campo

---

## Producción

```bash
npm run build
node .output/server/index.mjs
```

Variables de entorno requeridas en producción:

```env
NUXT_API_BASE=https://api.tudominio.com/api/v1
NUXT_CABLE_URL=wss://api.tudominio.com/cable
```
