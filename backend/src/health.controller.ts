import { Controller, Get } from '@nestjs/common';
import { checkDb } from './db';

@Controller('health')
export class HealthController {
  /** Ping liviano para monitores externos: no consulta la DB, responde siempre rápido. */
  @Get('ping')
  ping() {
    return { status: 'ok', service: 'punto-maple-api', timestamp: new Date().toISOString() };
  }

  @Get()
  async health() {
    const db = await checkDb();
    return {
      status: db ? 'ok' : 'degraded',
      service: 'punto-maple-api',
      database: db ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
