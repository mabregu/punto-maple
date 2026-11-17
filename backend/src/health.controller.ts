import { Controller, Get } from '@nestjs/common';
import { checkDb } from './db';

@Controller('health')
export class HealthController {
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
