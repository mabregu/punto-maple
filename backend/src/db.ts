import { Pool } from 'pg';

/**
 * Pool de conexiones a Neon Postgres.
 * Neon requiere TLS; rejectUnauthorized: false es el estándar para su proxy.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function checkDb(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch {
    return false;
  }
}
