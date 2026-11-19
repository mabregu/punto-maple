import { API_URL } from './config';
import { FALLBACK_PRODUCTS } from './fallback';
import type { CheckoutForm, OrderResult, Product } from './types';

/**
 * Fetch con timeout. Render free puede tardar en despertar tras un cold start;
 * sin timeout la UI se queda esperando indefinidamente.
 */
async function apiFetch(path: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await apiFetch('/api/products', { cache: 'no-store' }, 8000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Product[];
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

export async function fetchReviews(): Promise<Array<{ rating: number; comment: string | null; customerName: string | null; tags: string[] }>> {
  try {
    const res = await apiFetch('/api/reviews', { cache: 'no-store' }, 8000);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createOrder(form: CheckoutForm, items: Array<{ productId: string; quantity: number }>): Promise<OrderResult> {
  const res = await apiFetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...form, items }),
  }, 20000);
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

export interface OrderStatusDto {
  code: string;
  status: string;
  payMethod: string;
  paymentStatus: string | null;
  paymentId: string | null;
  totalArs: number;
  createdAt: string;
  couponCode?: string | null;
}

export async function fetchOrder(code: string): Promise<OrderStatusDto | null> {
  try {
    const res = await apiFetch(`/api/orders/${encodeURIComponent(code)}`, { cache: 'no-store' }, 8000);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface Coupon {
  code: string;
  description: string;
  kind: string;
  discountType: string;
  value: number;
  maxUses: number;
  uses: number;
  active: boolean;
  expiresAt: string | null;
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; coupon?: Coupon; discount?: number; reason?: string }> {
  try {
    const res = await apiFetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    }, 8000);
    if (!res.ok) return { valid: false, reason: 'No se pudo validar el cupón' };
    return res.json();
  } catch {
    return { valid: false, reason: 'No se pudo validar el cupón' };
  }
}

export async function fetchCoupons(token: string): Promise<Coupon[]> {
  return fetchAdmin<Coupon[]>('/api/coupons', token);
}

export async function createCoupon(token: string, payload: Partial<Coupon>): Promise<Coupon> {
  const res = await apiFetch('/api/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify(payload),
  }, 15000);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'No se pudo crear el cupón');
  }
  return res.json();
}

export async function toggleCoupon(token: string, code: string, active: boolean): Promise<Coupon> {
  return patchAdmin<Coupon>(`/api/coupons/${encodeURIComponent(code)}`, token, { active });
}

export interface ReviewPayload {
  orderCode: string;
  rating: number;
  tags?: string[];
  comment?: string;
  photoUrl?: string;
}

export async function submitReview(payload: ReviewPayload): Promise<{ ok: boolean; message?: string }> {
  const res = await apiFetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 15000);
  if (!res.ok) {
    let message = 'No pudimos guardar tu reseña. Intentá nuevamente.';
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

export async function verifyPayment(code: string): Promise<{ received: boolean; status?: string }> {
  try {
    const res = await apiFetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }, 10000);
    if (!res.ok) return { received: false };
    return res.json();
  } catch {
    return { received: false };
  }
}

export interface PaymentPreference {
  preferenceId: string;
  initPoint: string;
  orderCode: string;
}

export async function createPaymentPreference(code: string): Promise<PaymentPreference> {
  const res = await apiFetch('/api/payments/preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  }, 20000);
  if (!res.ok) {
    let message = 'No pudimos iniciar el pago con Mercado Pago.';
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
  const res = await apiFetch(path, {
    headers: { 'x-admin-token': token },
    cache: 'no-store',
  }, 10000);
  if (!res.ok) throw new Error('No autorizado o error del servidor');
  return res.json();
}

export async function patchAdmin<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify(body),
  }, 15000);
  if (!res.ok) throw new Error('No autorizado o error del servidor');
  return res.json();
}
