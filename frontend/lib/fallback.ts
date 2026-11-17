import type { Product } from './types';

/** Catálogo de respaldo: la tienda sigue funcionando si la API está fría (Render free). */
export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'maple-30',
    name: 'Maple Clásico (30 Huevos Grandes)',
    description: 'Huevos frescos seleccionados de granja propia en Punta Lara. Yema intensa y clara densa.',
    priceArs: 4900,
    maplesEquivalent: 1,
    unitText: '30 unidades',
    icon: '🥚',
    badge: 'Más Elegido',
    sortOrder: 1,
  },
  {
    id: 'pack-3-maples',
    name: 'Combo Ahorro (3 Maples / 90 Huevos)',
    description: 'La opción más inteligente. Llevá 3 maples juntos para tu casa o compartí con un vecino y no pagás flete.',
    priceArs: 14500,
    maplesEquivalent: 3,
    unitText: '90 unidades (3 maples)',
    icon: '📦',
    badge: '🔥 ¡Envío Gratis!',
    sortOrder: 2,
  },
  {
    id: 'docena-12',
    name: 'Estuche Docena (12 Huevos)',
    description: 'Estuche protector compacto para consumo semanal de parejas o estudiantes.',
    priceArs: 2200,
    maplesEquivalent: 0.4,
    unitText: '12 unidades',
    icon: '🍳',
    badge: 'Ideal Deptos',
    sortOrder: 3,
  },
  {
    id: 'media-docena-6',
    name: 'Media Docena (6 Huevos)',
    description: 'Pack chico para consumo rápido o repostería eventual.',
    priceArs: 1200,
    maplesEquivalent: 0.2,
    unitText: '6 unidades',
    icon: '🧁',
    badge: 'Práctico',
    sortOrder: 4,
  },
];
