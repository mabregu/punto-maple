import { API_URL } from './config';
import { FALLBACK_PRODUCTS } from './fallback';
import type { CheckoutForm, OrderResult, Product } from './types';

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Product[];
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function fetchReviews(): Promise<Array<{ rating: number; comment: string | null; customerName: string | null; tags: string[] }>> {
  try {
    const res = await fetch(`${API_URL}/api/reviews`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createOrder(form: CheckoutForm, items: Array<{ productId: string; quantity: number }>): Promise<OrderResult> {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, items }),
  });
  if (!res.ok) {
    let message = 'No pudimos registrar tu pedido. Intentá nuevamente.';
    try {
      const err = await res.json();
      if (err?.message) message = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchAdmin<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'x-admin-token': token },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('No autorizado o error del servidor');
  return res.json();
}

export async function patchAdmin<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('No autorizado o error del servidor');
  return res.json();
}
