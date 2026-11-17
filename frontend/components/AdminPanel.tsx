'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdmin, patchAdmin } from '@/lib/api';

interface Order {
  code: string;
  customer_name: string;
  phone: string | null;
  zone: string;
  street: string;
  between_street: string | null;
  pay_method: string;
  total_ars: number;
  total_maples: number;
  status: string;
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

export default function AdminPanel() {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (activeToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const [o, r] = await Promise.all([
          fetchAdmin<Order[]>('/api/orders', activeToken),
          fetchAdmin<PendingReview[]>('/api/reviews/pending', activeToken),
        ]);
        setOrders(o);
        setReviews(r);
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
              {orders.filter((o) => o.status !== 'entregado' && o.status !== 'cancelado').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <p className="text-xs text-gray-500">Facturación registrada</p>
            <p className="text-2xl font-black text-gray-900">
              ${orders.reduce((a, o) => a + Number(o.total_ars), 0).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <p className="text-xs text-gray-500">Reseñas pendientes</p>
            <p className="text-2xl font-black text-gray-900">{reviews.length}</p>
          </div>
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
                    <p className="font-black text-gray-900">{o.code}</p>
                    <p className="text-gray-500">{new Date(o.created_at).toLocaleString('es-AR')}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{o.customer_name}</p>
                    <p className="text-gray-500">{o.zone} · {o.street}</p>
                    <p className="text-gray-500">{o.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">${Number(o.total_ars).toLocaleString('es-AR')}</p>
                    <p className="text-gray-500">{o.total_maples} maples · {o.pay_method}</p>
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
