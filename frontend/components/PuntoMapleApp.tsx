'use client';

import { useEffect, useMemo, useState } from 'react';
import { createOrder, createPaymentPreference, fetchProducts, fetchReviews, validateCoupon } from '@/lib/api';
import { CASH_DISCOUNT_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST_ARS, WHATSAPP_PHONE } from '@/lib/config';
import { detectAddress } from '@/lib/location';
import type { AppliedCoupon, CheckoutForm, OrderResult, Product, Totals } from '@/lib/types';
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
  couponCode: '',
  payMethod: 'Efectivo al recibir',
};

type Review = { rating: number; comment: string | null; customerName: string | null; tags: string[] };

const STORAGE_KEY = 'pm_customer_data';
const SAVED_FIELDS: Array<keyof CheckoutForm> = [
  'customerName', 'phone', 'zone', 'street', 'between', 'deliveryNotes',
];

export default function PuntoMapleApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({ 'maple-30': 1 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts().then(setProducts);
    fetchReviews().then(setReviews);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setForm((prev) => {
          const next = { ...prev };
          for (const field of SAVED_FIELDS) {
            if (typeof saved[field] === 'string') next[field] = saved[field];
          }
          return next;
        });
        setHasSaved(true);
      }
    } catch {
      /* datos guardados corruptos: los ignoramos */
    }
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
    const couponDiscount = appliedCoupon
      ? appliedCoupon.discountType === 'percent'
        ? Math.round(subtotal * (appliedCoupon.value / 100))
        : Math.min(appliedCoupon.value, subtotal)
      : 0;
    const isCash = /efectivo/i.test(form.payMethod);
    const afterCoupon = subtotal - couponDiscount;
    const discount = isCash ? Math.round(afterCoupon * CASH_DISCOUNT_RATE) : 0;
    const isFreeShipping = totalMaples >= FREE_SHIPPING_THRESHOLD;
    const shipping = totalItems === 0 ? 0 : isFreeShipping ? 0 : SHIPPING_COST_ARS;
    return {
      subtotal,
      couponDiscount,
      discount,
      shipping,
      total: afterCoupon - discount + shipping,
      totalMaples,
      totalItems,
      isFreeShipping,
    };
  }, [cart, products, form.payMethod, appliedCoupon]);

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

  const applyCoupon = async () => {
    setCouponLoading(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(couponInput, totals.subtotal);
      if (!result.valid || !result.coupon) {
        setCouponError(result.reason || 'Código inválido');
        return;
      }
      setAppliedCoupon({
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        value: result.coupon.value,
      });
      setForm((prev) => ({ ...prev, couponCode: result.coupon!.code }));
      setCouponInput('');
    } catch {
      setCouponError('No se pudo validar el cupón');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setForm((prev) => ({ ...prev, couponCode: '' }));
    setCouponError(null);
  };

  const detectLocation = async () => {
    setLocating(true);
    setLocationMsg(null);
    try {
      const detected = await detectAddress();
      setForm((prev) => ({ ...prev, zone: detected.zone, street: detected.street, between: detected.between }));
      setLocationMsg(`Ubicación detectada: ${detected.label}. Revisá y corregí si hace falta.`);
    } catch (e) {
      setLocationMsg(e instanceof Error ? e.message : 'No pudimos detectar tu ubicación.');
    } finally {
      setLocating(false);
    }
  };

  const clearSaved = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSaved(false);
    setLocationMsg('Datos guardados borrados de este dispositivo.');
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

      if (remember) {
        const data: Partial<CheckoutForm> = {};
        for (const field of SAVED_FIELDS) data[field] = form[field];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setHasSaved(true);
      }

      setAppliedCoupon(null);
      setForm((prev) => ({ ...prev, couponCode: '' }));

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
        appliedCoupon={appliedCoupon}
        couponInput={couponInput}
        onCouponInput={setCouponInput}
        onApplyCoupon={applyCoupon}
        onRemoveCoupon={removeCoupon}
        couponError={couponError}
        couponLoading={couponLoading}
        remember={remember}
        onRememberChange={setRemember}
        hasSaved={hasSaved}
        onClearSaved={clearSaved}
        onDetectLocation={detectLocation}
        locating={locating}
        locationMsg={locationMsg}
      />
    </>
  );
}
