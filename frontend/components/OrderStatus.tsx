'use client';

import { useEffect, useState } from 'react';
import { fetchOrder, verifyPayment, type OrderStatusDto } from '@/lib/api';

interface Props {
  code: string;
  initialStatus?: string;
}

export default function OrderStatus({ code, initialStatus }: Props) {
  const [order, setOrder] = useState<OrderStatusDto | null>(null);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await fetchOrder(code);
      if (!active) return;
      setOrder(data);
      if (data?.payMethod === 'Mercado Pago' && data?.paymentStatus !== 'approved') {
        await verifyPayment(code);
        if (active) setOrder(await fetchOrder(code));
      }
    };
    load();
    const needsPolling = !order || order.paymentStatus === 'pending';
    if (needsPolling && retries < 12) {
      const timer = setTimeout(() => {
        setRetries((r) => r + 1);
        load();
      }, 5000);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
    return () => {
      active = false;
    };
  }, [code, order?.paymentStatus, retries]);

  const approved = order?.paymentStatus === 'approved' || initialStatus === 'approved';
  const rejected = initialStatus === 'rejected' || order?.paymentStatus === 'rejected';
  const pending = initialStatus === 'pending' || order?.paymentStatus === 'pending';

  let title = 'Pedido registrado';
  let subtitle = 'Estamos preparando tu pedido.';
  let badge = 'bg-amber-100 text-amber-800';
  if (approved) {
    title = '¡Pago aprobado!';
    subtitle = 'Tu pedido está confirmado. Nos vamos a coordinar por WhatsApp la entrega.';
    badge = 'bg-emerald-100 text-emerald-800';
  } else if (pending) {
    title = 'Pago pendiente de acreditación';
    subtitle = 'Mercado Pago está procesando tu pago. Esta página se actualiza sola.';
    badge = 'bg-yellow-100 text-yellow-800';
  } else if (rejected) {
    title = 'Pago rechazado';
    subtitle = 'Tu pago no se pudo procesar. Podés volver a intentarlo con otro medio.';
    badge = 'bg-red-100 text-red-800';
  }

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-amber-100 shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">{approved ? '✅' : rejected ? '❌' : pending ? '⏳' : '🥚'}</div>
        <span className={`inline-block text-xs font-black px-3 py-1 rounded-full mb-4 ${badge}`}>
          {code}
        </span>
        <h1 className="text-2xl font-black text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-600 mb-6">{subtitle}</p>

        {order && (
          <div className="bg-gray-50 rounded-xl p-4 text-left text-xs space-y-1 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Estado del pedido</span>
              <span className="font-bold text-gray-900">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Medio de pago</span>
              <span className="font-bold text-gray-900">{order.payMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-gray-900">${order.totalArs.toLocaleString('es-AR')}</span>
            </div>
            {order.paymentId && (
              <div className="flex justify-between">
                <span className="text-gray-500">ID de pago MP</span>
                <span className="font-mono text-gray-700">{order.paymentId}</span>
              </div>
            )}
          </div>
        )}

        <a href="/" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl">
          Volver a la tienda
        </a>
      </div>
    </main>
  );
}
