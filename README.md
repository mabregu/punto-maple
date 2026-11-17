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
- `GET /api/products` — catálogo activo
- `POST /api/orders` — crea pedido (calcula totals en servidor) y devuelve `whatsappText`
- `GET /api/orders/:code` — detalle de un pedido
- `GET /api/orders` — listado (requiere `x-admin-token`)
- `PATCH /api/orders/:code/status` — cambiar estado (requiere `x-admin-token`)
- `POST /api/reviews` — crear reseña (queda `pending`)
- `GET /api/reviews` — reseñas aprobadas
- `GET /api/reviews/pending` — moderación (requiere `x-admin-token`)
- `PATCH /api/reviews/:id/:status` — aprobar/rechazar (requiere `x-admin-token`)

## Regla de negocio

Envío gratis cuando el carrito alcanza `FREE_SHIPPING_MAPLES_THRESHOLD` maples (por defecto 3).
El equivalente en maples de cada presentación se configura en la tabla `products` (`maples_equivalent`).

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
- `FRONTEND_URL` — URL de Vercel (para CORS, opcional)

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` — URL del backend en Render
- `NEXT_PUBLIC_WHATSAPP_PHONE` — número en formato `549221XXXXXXX` (**reemplazar**)
- `NEXT_PUBLIC_FREE_SHIPPING_MAPLES_THRESHOLD` — default `3`
- `NEXT_PUBLIC_SHIPPING_COST_ARS` — default `1500`
