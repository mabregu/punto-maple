import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';

const MP_API = 'https://api.mercadopago.com';

function accessToken(): string {
  return process.env.MP_ACCESS_TOKEN || '';
}

function isTestMode(): boolean {
  return (process.env.MP_MODE || 'test') === 'test';
}

@Injectable()
export class PaymentsService {
  /** Crea la preferencia de Checkout Pro para un pedido ya registrado. */
  async createPreference(code: string) {
    const { rows } = await pool.query(
      `SELECT code, pay_method, payment_status, shipping_ars, total_ars
       FROM orders WHERE code = $1`,
      [code],
    );
    if (rows.length === 0) throw new NotFoundException('Pedido no encontrado');
    const order = rows[0];

    if (order.payment_status === 'approved') {
      throw new BadRequestException('Este pedido ya fue pagado');
    }

    const { rows: items } = await pool.query(
      `SELECT product_name, quantity, unit_price_ars FROM order_items
       WHERE order_id = (SELECT id FROM orders WHERE code = $1)`,
      [code],
    );
    if (items.length === 0) throw new BadRequestException('El pedido no tiene ítems');

    const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');

    const preferenceItems = items.map((i) => ({
      title: i.product_name,
      quantity: i.quantity,
      unit_price: Number(i.unit_price_ars),
      currency_id: 'ARS',
    }));

    // El total de la preferencia debe igualar el total del pedido: incluimos el envío.
    const charged = preferenceItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const missing = Number(order.total_ars) - charged;
    if (missing > 0) {
      preferenceItems.push({
        title: Number(order.shipping_ars) > 0 ? 'Envío a domicilio - Punto Maple' : 'Ajuste de pedido',
        quantity: 1,
        unit_price: missing,
        currency_id: 'ARS',
      });
    }

    const preference = {
      items: preferenceItems,
      external_reference: code,
      back_urls: {
        success: `${frontend}/pedido/${code}?status=approved`,
        pending: `${frontend}/pedido/${code}?status=pending`,
        failure: `${frontend}/pedido/${code}?status=rejected`,
      },
      auto_return: 'approved',
      notification_url: 'https://punto-maple-backend.onrender.com/api/payments/webhook',
      statement_descriptor: 'PUNTO MAPLE',
    };

    const response = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken()}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new BadRequestException(`Mercado Pago rechazó la preferencia: ${detail.slice(0, 200)}`);
    }

    const pref: any = await response.json();
    await pool.query(
      `UPDATE orders SET preference_id = $1, payment_status = 'pending', updated_at = now()
       WHERE code = $2`,
      [pref.id, code],
    );

    return {
      preferenceId: pref.id,
      initPoint: isTestMode() ? pref.sandbox_init_point : pref.init_point,
      orderCode: code,
      amount: Number(order.total_ars),
    };
  }

  /** Procesa la notificación: consulta el pago real y actualiza el pedido de forma idempotente. */
  async handleWebhook(body: any) {
    const paymentId = body?.data?.id;
    if (!paymentId) return { received: true, ignored: true, reason: 'sin payment id' };

    const response = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken()}` },
    });
    if (!response.ok) return { received: true, ignored: true, reason: 'no se pudo consultar el pago' };

    const payment: any = await response.json();
    return this.applyPayment(payment);
  }

  /** Respaldo: cuando el cliente vuelve del checkout, consultamos MP por external_reference. */
  async verifyPayment(code: string) {
    const { rows } = await pool.query(`SELECT code FROM orders WHERE code = $1`, [code]);
    if (rows.length === 0) throw new NotFoundException('Pedido no encontrado');

    const response = await fetch(
      `${MP_API}/v1/payments/search?external_reference=${encodeURIComponent(code)}`,
      { headers: { Authorization: `Bearer ${accessToken()}` } },
    );
    if (!response.ok) return { received: true, ignored: true, reason: 'no se pudo consultar MP' };

    const result: any = await response.json();
    const payments = result.results || [];
    const payment = payments.find((p: any) => p.status === 'approved') || payments[0];
    if (!payment) return { received: true, ignored: true, reason: 'sin pago para este pedido' };

    return this.applyPayment(payment);
  }

  private async applyPayment(payment: any) {
    const code = payment.external_reference;
    const status = payment.status;
    if (!code || !status) return { received: true, ignored: true, reason: 'pago sin referencia' };

    const { rowCount } = await pool.query(
      `INSERT INTO mp_webhook_events (payment_id, status) VALUES ($1, $2)
       ON CONFLICT (payment_id, status) DO NOTHING`,
      [String(payment.id), status],
    );
    if (rowCount === 0) return { received: true, duplicate: true };

    const current = await pool.query(
      `SELECT payment_status FROM orders WHERE code = $1`,
      [code],
    );
    if (current.rows.length === 0) return { received: true, ignored: true, reason: 'orden inexistente' };
    if (current.rows[0].payment_status === 'approved' && status !== 'approved') {
      return { received: true, ignored: true, reason: 'pago ya aprobado' };
    }

    if (status === 'refunded' || status === 'charged_back') {
      await pool.query(
        `UPDATE orders SET payment_status = $1, status = 'cancelado', updated_at = now()
         WHERE code = $2`,
        [status, code],
      );
    } else if (status === 'approved') {
      // El pago no cambia el estado de entrega: ese lo maneja el operador en /admin.
      await pool.query(
        `UPDATE orders SET payment_status = 'approved', payment_id = $1, paid_at = now(),
         updated_at = now() WHERE code = $2`,
        [String(payment.id), code],
      );
    } else {
      await pool.query(
        `UPDATE orders SET payment_status = $1, payment_id = $2, updated_at = now()
         WHERE code = $3`,
        [status, String(payment.id), code],
      );
    }

    return { received: true, code, status };
  }
}
