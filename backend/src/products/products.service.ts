import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  priceArs: number;
  maplesEquivalent: number;
  unitText: string;
  icon: string;
  badge: string | null;
  sortOrder: number;
  active: boolean;
  updatedAt: string;
}

export interface UpdateProductDto {
  priceArs?: number;
  maplesEquivalent?: number;
  active?: boolean;
  name?: string;
  description?: string;
  unitText?: string;
  badge?: string | null;
}

@Injectable()
export class ProductsService {
  async findAll(): Promise<ProductDto[]> {
    const { rows } = await pool.query(`
      SELECT id, name, description, price_ars, maples_equivalent,
             unit_text, icon, badge, sort_order, active, updated_at
      FROM products
      WHERE active = true
      ORDER BY sort_order ASC
    `);
    return rows.map(this.toDto);
  }

  async findAllForAdmin(): Promise<ProductDto[]> {
    const { rows } = await pool.query(`
      SELECT id, name, description, price_ars, maples_equivalent,
             unit_text, icon, badge, sort_order, active, updated_at
      FROM products
      ORDER BY sort_order ASC
    `);
    return rows.map(this.toDto);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDto> {
    const { rows } = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (rows.length === 0) throw new NotFoundException('Producto no encontrado');
    const current = rows[0];

    if (dto.priceArs !== undefined) {
      const price = Number(dto.priceArs);
      if (!Number.isInteger(price) || price < 0) {
        throw new BadRequestException('El precio debe ser un número entero mayor o igual a cero');
      }
    }
    if (dto.maplesEquivalent !== undefined) {
      const equivalent = Number(dto.maplesEquivalent);
      if (!Number.isFinite(equivalent) || equivalent <= 0) {
        throw new BadRequestException('La equivalencia en maples debe ser mayor a cero');
      }
    }

    const priceArs = dto.priceArs !== undefined ? Number(dto.priceArs) : Number(current.price_ars);
    const maplesEquivalent = dto.maplesEquivalent !== undefined
      ? Number(dto.maplesEquivalent)
      : Number(current.maples_equivalent);
    const active = dto.active !== undefined ? dto.active === true : current.active;
    const name = dto.name !== undefined ? String(dto.name).trim() : current.name;
    const description = dto.description !== undefined ? String(dto.description) : current.description;
    const unitText = dto.unitText !== undefined ? String(dto.unitText) : current.unit_text;
    const badge = dto.badge !== undefined ? (dto.badge || null) : current.badge;

    const { rows: updated } = await pool.query(
      `UPDATE products SET name = $1, description = $2, price_ars = $3,
       maples_equivalent = $4, unit_text = $5, badge = $6, active = $7,
       updated_at = now()
       WHERE id = $8
       RETURNING id, name, description, price_ars, maples_equivalent,
                 unit_text, icon, badge, sort_order, active, updated_at`,
      [name, description, priceArs, maplesEquivalent, unitText, badge, active, id],
    );
    return this.toDto(updated[0]);
  }

  private toDto(r: any): ProductDto {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      priceArs: Number(r.price_ars),
      maplesEquivalent: Number(r.maples_equivalent),
      unitText: r.unit_text,
      icon: r.icon,
      badge: r.badge,
      sortOrder: r.sort_order,
      active: r.active,
      updatedAt: r.updated_at,
    };
  }
}
