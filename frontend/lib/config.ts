export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const WHATSAPP_PHONE =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '5492210000000';

export const FREE_SHIPPING_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_MAPLES_THRESHOLD || 3,
);

export const SHIPPING_COST_ARS = Number(
  process.env.NEXT_PUBLIC_SHIPPING_COST_ARS || 1500,
);
