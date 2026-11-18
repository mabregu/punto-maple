import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerName: string;
  phone?: string;
  zone: string;
  street: string;
  between?: string;
  payMethod: string;
  items: OrderItemInput[];
  testMode?: boolean;
}

function orderCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PM-${date}-${rand}`;
}

@Injectable()
export class OrdersService {
  async create(dto: CreateOrderDto) {
    if (!dto.customerName?.trim() || !dto.street?.trim() || !dto.zone?.trim()) {
      throw new BadRequestException('Faltan datos de entrega');
    }
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    const ids = dto.items.map((i) => i.productId);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const { rows: products } = await pool.query(
      `SELECT id, name, price_ars, maples_equivalent FROM products
       WHERE active = true AND id IN (${placeholders})`,
      ids,
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let totalMaples = 0;
    const lines: Array<{ productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number }> = [];

    for (const item of dto.items) {
      const product = byId.get(item.productId);
      if (!product) continue;
      const quantity = Math.max(1, Math.min(50, Math.trunc(Number(item.quantity) || 1)));
      const unitPrice = Number(product.price_ars);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      totalMaples += Number(product.maples_equivalent) * quantity;
      lines.push({
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    if (lines.length === 0) {
      throw new BadRequestException('Ningún producto del carrito está disponible');
    }

    const payMethod = dto.payMethod?.trim() || 'Efectivo al recibir';
    const isCash = /efectivo/i.test(payMethod);
    const discountRate = Number(process.env.CASH_DISCOUNT_RATE || 0.1);
    const discount = isCash ? Math.round(subtotal * discountRate) : 0;

    const threshold = Number(process.env.FREE_SHIPPING_MAPLES_THRESHOLD || 3);
    const shippingCost = Number(process.env.SHIPPING_COST_ARS || 1500);
    const shipping = totalMaples >= threshold ? 0 : shippingCost;
    const total = subtotal - discount + shipping;
    const code = orderCode();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO orders
          (code, customer_name, phone, zone, street, between_street, pay_method,
           subtotal_ars, discount_ars, shipping_ars, total_ars, total_maples, status, is_test)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'confirmado',$13)`,
        [
          code,
          dto.customerName.trim(),
          dto.phone?.trim() || null,
          dto.zone.trim(),
          dto.street.trim(),
          dto.between?.trim() || null,
          payMethod,
          subtotal,
          discount,
          shipping,
          total,
          Number(totalMaples.toFixed(2)),
          dto.testMode === true,
        ],
      );
      for (const line of lines) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_ars, line_total_ars)
           VALUES ((SELECT id FROM orders WHERE code = $1), $2, $3, $4, $5, $6)`,
          [code, line.productId, line.name, line.quantity, line.unitPrice, line.lineTotal],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return {
      code,
      isTest: dto.testMode === true,
      customerName: dto.customerName.trim(),
      zone: dto.zone.trim(),
      street: dto.street.trim(),
      payMethod,
      items: lines,
      subtotalArs: subtotal,
      discountArs: discount,
      hasCashDiscount: discount > 0,
      shippingArs: shipping,
      totalArs: total,
      totalMaples: Number(totalMaples.toFixed(2)),
      isFreeShipping: shipping === 0,
      whatsappText: this.buildWhatsappText({
        code, customerName: dto.customerName.trim(), phone: dto.phone,
        zone: dto.zone.trim(), street: dto.street.trim(), between: dto.between,
        payMethod, lines, subtotal, discount, shipping, total,
      }),
    };
  }

  async findByCode(code: string) {
    const { rows } = await pool.query(`SELECT * FROM orders WHERE code = $1`, [code]);
    if (rows.length === 0) throw new NotFoundException('Pedido no encontrado');
    const order = rows[0];
    const items = await pool.query(
      `SELECT product_name, quantity, unit_price_ars, line_total_ars FROM order_items WHERE order_id = $1`,
      [order.id],
    );
    return {
      code: order.code,
      customerName: order.customer_name,
      zone: order.zone,
      street: order.street,
      status: order.status,
      subtotalArs: Number(order.subtotal_ars),
      discountArs: Number(order.discount_ars),
      shippingArs: Number(order.shipping_ars),
      totalArs: Number(order.total_ars),
      payMethod: order.pay_method,
      paymentStatus: order.payment_status,
      paymentId: order.payment_id,
      preferenceId: order.preference_id,
      paidAt: order.paid_at,
      isTest: order.is_test,
      createdAt: order.created_at,
      items: items.rows,
    };
  }

  async findAll() {
    const { rows } = await pool.query(`
      SELECT code, customer_name, phone, zone, street, between_street, pay_method,
             subtotal_ars, discount_ars, total_ars, total_maples, status,
             payment_status, payment_id, is_test, created_at
      FROM orders ORDER BY created_at DESC LIMIT 100
    `);
    return rows;
  }

  /** Borra únicamente pedidos marcados como prueba (y sus ítems/reseñas por cascade). */
  async deleteTestOrders() {
    const { rowCount } = await pool.query(`DELETE FROM orders WHERE is_test = true`);
    return { deleted: rowCount ?? 0 };
  }

  async updateStatus(code: string, status: string) {
    const allowed = ['confirmado', 'pagado', 'preparando', 'en camino', 'entregado', 'cancelado'];
    if (!allowed.includes(status)) throw new BadRequestException('Estado inválido');
    const { rowCount } = await pool.query(
      `UPDATE orders SET status = $1, updated_at = now() WHERE code = $2`,
      [status, code],
    );
    if (rowCount === 0) throw new NotFoundException('Pedido no encontrado');
    return this.findByCode(code);
  }

  private buildWhatsappText(o: {
    code: string; customerName: string; phone?: string; zone: string; street: string;
    between?: string; payMethod?: string;
    lines: Array<{ name: string; quantity: number; lineTotal: number }>;
    subtotal: number; discount: number; shipping: number; total: number;
  }): string {
    const money = (n: number) => `$${n.toLocaleString('es-AR')}`;
    const rate = Math.round(Number(process.env.CASH_DISCOUNT_RATE || 0.1) * 100);

    // Texto plano: sin emojis ni viñetas unicode para que se lea igual en cualquier dispositivo.
    let text = `*¡Hola Punto Maple! Quiero encargar huevos frescos:*\n\n`;
    text += `*Pedido:* ${o.code}\n`;
    text += `*Cliente:* ${o.customerName}\n`;
    text += `*Zona:* ${o.zone}\n`;
    text += `*Dirección:* ${o.street}${o.between ? ` (Entre: ${o.between})` : ''}\n`;
    if (o.phone) text += `*Teléfono:* ${o.phone}\n`;
    text += `*Forma de Pago:* ${o.payMethod || 'Efectivo al recibir'}\n\n`;

    text += `*DETALLE DEL PEDIDO:*\n`;
    for (const line of o.lines) {
      text += `- ${line.quantity}x ${line.name} (${money(line.lineTotal)})\n`;
    }

    text += `\nSubtotal: ${money(o.subtotal)}\n`;
    if (o.discount > 0) {
      text += `Descuento por pago en efectivo (${rate}%): -${money(o.discount)}\n`;
    }
    text += `Envío: ${o.shipping === 0 ? 'GRATIS (Promo 3+ maples)' : money(o.shipping)}\n`;
    text += `*TOTAL ESTIMADO: ${money(o.total)}*\n\n`;
    text += `_¿Qué día y franja horaria tienen reparto para mi zona?_`;
    return text;
  }
}
