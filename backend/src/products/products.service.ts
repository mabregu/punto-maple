import { Injectable } from '@nestjs/common';
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
}

@Injectable()
export class ProductsService {
  async findAll(): Promise<ProductDto[]> {
    const { rows } = await pool.query(`
      SELECT id, name, description, price_ars, maples_equivalent,
             unit_text, icon, badge, sort_order
      FROM products
      WHERE active = true
      ORDER BY sort_order ASC
    `);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      priceArs: Number(r.price_ars),
      maplesEquivalent: Number(r.maples_equivalent),
      unitText: r.unit_text,
      icon: r.icon,
      badge: r.badge,
      sortOrder: r.sort_order,
    }));
  }
}
