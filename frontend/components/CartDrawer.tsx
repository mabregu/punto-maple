'use client';

import { CASH_DISCOUNT_RATE } from '@/lib/config';
import type { CheckoutForm, OrderResult, Product, Totals } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  products: Product[];
  cart: Record<string, number>;
  onChangeQuantity: (id: string, delta: number) => void;
  totals: Totals;
  form: CheckoutForm;
  onFormChange: (field: keyof CheckoutForm, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  result: OrderResult | null;
}

const ZONES = [
  'Ensenada',
  'Berisso',
  'La Plata (Casco)',
  'La Plata (Norte / Gonnet / City Bell)',
  'La Plata (Sur / Los Hornos)',
];

export default function CartDrawer({
  open,
  onClose,
  products,
  cart,
  onChangeQuantity,
  totals,
  form,
  onFormChange,
  onSubmit,
  submitting,
  error,
  result,
}: Props) {
  const items = Object.entries(cart);

  return (
    <div
      id="cart-drawer"
      className={`fixed inset-0 z-50 overflow-hidden ${open ? '' : 'hidden'}`}
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h3 className="text-base font-bold text-gray-900">Tu Carrito de Compra</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Cerrar carrito"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3" id="cart-items-container">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">🥚</span>
                <p className="text-sm">Tu canasta está vacía.</p>
                <button onClick={onClose} className="mt-3 text-amber-600 font-bold text-xs hover:underline">
                  Explorar productos
                </button>
              </div>
            ) : (
              items.map(([id, qty]) => {
                const product = products.find((p) => p.id === id);
                if (!product) return null;
                return (
                  <div key={id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.icon}</span>
                      <div>
                        <h5 className="font-bold text-xs text-gray-800">{product.name}</h5>
                        <span className="text-[11px] text-gray-500">${product.priceArs.toLocaleString('es-AR')} c/u</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button
                          onClick={() => onChangeQuantity(id, -1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 rounded-l"
                          aria-label="Restar"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-800">{qty}</span>
                        <button
                          onClick={() => onChangeQuantity(id, 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 rounded-r"
                          aria-label="Sumar"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-bold text-gray-900 w-16 text-right">
                        ${(product.priceArs * qty).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
            {result && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                <strong>✅ Pedido {result.code} registrado.</strong>
                <br />
                Se abrió WhatsApp con tu resumen. Si no se abrió,{' '}
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '5492210000000'}?text=${encodeURIComponent(result.whatsappText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold"
                >
                  tocá acá
                </a>
                .
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</div>
            )}

            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Datos para la entrega</h4>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => onFormChange('customerName', e.target.value)}
                placeholder="Tu Nombre y Apellido *"
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => onFormChange('phone', e.target.value)}
                placeholder="Tu Teléfono de contacto *"
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.zone}
                  onChange={(e) => onFormChange('zone', e.target.value)}
                  className="text-xs p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium text-gray-700"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => onFormChange('street', e.target.value)}
                  placeholder="Calle y Altura *"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
              </div>
              <input
                type="text"
                value={form.between}
                onChange={(e) => onFormChange('between', e.target.value)}
                placeholder="Entre calles o Depto / Piso"
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Medio de Pago:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Efectivo al recibir', 'Transferencia (CBU/Alias)'].map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-amber-400"
                  >
                    <input
                      type="radio"
                      name="pay_method"
                      value={method}
                      checked={form.payMethod === method}
                      onChange={() => onFormChange('payMethod', method)}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span>
                      {method === 'Efectivo al recibir'
                        ? `💵 Efectivo (-${Math.round(CASH_DISCOUNT_RATE * 100)}%)`
                        : '📱 Transferencia'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 text-xs space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal productos:</span>
                <span className="font-semibold">${totals.subtotal.toLocaleString('es-AR')}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento por pago en efectivo:</span>
                  <span className="font-bold">-${totals.discount.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Costo de envío:</span>
                <span className={totals.isFreeShipping ? 'font-bold text-emerald-600' : 'font-semibold text-gray-800'}>
                  {totals.totalItems === 0
                    ? '$0'
                    : totals.isFreeShipping
                      ? '¡GRATIS!'
                      : `$${totals.shipping.toLocaleString('es-AR')}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-200">
                <span>TOTAL ESTIMADO:</span>
                <span className="text-amber-600 text-base">${totals.total.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting || totals.totalItems === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-95"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
              </svg>
              <span>{submitting ? 'Registrando pedido...' : 'Confirmar Pedido por WhatsApp'}</span>
            </button>
            <p className="text-[10px] text-gray-500 text-center">
              Se registra tu pedido y se abre WhatsApp con el resumen listo para enviar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
