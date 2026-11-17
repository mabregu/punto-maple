export interface Product {
  id: string;
  name: string;
  description: string;
  priceArs: number;
  maplesEquivalent: number;
  unitText: string;
  icon: string;
  badge: string | null;
  sortOrder: number;
}

export interface CheckoutForm {
  customerName: string;
  phone: string;
  zone: string;
  street: string;
  between: string;
  payMethod: string;
}

export interface OrderResult {
  code: string;
  customerName: string;
  zone: string;
  street: string;
  payMethod: string;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  subtotalArs: number;
  shippingArs: number;
  totalArs: number;
  totalMaples: number;
  isFreeShipping: boolean;
  whatsappText: string;
}

export interface Totals {
  subtotal: number;
  shipping: number;
  total: number;
  totalMaples: number;
  totalItems: number;
  isFreeShipping: boolean;
}
