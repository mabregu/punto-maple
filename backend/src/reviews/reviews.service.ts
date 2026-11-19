import { BadRequestException, Injectable } from '@nestjs/common';
import { pool } from '../db';

export interface CreateReviewDto {
  orderCode: string;
  rating: number;
  tags?: string[];
  comment?: string;
  photoUrl?: string;
}

@Injectable()
export class ReviewsService {
  async create(dto: CreateReviewDto) {
    const rating = Math.trunc(Number(dto.rating));
    if (rating < 1 || rating > 5) throw new BadRequestException('La calificación debe ser entre 1 y 5');
    if (!dto.orderCode?.trim()) throw new BadRequestException('Falta el código de pedido');

    const { rowCount } = await pool.query(
      `INSERT INTO reviews (order_code, rating, tags, comment, photo_url, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (order_code) DO UPDATE SET
         rating = EXCLUDED.rating, tags = EXCLUDED.tags,
         comment = EXCLUDED.comment, photo_url = EXCLUDED.photo_url,
         status = 'pending', updated_at = now()`,
      [
        dto.orderCode.trim(),
        rating,
        dto.tags?.length ? dto.tags : [],
        dto.comment?.trim() || null,
        dto.photoUrl?.trim() || null,
      ],
    );
    return { ok: (rowCount ?? 0) > 0, status: 'pending', message: '¡Gracias! Tu reseña será publicada tras la moderación.' };
  }

  async findApproved() {
    const { rows } = await pool.query(`
      SELECT r.rating, r.tags, r.comment, r.photo_url, r.created_at,
             o.customer_name
      FROM reviews r
      LEFT JOIN orders o ON o.code = r.order_code
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT 30
    `);
    return rows.map((r) => ({
      rating: Number(r.rating),
      tags: r.tags,
      comment: r.comment,
      photoUrl: r.photo_url,
      customerName: r.customer_name,
      createdAt: r.created_at,
    }));
  }

  async moderate(id: string, status: 'approved' | 'rejected') {
    const { rows: found } = await pool.query(
      `SELECT order_code, reward_coupon_code FROM reviews WHERE id::text = $1`,
      [id],
    );
    if (found.length === 0) throw new BadRequestException('Reseña no encontrada');

    const { rowCount } = await pool.query(
      `UPDATE reviews SET status = $1, updated_at = now() WHERE id::text = $2`,
      [status, id],
    );
    if (rowCount === 0) throw new BadRequestException('Reseña no encontrada');

    let couponCode: string | null = found[0].reward_coupon_code || null;

    // Incentivo: al aprobar una reseña se genera un cupón de 10% para su próxima compra.
    if (status === 'approved' && !couponCode) {
      const suffix = String(found[0].order_code || '').slice(-4);
      let code = `GRACIAS-${suffix}`;
      const exists = await pool.query(`SELECT 1 FROM coupons WHERE code = $1`, [code]);
      if ((exists.rowCount ?? 0) > 0) {
        code = `GRACIAS-${suffix}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
      }
      await pool.query(
        `INSERT INTO coupons (code, description, kind, discount_type, value, max_uses)
         VALUES ($1, 'Descuento por tu reseña', 'review', 'percent', 10, 1)`,
        [code],
      );
      await pool.query(`UPDATE reviews SET reward_coupon_code = $1 WHERE id::text = $2`, [code, id]);
      couponCode = code;
    }

    return { ok: true, status, couponCode };
  }

  async findPending() {
    const { rows } = await pool.query(`
      SELECT id::text, order_code, rating, tags, comment, photo_url, reward_coupon_code, created_at
      FROM reviews WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50
    `);
    return rows;
  }
}
