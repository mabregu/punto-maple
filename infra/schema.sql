-- ============================================================
-- Punto Maple — esquema de base de datos (Neon Postgres)
-- Aplicar sobre la rama `punto-maple`, base `punto_maple`
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  price_ars          INTEGER NOT NULL CHECK (price_ars >= 0),
  maples_equivalent  NUMERIC(6,2) NOT NULL DEFAULT 1,
  unit_text          TEXT NOT NULL DEFAULT '',
  icon               TEXT NOT NULL DEFAULT '🥚',
  badge              TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  active             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  customer_name  TEXT NOT NULL,
  phone          TEXT,
  zone           TEXT NOT NULL,
  street         TEXT NOT NULL,
  between_street TEXT,
  pay_method     TEXT NOT NULL DEFAULT 'Efectivo al recibir',
  subtotal_ars   INTEGER NOT NULL,
  discount_ars   INTEGER NOT NULL DEFAULT 0,
  shipping_ars   INTEGER NOT NULL DEFAULT 0,
  total_ars      INTEGER NOT NULL,
  total_maples   NUMERIC(6,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'confirmado',
  is_test        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     TEXT NOT NULL,
  product_name   TEXT NOT NULL,
  quantity       INTEGER NOT NULL,
  unit_price_ars INTEGER NOT NULL,
  line_total_ars INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code  TEXT NOT NULL UNIQUE REFERENCES orders(code) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags        TEXT[] NOT NULL DEFAULT '{}',
  comment     TEXT,
  photo_url   TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ============================================================
-- Datos iniciales (idempotente)
-- ============================================================
INSERT INTO products (id, name, description, price_ars, maples_equivalent, unit_text, icon, badge, sort_order) VALUES
  ('maple-30', 'Maple Clásico (30 Huevos Grandes)',
   'Huevos frescos seleccionados de granja propia en Punta Lara. Yema intensa y clara densa.',
   4900, 1.0, '30 unidades', '🥚', 'Más Elegido', 1),
  ('pack-3-maples', 'Combo Ahorro (3 Maples / 90 Huevos)',
   'La opción más inteligente. Llevá 3 maples juntos para tu casa o compartí con un vecino y no pagás flete.',
   14500, 3.0, '90 unidades (3 maples)', '📦', '🔥 ¡Envío Gratis!', 2),
  ('docena-12', 'Estuche Docena (12 Huevos)',
   'Estuche protector compacto para consumo semanal de parejas o estudiantes.',
   2200, 0.4, '12 unidades', '🍳', 'Ideal Deptos', 3),
  ('media-docena-6', 'Media Docena (6 Huevos)',
   'Pack chico para consumo rápido o repostería eventual.',
   1200, 0.2, '6 unidades', '🧁', 'Práctico', 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_ars = EXCLUDED.price_ars,
  maples_equivalent = EXCLUDED.maples_equivalent,
  unit_text = EXCLUDED.unit_text,
  icon = EXCLUDED.icon,
  badge = EXCLUDED.badge,
  sort_order = EXCLUDED.sort_order,
  active = true;
