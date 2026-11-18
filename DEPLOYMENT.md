# 🚀 Despliegue de Punto Maple

## URLs públicas

| Recurso | URL |
|---|---|
| **Tienda** | https://punto-maple-martins-projects-60ef29df.vercel.app |
| **Panel de operaciones** | https://punto-maple-martins-projects-60ef29df.vercel.app/admin |
| **API (health)** | https://punto-maple-backend.onrender.com/api/health |
| **Repositorio** | https://github.com/mabregu/punto-maple |

> La URL `*.vercel.app` es la de production. Si se agrega un dominio propio, Vercel lo tutorializará automáticamente.

## Accesos

- **Token del panel interno (`/admin`)**: `PM-ADM-c38316d30b8340699433b91a`
  - Se envía como header `x-admin-token` a los endpoints protegidos.
  - **Recomendación:** rotarlo en Render → Environment → `ADMIN_TOKEN`.
- **WhatsApp configurado**: `5491134591224` (corresponde a 11 3459-1224).

## Infraestructura

| Plataforma | Recurso | Detalle |
|---|---|---|
| Vercel | Proyecto `punto-maple` | Next.js 15, root directory `frontend`, Node 24.x |
| Render | Web service `punto-maple-backend` | Docker (`backend/Dockerfile`), plan free, región Oregon |
| Neon | Proyecto `mabregu` (id `young-bar-40958993`) | Rama `punto-maple` (`br-icy-morning-a5elpeze`), base `punto_maple`, Postgres 16 |

### Variables de entorno

**Vercel** (`punto-maple`):
- `NEXT_PUBLIC_API_URL` = `https://punto-maple-backend.onrender.com`
- `NEXT_PUBLIC_WHATSAPP_PHONE` = `5491134591224`
- `NEXT_PUBLIC_FREE_SHIPPING_MAPLES_THRESHOLD` = `3`
- `NEXT_PUBLIC_SHIPPING_COST_ARS` = `1500`
- `NEXT_PUBLIC_CASH_DISCOUNT_RATE` = `0.1`

**Render** (`punto-maple-backend`):
- `DATABASE_URL` (connection string de Neon, pooler)
- `ADMIN_TOKEN`
- `FREE_SHIPPING_MAPLES_THRESHOLD` = `3`
- `SHIPPING_COST_ARS` = `1500`
- `CASH_DISCOUNT_RATE` = `0.1`

## Flujo funcional verificado

1. La tienda carga el catálogo desde `GET /api/products` (con fallback local si Render está durmiendo).
2. El carrito calcula el progreso hacia los 3 maples y el envío gratis.
3. Al confirmar, `POST /api/orders` **valida precios y calcula totales en el servidor**, persiste el pedido en Neon y devuelve el texto listo para WhatsApp.
4. Se abre `wa.me/5491134591224` con el resumen y el código de pedido (`PM-YYYYMMDD-XXXX`).
5. El panel `/admin` lista pedidos, permite cambiar estados y moderar reseñas.

## Verificación rápida

```bash
curl https://punto-maple-backend.onrender.com/api/health
curl https://punto-maple-backend.onrender.com/api/products
curl -X POST https://punto-maple-backend.onrender.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Prueba","phone":"2215550000","zone":"Ensenada","street":"Calle 1","items":[{"productId":"pack-3-maples","quantity":1}]}'
```

## Edición de precios

Desde `/admin` → **Productos y precios** se puede cambiar el precio, la equivalencia en maples (umbral de envío gratis) y la visibilidad de cada SKU sin tocar código ni redesplegar. Los pedidos ya realizados conservan el precio histórico en `order_items`.

## Mercado Pago

- **App:** `Punto Maple`, ID `6581174382020281` (Checkout Pro, `online_payments`, `self_developed`, site `MLA`).
- **Sandbox:** webhook configurado en `https://punto-maple-backend.onrender.com/api/payments/webhook`, tópico `payment`.
- **Test user automático:** seller `3858066704`, app seller `2141164586081201`, buyer `3853745873`.
- **Credenciales de test** (`MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`) cargadas en Render. `MP_MODE=test`.
- **Fallback:** si el webhook no llega, la página `/pedido/[code]` llama a `POST /api/payments/verify` y consulta MP por `external_reference`.

### Pendiente de configuración manual (panel de MP)

1. Copiar el **secret completo del webhook** en Render → Environment → `MP_WEBHOOK_SECRET`:
   https://www.mercadopago.com.ar/developers/panel/app/6581174382020281/webhooks
   (_el MCP solo muestra los primeros 7 caracteres: `4f2ba9f…`_).
2. Completar la activación de la app para obtener credenciales **productivas** y configurar el webhook de producción.
3. Cambiar `MP_MODE=prod` y reemplazar `MP_ACCESS_TOKEN` / `MP_PUBLIC_KEY` por las de producción.
4. Cargar `FRONTEND_URL` con el dominio propio cuando lo tengas (hoy apunta al `*.vercel.app`).

> Mientras no haya secret, el backend acepta webhooks sin firma **solo en modo test**. En producción se exige firma válida.

## Pruebas

- Batería automática: `cd backend && ADMIN_TOKEN=<token> npm test` (12 tests, `node:test`).
- Circuito manual: ver `CHECKOUT_QA.md`.
- Los pedidos de la batería se crean con `is_test = true` y se limpian con:
  `curl -X DELETE https://punto-maple-backend.onrender.com/api/orders/test -H "x-admin-token: <token>"`

## Próximos pasos (roadmap)

- [ ] Integrar **Mercado Pago** (Checkout Pro → Bricks → Suscripciones).
- [ ] **WhatsApp Cloud API** para notificaciones automáticas (confirmación, "en camino", reseña).
- [ ] Formulario público de **reseñas** post-entrega (hoy existe la API y la moderación en `/admin`).
- [ ] **Suscripción "Club del Maple"** con cobro recurrente.
- [ ] Dominio propio y certificado (Vercel lo gestiona).
- [ ] Rotar `ADMIN_TOKEN` y mover secretos a un gestor.
