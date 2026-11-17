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
    const { rowCount } = await pool.query(
      `UPDATE reviews SET status = $1, updated_at = now() WHERE id::text = $2`,
      [status, id],
    );
    if (rowCount === 0) throw new BadRequestException('Reseña no encontrada');
    return { ok: true, status };
  }

  async findPending() {
    const { rows } = await pool.query(`
      SELECT id::text, order_code, rating, tags, comment, photo_url, created_at
      FROM reviews WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50
    `);
    return rows;
  }
}
