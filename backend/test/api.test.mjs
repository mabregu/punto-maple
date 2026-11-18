import { test } from 'node:test';
import assert from 'node:assert/strict';

const API = (process.env.TEST_API_URL || 'https://punto-maple-backend.onrender.com').replace(/\/$/, '');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* respuesta sin cuerpo JSON */
  }
  return { status: res.status, body };
}

function orderPayload(overrides = {}) {
  return {
    customerName: `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    phone: '2215550000',
    zone: 'Ensenada',
    street: 'Calle de Prueba 123',
    payMethod: 'Efectivo al recibir',
    testMode: true,
    items: [{ productId: 'maple-30', quantity: 3 }],
    ...overrides,
  };
}

function postOrder(overrides = {}) {
  return api('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload(overrides)),
  });
}

test('health: API y base de datos conectadas', async () => {
  const { status, body } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.database, 'connected');
});

test('catálogo: 4 SKUs con precios esperados', async () => {
  const { status, body } = await api('/api/products');
  assert.equal(status, 200);
  assert.equal(body.length, 4);
  const byId = Object.fromEntries(body.map((p) => [p.id, p]));
  assert.equal(byId['maple-30'].priceArs, 4900);
  assert.equal(byId['pack-3-maples'].maplesEquivalent, 3);
  assert.equal(byId['docena-12'].maplesEquivalent, 0.4);
});

test('envío gratis con 3 maples exactos', async () => {
  const { status, body } = await postOrder({ items: [{ productId: 'maple-30', quantity: 3 }] });
  assert.equal(status, 201);
  assert.equal(body.totalMaples, 3);
  assert.equal(body.isFreeShipping, true);
  assert.equal(body.shippingArs, 0);
  assert.equal(body.hasCashDiscount, true);
  assert.equal(body.discountArs, 1470);
  assert.equal(body.totalArs, 13230);
  assert.equal(body.isTest, true);
  assert.match(body.code, /^PM-\d{8}-[A-Z0-9]{4}$/);
  assert.match(body.whatsappText, /Descuento por pago en efectivo \(10%\): -\$1\.470/);
});

test('mensaje de WhatsApp sin emojis ni viñetas unicode', async () => {
  const { body } = await postOrder();
  assert.doesNotMatch(body.whatsappText, /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  assert.doesNotMatch(body.whatsappText, /•/);
  assert.match(body.whatsappText, /^- 3x Maple Clásico/m);
});

test('transferencia no aplica descuento', async () => {
  const { status, body } = await postOrder({
    payMethod: 'Transferencia (CBU/Alias)',
    items: [{ productId: 'maple-30', quantity: 3 }],
  });
  assert.equal(status, 201);
  assert.equal(body.discountArs, 0);
  assert.equal(body.hasCashDiscount, false);
  assert.equal(body.totalArs, 14700);
  assert.doesNotMatch(body.whatsappText, /Descuento por pago en efectivo/);
});

test('envío pagado con 2,4 maples', async () => {
  const { status, body } = await postOrder({
    items: [
      { productId: 'maple-30', quantity: 2 },
      { productId: 'docena-12', quantity: 1 },
    ],
  });
  assert.equal(status, 201);
  assert.equal(body.totalMaples, 2.4);
  assert.equal(body.isFreeShipping, false);
  assert.equal(body.shippingArs, 1500);
  assert.equal(body.discountArs, 1200);
  assert.equal(body.totalArs, 12300);
});

test('el servidor ignora precios manipulados desde el cliente', async () => {
  const { status, body } = await postOrder({
    priceArs: 1,
    totalArs: 1,
    items: [{ productId: 'pack-3-maples', quantity: 1, priceArs: 1 }],
  });
  assert.equal(status, 201);
  assert.equal(body.subtotalArs, 14500);
  assert.equal(body.discountArs, 1450);
  assert.equal(body.totalArs, 13050);
});

test('rechaza carrito vacío', async () => {
  const { status } = await postOrder({ items: [] });
  assert.equal(status, 400);
});

test('rechaza producto inexistente', async () => {
  const { status } = await postOrder({ items: [{ productId: 'no-existe', quantity: 1 }] });
  assert.equal(status, 400);
});

test('rechaza campos de entrega incompletos', async () => {
  const { status } = await postOrder({ customerName: '', street: '' });
  assert.equal(status, 400);
});

test('rechaza calificación fuera de rango', async () => {
  const { status } = await api('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({ orderCode: 'PM-TEST', rating: 6, comment: 'prueba' }),
  });
  assert.equal(status, 400);
});

test('protege el panel sin token de administrador', async () => {
  const { status } = await api('/api/orders');
  assert.equal(status, 401);
});

test('acepta el token de administrador', { skip: !ADMIN_TOKEN }, async () => {
  const { status } = await api('/api/orders', { headers: { 'x-admin-token': ADMIN_TOKEN } });
  assert.equal(status, 200);
});

test('limpia los pedidos de prueba', { skip: !ADMIN_TOKEN }, async () => {
  const { status, body } = await api('/api/orders/test', {
    method: 'DELETE',
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  assert.equal(status, 200);
  assert.ok(body.deleted >= 0);
});
