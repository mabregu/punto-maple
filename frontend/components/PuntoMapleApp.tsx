'use client';

import { useEffect, useMemo, useState } from 'react';
import { createOrder, createPaymentPreference, fetchProducts, fetchReviews } from '@/lib/api';
import { CASH_DISCOUNT_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST_ARS, WHATSAPP_PHONE } from '@/lib/config';
import type { CheckoutForm, OrderResult, Product, Totals } from '@/lib/types';
import CartDrawer from './CartDrawer';
import Footer from './Footer';
import Header from './Header';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import ProductCard from './ProductCard';
import PromoTracker from './PromoTracker';
import ReviewsSection from './ReviewsSection';

const EMPTY_FORM: CheckoutForm = {
  customerName: '',
  phone: '',
  zone: 'Ensenada',
  street: '',
  between: '',
  deliveryNotes: '',
  payMethod: 'Efectivo al recibir',
};

type Review = { rating: number; comment: string | null; customerName: string | null; tags: string[] };

export default function PuntoMapleApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({ 'maple-30': 1 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);

  useEffect(() => {
    fetchProducts().then(setProducts);
    fetchReviews().then(setReviews);
  }, []);

  const totals: Totals = useMemo(() => {
    let subtotal = 0;
    let totalMaples = 0;
    let totalItems = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const product = products.find((p) => p.id === id);
      if (!product) continue;
      subtotal += product.priceArs * qty;
      totalMaples += product.maplesEquivalent * qty;
      totalItems += qty;
    }
    const isCash = /efectivo/i.test(form.payMethod);
    const discount = isCash ? Math.round(subtotal * CASH_DISCOUNT_RATE) : 0;
    const isFreeShipping = totalMaples >= FREE_SHIPPING_THRESHOLD;
    const shipping = totalItems === 0 ? 0 : isFreeShipping ? 0 : SHIPPING_COST_ARS;
    return {
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
      totalMaples,
      totalItems,
      isFreeShipping,
    };
  }, [cart, products, form.payMethod]);

  const addToCart = (id: string) => {
    setResult(null);
    setError(null);
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setDrawerOpen(true);
  };

  const changeQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      next[id] = (next[id] || 0) + delta;
      if (next[id] <= 0) delete next[id];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim() || !form.street.trim() || !form.phone.trim()) {
      setError('Completá tu nombre, teléfono y dirección de entrega.');
      return;
    }
    if (totals.totalItems === 0) {
      setError('Tu carrito está vacío. Agregá al menos un producto.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const items = Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }));
      const order = await createOrder(form, items);

      if (form.payMethod === 'Mercado Pago') {
        const preference = await createPaymentPreference(order.code);
        setCart({});
        window.location.href = preference.initPoint;
        return;
      }

      setResult(order);
      const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(order.whatsappText)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      setCart({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header cartCount={totals.totalItems} onOpenCart={() => setDrawerOpen(true)} />
      <Hero />
      <PromoTracker
        totalMaples={totals.totalMaples}
        threshold={FREE_SHIPPING_THRESHOLD}
        isFreeShipping={totals.isFreeShipping}
      />

      <main className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Elegí tu presentación:</h3>
          <span className="text-xs text-gray-500">Precios actualizados</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>
      </main>

      <ReviewsSection reviews={reviews} />
      <HowItWorks />
      <Footer />

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        products={products}
        cart={cart}
        onChangeQuantity={changeQuantity}
        totals={totals}
        form={form}
        onFormChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        result={result}
      />
    </>
  );
}
