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
| 3 | Sumar 2 maples más (total 3) | Barra verde: "¡Tenés ENVÍO GRATIS asegurado!"; envío $0; total $14.700 |
| 4 | Abrir el carrito | Precios, cantidades y `+ / -` correctos; al bajar a 2 el envío vuelve a $1.500 |
| 5 | Completar nombre, teléfono, zona y calle | Si falta alguno, el botón muestra el aviso (no se crea el pedido) |
| 6 | Elegir "Transferencia" | El mensaje de WhatsApp debe decir *Forma de Pago: Transferencia (CBU/Alias)* |
| 7 | Tocar "Confirmar Pedido por WhatsApp" | Se abre `wa.me/5491134591224` con el resumen **ya redactado** |
| 8 | Revisar el mensaje | Código `PM-YYYYMMDD-XXXX`, acentos correctos (Martín, Nº), negritas, "Envío: ¡GRATIS!" y saludo final |
| 9 | **No hace falta enviarlo** para validar; si querés probar extremo a extremo, enviarlo y ver que llegue | El chat se abre con el número del negocio |
| 10 | Abrir `/admin`, ingresar el token | El pedido aparece con badge **PRUEBA**, zone, dirección y total correctos |
| 11 | Cambiar el estado a "preparando" y "entregado" | El badge cambia y la métrica "Pedidos activos" baja |
| 12 | Probar un pedido de 2,4 maples (2×30 + 1×12) | Envío $1.500 y total $13.500 |

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

## D. Señales de alerta

- El botón de WhatsApp abre un número distinto a `5491134591224`.
- El total del mensaje no coincide con el del carrito.
- El envío sale gratis con menos de 3 maples (o se cobra con 3).
- El pedido no aparece en `/admin` (revisar `GET /api/health`).
- Los acentos llegan como `Ã¡` / `?` (problema de encoding).
- La barra de progreso no se actualiza al sacar productos.
