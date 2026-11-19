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

let catalogCache = null;
async function catalog() {
  if (!catalogCache) {
    const { body } = await api('/api/products');
    catalogCache = Object.fromEntries(body.map((p) => [p.id, p]));
  }
  return catalogCache;
}

const money = (n) => `$${n.toLocaleString('es-AR')}`;

test('health: API y base de datos conectadas', async () => {
  const { status, body } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.database, 'connected');
});

test('catálogo: 4 SKUs con equivalencias correctas', async () => {
  const { status, body } = await api('/api/products');
  assert.equal(status, 200);
  assert.equal(body.length, 4);
  const byId = Object.fromEntries(body.map((p) => [p.id, p]));
  for (const p of body) assert.ok(Number.isInteger(p.priceArs) && p.priceArs >= 0);
  assert.equal(byId['pack-3-maples'].maplesEquivalent, 3);
  assert.equal(byId['docena-12'].maplesEquivalent, 0.4);
});

test('envío gratis con 3 maples exactos', async () => {
  const price = (await catalog())['maple-30'].priceArs;
  const expectedDiscount = Math.round(price * 3 * 0.1);
  const { status, body } = await postOrder({ items: [{ productId: 'maple-30', quantity: 3 }] });
  assert.equal(status, 201);
  assert.equal(body.totalMaples, 3);
  assert.equal(body.isFreeShipping, true);
  assert.equal(body.shippingArs, 0);
  assert.equal(body.hasCashDiscount, true);
  assert.equal(body.subtotalArs, price * 3);
  assert.equal(body.discountArs, expectedDiscount);
  assert.equal(body.totalArs, price * 3 - expectedDiscount);
  assert.equal(body.isTest, true);
  assert.match(body.code, /^PM-\d{8}-[A-Z0-9]{4}$/);
  assert.ok(body.whatsappText.includes(`Descuento por pago en efectivo (10%): -${money(expectedDiscount)}`));
});

test('mensaje de WhatsApp sin emojis ni viñetas unicode', async () => {
  const { body } = await postOrder();
  assert.doesNotMatch(body.whatsappText, /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  assert.doesNotMatch(body.whatsappText, /•/);
  assert.match(body.whatsappText, /^- 3x Maple Clásico/m);
});

test('incluye referencias de entrega en el pedido y en el mensaje', async () => {
  const notes = 'Portón negro, casa de dos plantas';
  const { status, body } = await postOrder({ street: 'Calle 140 Nº 503', between: '9 y 9bis', deliveryNotes: notes });
  assert.equal(status, 201);
  assert.equal(body.deliveryNotes, notes);
  assert.match(body.whatsappText, /\*Referencias:\* Portón negro, casa de dos plantas/);
  const detail = await api(`/api/orders/${body.code}`);
  assert.equal(detail.body.deliveryNotes, notes);
});

test('transferencia no aplica descuento', async () => {
  const price = (await catalog())['maple-30'].priceArs;
  const { status, body } = await postOrder({
    payMethod: 'Transferencia (CBU/Alias)',
    items: [{ productId: 'maple-30', quantity: 3 }],
  });
  assert.equal(status, 201);
  assert.equal(body.discountArs, 0);
  assert.equal(body.hasCashDiscount, false);
  assert.equal(body.totalArs, price * 3);
  assert.doesNotMatch(body.whatsappText, /Descuento por pago en efectivo/);
});

test('crea preferencia de Mercado Pago con el total del pedido', async () => {
  const { status: orderStatus, body: order } = await postOrder({
    payMethod: 'Mercado Pago',
    items: [{ productId: 'media-docena-6', quantity: 1 }],
  });
  assert.equal(orderStatus, 201);
  assert.equal(order.hasCashDiscount, false);

  const { status, body } = await api('/api/payments/preference', {
    method: 'POST',
    body: JSON.stringify({ code: order.code }),
  });
  assert.equal(status, 201);
  assert.ok(body.preferenceId);
  assert.match(body.initPoint, /mercadopago\.com/);
  assert.equal(body.orderCode, order.code);
  assert.equal(body.amount, order.totalArs);
});

test('verificación de respaldo consulta Mercado Pago', async () => {
  const { body: order } = await postOrder({ payMethod: 'Mercado Pago' });
  const { status, body } = await api('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({ code: order.code }),
  });
  assert.equal(status, 201);
  assert.equal(body.received, true);
});

test('webhook sin firma es rechazado', async () => {
  const { status } = await api('/api/payments/webhook', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(status, 401);
});

test('envío pagado con 2,4 maples', async () => {
  const cat = await catalog();
  const subtotal = cat['maple-30'].priceArs * 2 + cat['docena-12'].priceArs;
  const expectedDiscount = Math.round(subtotal * 0.1);
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
  assert.equal(body.subtotalArs, subtotal);
  assert.equal(body.discountArs, expectedDiscount);
  assert.equal(body.totalArs, subtotal - expectedDiscount + 1500);
});

test('el servidor ignora precios manipulados desde el cliente', async () => {
  const realPrice = (await catalog())['pack-3-maples'].priceArs;
  const { status, body } = await postOrder({
    priceArs: 1,
    totalArs: 1,
    items: [{ productId: 'pack-3-maples', quantity: 1, priceArs: 1 }],
  });
  assert.equal(status, 201);
  assert.equal(body.subtotalArs, realPrice);
  assert.equal(body.discountArs, Math.round(realPrice * 0.1));
  assert.equal(body.totalArs, realPrice - Math.round(realPrice * 0.1));
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

test('protege la administración de productos sin token', async () => {
  const { status } = await api('/api/products/admin');
  assert.equal(status, 401);
});

test('actualiza un precio desde el panel y lo restaura', { skip: !ADMIN_TOKEN }, async () => {
  const initial = await api('/api/products');
  const original = initial.body.find((p) => p.id === 'maple-30').priceArs;
  try {
    const { status, body } = await api('/api/products/maple-30', {
      method: 'PATCH',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      body: JSON.stringify({ priceArs: original + 1 }),
    });
    assert.equal(status, 200);
    assert.equal(body.priceArs, original + 1);
    const after = await api('/api/products');
    assert.equal(after.body.find((p) => p.id === 'maple-30').priceArs, original + 1);
  } finally {
    await api('/api/products/maple-30', {
      method: 'PATCH',
      headers: { 'x-admin-token': ADMIN_TOKEN },
      body: JSON.stringify({ priceArs: original }),
    });
  }
});

test('limpia los pedidos de prueba', { skip: !ADMIN_TOKEN }, async () => {
  const { status, body } = await api('/api/orders/test', {
    method: 'DELETE',
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  assert.equal(status, 200);
  assert.ok(body.deleted >= 0);
});
