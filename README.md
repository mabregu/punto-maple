# 🥚 Punto Maple

Plataforma de venta online de huevos frescos de Punta Lara con entrega de última milla en Ensenada, Berisso y La Plata.

## Arquitectura

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | Next.js 15 + Tailwind CSS | **Vercel** |
| Backend | NestJS + PostgreSQL (`pg`) | **Render** (Docker) |
| Base de datos | PostgreSQL 16 | **Neon** (rama `punto-maple`, base `punto_maple`) |

```
punto-maple/
├── frontend/     # Next.js (tienda + panel /admin)
├── backend/      # NestJS API (/api/products, /api/orders, /api/reviews)
├── infra/        # schema.sql (DDL + datos iniciales)
├── PLAN_ESTRATEGICO.md
└── GUIA_OPERATIVA_PUNTO_MAPLE.md
```

## Endpoints

- `GET /api/health` — estado de la API y de la DB
- `GET /api/health/ping` — ping liviano para monitores externos (sin consulta a la DB)
- `GET /api/products` — catálogo activo
- `GET /api/products/admin` — todos los productos (requiere `x-admin-token`)
- `PATCH /api/products/:id` — edita precio, equivalencia en maples y visibilidad (requiere `x-admin-token`)
- `POST /api/orders` — crea pedido (calcula totals en servidor) y devuelve `whatsappText`
- `GET /api/orders/:code` — detalle de un pedido
- `GET /api/orders` — listado (requiere `x-admin-token`)
- `PATCH /api/orders/:code/status` — cambiar estado (requiere `x-admin-token`)
- `DELETE /api/orders/test` — borra solo pedidos con `is_test = true` (requiere `x-admin-token`)
- `POST /api/reviews` — crear reseña (queda `pending`)
- `GET /api/reviews` — reseñas aprobadas
- `GET /api/reviews/pending` — moderación (requiere `x-admin-token`)
- `PATCH /api/reviews/:id/:status` — aprobar/rechazar (requiere `x-admin-token`)

## Datos del cliente y ubicación

- Los datos de entrega se guardan en `localStorage` (`pm_customer_data`) si el cliente marca *"Recordar mis datos"*. Se pueden borrar desde el propio carrito.
- El botón *"Completar con mi ubicación actual"* usa `navigator.geolocation` + Nominatim (OpenStreetMap) para prellenar zona y calle, solo tras una acción del usuario. La dirección detectada siempre queda editable.

## Cupones y referidos

- `POST /api/coupons/validate` — valida un código y calcula el descuento (público).
- `GET /api/coupons` — listado (requiere `x-admin-token`).
- `POST /api/coupons` — crear cupón (requiere `x-admin-token`).
- `PATCH /api/coupons/:code` — activar/pausar (requiere `x-admin-token`).
- El campo `couponCode` en `POST /api/orders` aplica el cupón y incrementa sus usos en la misma transacción.
- Al aprobar una reseña se genera automáticamente un cupón `GRACIAS-XXXX` (10%, 1 uso) para el cliente.

## Reseñas

- `POST /api/reviews` — envía una reseña (queda `pending`). Formulario público en `/reseniar/[código]`.
- `GET /api/reviews` — reseñas aprobadas (se muestran en la home).
- `GET /api/reviews/pending` — moderación (requiere `x-admin-token`).
- `PATCH /api/reviews/:id/:status` — aprobar/rechazar (requiere `x-admin-token`).

## Pagos con Mercado Pago

Checkout Pro (Preferences API) como tercera opción, junto a Efectivo (-10%) y Transferencia.

- `POST /api/payments/preference` — crea la preferencia y devuelve `initPoint` (sandbox en test).
- `POST /api/payments/webhook` — valida `x-signature`, consulta `GET /v1/payments/{id}` y actualiza el pedido.
- `POST /api/payments/verify` — respaldo al volver del checkout; busca el pago por `external_reference`.
- `/pedido/[code]` — pantalla de resultado con sondeo automático.

Variables: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `MP_MODE`, `FRONTEND_URL`, `MP_APPLICATION_ID`.

## Pruebas

```bash
cd backend
npm test
# con limpieza y entorno explícito:
TEST_API_URL=https://punto-maple-backend.onrender.com ADMIN_TOKEN=<token> npm test
```

Circuitos manual y automático: ver `CHECKOUT_QA.md`.

## Regla de negocio

Envío gratis cuando el carrito alcanza `FREE_SHIPPING_MAPLES_THRESHOLD` maples (por defecto 3).
El equivalente en maples de cada presentación se configura en la tabla `products` (`maples_equivalent`).

**Descuento por pago en efectivo:** 10% sobre el subtotal de productos cuando el medio de pago es `Efectivo al recibir` (configurable con `CASH_DISCOUNT_RATE`). El envío no se descuenta. Transferencia y futuros pagos online no aplican descuento.

## Desarrollo local

```bash
# Base de datos
# Aplicar infra/schema.sql en Neon

# Backend
cd backend
npm install
DATABASE_URL="postgres://..." ADMIN_TOKEN="un-token-secreto" npm run start:dev

# Frontend
cd frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000' > .env.local
npm run dev
```

## Variables de entorno

### Backend (Render)
- `DATABASE_URL` — connection string de Neon
- `ADMIN_TOKEN` — token para el panel interno
- `FREE_SHIPPING_MAPLES_THRESHOLD` — default `3`
- `SHIPPING_COST_ARS` — default `1500`
- `CASH_DISCOUNT_RATE` — default `0.1` (10% en efectivo)
- `FRONTEND_URL` — URL de Vercel (para CORS, opcional)

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` — URL del backend en Render
- `NEXT_PUBLIC_WHATSAPP_PHONE` — número en formato `549221XXXXXXX` (**reemplazar**)
- `NEXT_PUBLIC_FREE_SHIPPING_MAPLES_THRESHOLD` — default `3`
- `NEXT_PUBLIC_SHIPPING_COST_ARS` — default `1500`
- `NEXT_PUBLIC_CASH_DISCOUNT_RATE` — default `0.1`
