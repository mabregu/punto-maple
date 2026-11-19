# 🧪 Circuito de pruebas — Punto Maple

Dos capas complementarias:

1. **Batería automática** → reglas de negocio y API (se corre en segundos).
2. **Circuito manual** → experiencia real en celular + WhatsApp.

---

## A. Batería automática

Sin dependencias nuevas (usa `node:test`, incluido en Node 24).

```bash
cd backend
npm test
```

Contra un entorno específico y con limpieza habilitada:

```bash
TEST_API_URL=https://punto-maple-backend.onrender.com \
ADMIN_TOKEN=<token-del-panel> \
npm test
```

La variable `ADMIN_TOKEN` habilita los dos últimos tests (acceso al panel y limpieza de pedidos `is_test = true`). Si no la pasás, esos tests se omiten y los pedidos de prueba quedan en Neon con el badge **PRUEBA**.

**Cubre:** health/DB · catálogo · envío gratis en 3 maples · envío pagado en 2,4 · precios manipulados desde el cliente · carrito vacío · producto inexistente · campos incompletos · rating inválido · protección del panel · limpieza.

---

## B. Circuito manual (10–12 min)

### Preparación
- [ ] Abrí la tienda en el **celular** (no solo en la PC): https://punto-maple-martins-projects-60ef29df.vercel.app
- [ ] Ideal: hacé el pedido desde un **segundo número** o pedile a un familiar. Si usás tu propio celular, el chat de WhatsApp será **con vos mismo** (el número del negocio es el tuyo): sirve para revisar el texto, pero no simula la experiencia real.
- [ ] Usá un nombreTipo `PRUEBA - Tu nombre` para que el pedido quede marcado.

### Flujo

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Cargar la home | Aparecen los 4 productos y la barra "Agregá X maples más" |
| 2 | Agregar 1 maple de 30 | Barra al 33%; carrito dice "$4.900 + $1.500 de envío" |
| 3 | Sumar 2 maples más (total 3) | Barra verde: "¡Tenés ENVÍO GRATIS asegurado!"; envío $0; con Efectivo: descuento -$1.470 y total **$13.230**; con Transferencia: total $14.700 |
| 4 | Abrir el carrito | Precios, cantidades y `+ / -` correctos; al bajar a 2 el envío vuelve a $1.500 |
| 5 | Completar nombre, teléfono, zona y calle; en *Referencias* escribir "Portón negro, casa de dos plantas" | Si falta alguno de los obligatorios, el botón muestra el aviso. Las referencias son opcionales y aparecen en el paso 8 |
| 6 | Elegir "Transferencia" | El mensaje dice *Forma de Pago: Transferencia (CBU/Alias)* y **no** incluye línea de descuento; al volver a Efectivo aparece "Descuento por pago en efectivo (10%)" |
| 7 | Tocar "Confirmar Pedido por WhatsApp" | Se abre `wa.me/5491134591224` con el resumen **ya redactado** |
| 8 | Revisar el mensaje | Código `PM-YYYYMMDD-XXXX`, acentos correctos (Martín, Nº), **sin emojis ni símbolos raros**, negritas con `*`, viñetas con `-`, línea `*Referencias:* Portón negro, casa de dos plantas`, línea de descuento y saludo final |
| 9 | **No hace falta enviarlo** para validar; si querés probar extremo a extremo, enviarlo y ver que llegue | El chat se abre con el número del negocio |
| 10 | Abrir `/admin`, ingresar el token | El pedido aparece con badge **PRUEBA**, zone, dirección y total correctos |
| 11 | Cambiar el estado a "preparando" y "entregado" | El badge cambia y la métrica "Pedidos activos" baja |
| 12 | Probar un pedido de 2,4 maples (2×30 + 1×12) | Subtotal $12.000, envío $1.500, descuento -$1.200 y total **$12.300** |

### Casos límite (opcional pero recomendado)
- [ ] Borrar todos los productos del carrito → el botón se deshabilita.
- [ ] Cargar la página con la API caída (podés apagar el servicio de Render un momento) → debe seguir mostrando el catálogo de respaldo.
- [ ] Probar desde Firefox/Safari además de Chrome.
- [ ] Pedir a alguien que **no conozca** el proyecto que arme un pedido sin instrucciones: ¿entiende qué es un "maple" y por qué conviene 3?

---

## C. Limpieza

Después del circuito:

1. En `/admin`, pasá los pedidos de prueba a **cancelado**, o
2. Limpialos todos de una vez:

```bash
curl -X DELETE https://punto-maple-backend.onrender.com/api/orders/test \
  -H "x-admin-token: <token-del-panel>"
```

> El endpoint **solo borra pedidos con `is_test = true`**. Los pedidos reales nunca se tocan.

Verificá que no queden rastros:

```bash
curl https://punto-maple-backend.onrender.com/api/health
```

---

## C-2. Circuito de Mercado Pago (sandbox)

1. Elegí **💳 Mercado Pago** como medio de pago y confirmá el pedido.
2. Se abre el checkout sandbox de MP (`sandbox_init_point`). **No** se abre WhatsApp.
3. Pagá con una tarjeta de prueba MLA (ej. Visa `4509 9535 6623 3704`, venc. `11/30`, CVV `123`, titular `APRO`).
4. Al volver, la URL debe ser `/pedido/PM-...?status=approved` y mostrar **¡Pago aprobado!**.
5. Verificá en `/admin` que el pedido tenga badge **PAGADO MP** y estado `pagado`.
6. Si el webhook no llega (limitación del test user automático), la página de retorno igual consulta MP por `external_reference` y actualiza el pedido.

> Para producción hay que activar la app, configurar el webhook productivo y cargar `MP_WEBHOOK_SECRET` en Render.

## C-3. Circuito de reseñas

1. En `/admin`, pasá un pedido a **entregado**.
2. Abrí `/pedido/[código]` → aparece el botón **"¿Te gustaron los huevos? Dejá tu opinión"**.
3. Entrá a `/reseniar/[código]`: elegí estrellas, etiquetas opcionales y comentario.
4. Al enviar, la reseña queda como `pending` y **no se publica todavía**.
5. En `/admin` → **Reseñas por moderar** aparece con *Aprobar* / *Rechazar*.
6. Si aprobás, se muestra en la tienda en **"Lo que dicen nuestros vecinos"** con el promedio.
7. Si rechazás, no se publica. Un mismo pedido solo puede tener una reseña (se actualiza, no se duplica).

## C-4. Cupones, referidos e incentivo por reseña

1. En `/admin` → **Cupones y referidos**, crear un cupón (ej. `VECINO10`, 10%, 100 usos) o dejar el código vacío para que se autogenere.
2. En el carrito, cargar el código en *"¿Tenés un código de descuento?"* → *Aplicar*. Debe aparecer el descuento en el resumen antes de confirmar.
3. Confirmar el pedido → el total de MP/WhatsApp debe coincidir y el contador de usos del cupón aumenta en 1.
4. Al aprobar una reseña en **Reseñas por moderar**, se genera un cupón `GRACIAS-XXXX` que aparece en la fila para enviárselo al cliente (10% off, 1 uso).
5. Un cupón vencido, pausado o sin usos disponibles debe ser rechazado con mensaje claro.

> El descuento por efectivo (10%) se calcula **después** del cupón, sobre el subtotal ya descontado.

## C-5. Datos guardados y ubicación

1. En el carrito, completar nombre/teléfono/dirección y dejar marcado **"Recordar mis datos en este dispositivo"**.
2. Confirmar un pedido → al volver a abrir el carrito (o recargar la página), los datos deben aparecer precargados.
3. Tocar **"Borrar datos guardados"** → se limpia el `localStorage` y los campos quedan como estaban.
4. Tocar **"Completar con mi ubicación actual"** → el navegador pide permiso; si estás en zona de entrega, se completan *Zona* y *Calle y Altura* con la dirección detectada.
5. Revisar siempre la dirección detectada antes de confirmar (la geocodificación puede ser imprecisa). Si estás fuera de Ensenada/Berisso/La Plata, aparece un aviso y se completa a mano.

> La geolocalización solo se pide al tocar el botón (nunca automáticamente) y necesita HTTPS, que ya tenemos en Vercel.

## D. Señales de alerta

- El botón de WhatsApp abre un número distinto a `5491134591224`.
- El total del mensaje no coincide con el del carrito.
- El envío sale gratis con menos de 3 maples (o se cobra con 3).
- El pedido no aparece en `/admin` (revisar `GET /api/health`).
- Los acentos llegan como `Ã¡` / `?` (problema de encoding).
- La barra de progreso no se actualiza al sacar productos.
