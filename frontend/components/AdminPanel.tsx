'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdmin, patchAdmin } from '@/lib/api';
import type { Product } from '@/lib/types';

interface Order {
  code: string;
  customer_name: string;
  phone: string | null;
  zone: string;
  street: string;
  between_street: string | null;
  delivery_notes: string | null;
  pay_method: string;
  subtotal_ars: number;
  discount_ars: number;
  total_ars: number;
  total_maples: number;
  status: string;
  payment_status: string | null;
  payment_id: string | null;
  is_test: boolean;
  created_at: string;
}

interface PendingReview {
  id: string;
  order_code: string;
  rating: number;
  tags: string[];
  comment: string | null;
  created_at: string;
}

const STATUSES = ['confirmado', 'preparando', 'en camino', 'entregado', 'cancelado'];

type ProductDraft = { priceArs: string; maplesEquivalent: string; active: boolean };

export default function AdminPanel() {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Record<string, ProductDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (activeToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const [o, r, p] = await Promise.all([
          fetchAdmin<Order[]>('/api/orders', activeToken),
          fetchAdmin<PendingReview[]>('/api/reviews/pending', activeToken),
          fetchAdmin<Product[]>('/api/products/admin', activeToken),
        ]);
        setOrders(o);
        setReviews(r);
        setProducts(p);
        setDraft(
          Object.fromEntries(
            p.map((product) => [
              product.id,
              {
                priceArs: String(product.priceArs),
                maplesEquivalent: String(product.maplesEquivalent),
                active: product.active !== false,
              },
            ]),
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem('pm_admin_token') || '';
    if (stored) {
      setToken(stored);
      setSavedToken(stored);
      load(stored);
    }
  }, [load]);

  const login = () => {
    sessionStorage.setItem('pm_admin_token', token);
    setSavedToken(token);
    load(token);
  };

  const changeStatus = async (code: string, status: string) => {
    await patchAdmin(`/api/orders/${code}/status`, savedToken, { status });
    load(savedToken);
  };

  const moderate = async (id: string, status: string) => {
    await patchAdmin(`/api/reviews/${id}/${status}`, savedToken, {});
    load(savedToken);
  };

  const saveProduct = async (id: string) => {
    const values = draft[id];
    if (!values) return;
    setSavingId(id);
    setError(null);
    try {
      await patchAdmin(`/api/products/${id}`, savedToken, {
        priceArs: Number(values.priceArs),
        maplesEquivalent: Number(values.maplesEquivalent),
        active: values.active,
      });
      await load(savedToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el producto');
    } finally {
      setSavingId(null);
    }
  };

  if (!savedToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
        <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-8 w-full max-w-sm">
          <div className="text-4xl text-center mb-3">🥚</div>
          <h1 className="text-xl font-black text-center text-gray-900 mb-1">Panel Punto Maple</h1>
          <p className="text-xs text-gray-500 text-center mb-6">Ingresá el token de administrador</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token de administrador"
            className="w-full text-sm p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <button
            onClick={login}
            className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl"
          >
            Ingresar
          </button>
          <p className="text-center mt-4">
            <a href="/" className="text-xs text-gray-500 hover:text-amber-600 underline">Volver a la tienda</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">🥚 Panel de operaciones</h1>
            <p className="text-xs text-gray-500">Punto Maple · Punta Lara</p>
            <p className="text-[10px] text-gray-400 mt-1">
              El estado del pago (badge verde) es independiente del estado de entrega (botones).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load(savedToken)}
              className="text-xs font-bold bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              Actualizar
            </button>
            <a href="/" className="text-xs font-bold bg-gray-900 text-white px-3 py-2 rounded-lg">
              Ver tienda
            </a>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</div>}
        {loading && <p className="text-xs text-gray-500 mb-4">Cargando…</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <p className="text-xs text-gray-500">Pedidos activos</p>
            <p className="text-2xl font-black text-gray-900">
              {orders.filter((o) => !o.is_test && o.status !== 'entregado' && o.status !== 'cancelado').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <p className="text-xs text-gray-500">Facturación registrada</p>
            <p className="text-2xl font-black text-gray-900">
              ${orders.filter((o) => !o.is_test).reduce((a, o) => a + Number(o.total_ars), 0).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <p className="text-xs text-gray-500">Reseñas pendientes</p>
            <p className="text-2xl font-black text-gray-900">{reviews.length}</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-3">Productos y precios</h2>
        <p className="text-xs text-gray-500 mb-3">
          Los cambios se reflejan al instante en la tienda. Los pedidos anteriores conservan el precio con el que se compraron.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-amber-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{product.icon}</span>
                <div>
                  <p className="font-bold text-sm text-gray-900">{product.name}</p>
                  <p className="text-[11px] text-gray-500">{product.unitText}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="block">
                  <span className="text-gray-500">Precio ($)</span>
                  <input
                    type="number"
                    min="0"
                    value={draft[product.id]?.priceArs ?? product.priceArs}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], priceArs: e.target.value },
                      }))
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-500">Maples eq.</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={draft[product.id]?.maplesEquivalent ?? product.maplesEquivalent}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], maplesEquivalent: e.target.value },
                      }))
                    }
                    className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={draft[product.id]?.active ?? product.active !== false}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [product.id]: { ...prev[product.id], active: e.target.checked },
                      }))
                    }
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  Visible en la tienda
                </label>
                <button
                  onClick={() => saveProduct(product.id)}
                  disabled={savingId === product.id}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  {savingId === product.id ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-3">Pedidos recientes</h2>
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden mb-8">
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">Todavía no hay pedidos.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((o) => (
                <div key={o.code} className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-900">{o.code}</p>
                      {o.payment_status === 'approved' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                          PAGO APROBADO
                        </span>
                      )}
                      {o.payment_status === 'pending' && (
                        <span className="bg-yellow-100 text-yellow-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                          PAGO PENDIENTE
                        </span>
                      )}
                      {(o.payment_status === 'refunded' || o.payment_status === 'charged_back') && (
                        <span className="bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                          REEMBOLSADO
                        </span>
                      )}
                      {o.is_test && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                          PRUEBA
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500">{new Date(o.created_at).toLocaleString('es-AR')}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{o.customer_name}</p>
                    <p className="text-gray-500">{o.zone} · {o.street}</p>
                    <p className="text-gray-500">{o.phone || '—'}</p>
                    {o.delivery_notes && (
                      <p className="text-amber-700">Ref: {o.delivery_notes}</p>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">${Number(o.total_ars).toLocaleString('es-AR')}</p>
                    <p className="text-gray-500">{o.total_maples} maples · {o.pay_method}</p>
                    {Number(o.discount_ars) > 0 && (
                      <p className="text-emerald-700">- ${Number(o.discount_ars).toLocaleString('es-AR')} dto. efectivo</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-start sm:justify-end">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(o.code, s)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                          o.status === s
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-amber-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-3">Reseñas por moderar</h2>
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          {reviews.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No hay reseñas pendientes.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row gap-3 justify-between items-start text-xs">
                  <div>
                    <p className="font-black text-amber-600">{'★'.repeat(r.rating)}</p>
                    <p className="text-gray-700">{r.comment || '(sin comentario)'}</p>
                    <p className="text-gray-400">{r.order_code} · {(r.tags || []).join(', ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderate(r.id, 'approved')}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => moderate(r.id, 'rejected')}
                      className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
