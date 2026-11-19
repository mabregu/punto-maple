import { BadRequestException, Injectable } from '@nestjs/common';
import { pool } from '../db';

export interface CreateCouponDto {
  code?: string;
  description?: string;
  kind?: 'manual' | 'review' | 'referral';
  discountType?: 'percent' | 'fixed';
  value: number;
  maxUses?: number;
  expiresAt?: string | null;
}

export interface CouponDto {
  code: string;
  description: string;
  kind: string;
  discountType: string;
  value: number;
  maxUses: number;
  uses: number;
  active: boolean;
  expiresAt: string | null;
}

function toDto(r: any): CouponDto {
  return {
    code: r.code,
    description: r.description,
    kind: r.kind,
    discountType: r.discount_type,
    value: Number(r.value),
    maxUses: Number(r.max_uses),
    uses: Number(r.uses),
    active: r.active,
    expiresAt: r.expires_at,
  };
}

function generateCode(): string {
  return `VECINO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

@Injectable()
export class CouponsService {
  async findAll(): Promise<CouponDto[]> {
    const { rows } = await pool.query(`SELECT * FROM coupons ORDER BY created_at DESC LIMIT 100`);
    return rows.map(toDto);
  }

  async create(dto: CreateCouponDto): Promise<CouponDto> {
    const value = Number(dto.value);
    const discountType = dto.discountType || 'percent';
    const maxUses = Number(dto.maxUses ?? 1);

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException('El valor del descuento debe ser un entero positivo');
    }
    if (discountType === 'percent' && value > 100) {
      throw new BadRequestException('El porcentaje no puede superar 100');
    }
    if (!Number.isInteger(maxUses) || maxUses < 1) {
      throw new BadRequestException('El máximo de usos debe ser al menos 1');
    }

    const code = (dto.code?.trim() || generateCode()).toUpperCase();
    try {
      const { rows } = await pool.query(
        `INSERT INTO coupons (code, description, kind, discount_type, value, max_uses, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [
          code,
          dto.description?.trim() || 'Cupón de descuento',
          dto.kind || 'manual',
          discountType,
          value,
          maxUses,
          dto.expiresAt || null,
        ],
      );
      return toDto(rows[0]);
    } catch (error: any) {
      if (error?.code === '23505') throw new BadRequestException('Ese código de cupón ya existe');
      throw error;
    }
  }

  async setActive(code: string, active: boolean): Promise<CouponDto> {
    const { rows } = await pool.query(
      `UPDATE coupons SET active = $1 WHERE code = $2 RETURNING *`,
      [active, code.toUpperCase()],
    );
    if (rows.length === 0) throw new BadRequestException('Cupón no encontrado');
    return toDto(rows[0]);
  }

  async validate(code: string, subtotal: number) {
    const clean = code?.trim().toUpperCase();
    if (!clean) return { valid: false, reason: 'Código vacío' };

    const { rows } = await pool.query(
      `SELECT * FROM coupons
       WHERE code = $1 AND active = true AND uses < max_uses
         AND (expires_at IS NULL OR expires_at > now())`,
      [clean],
    );
    if (rows.length === 0) {
      return { valid: false, reason: 'Código inválido, vencido o sin usos disponibles' };
    }

    const coupon = toDto(rows[0]);
    const discount = coupon.discountType === 'percent'
      ? Math.round(subtotal * (coupon.value / 100))
      : Math.min(coupon.value, subtotal);

    return { valid: true, coupon, discount };
  }
}
