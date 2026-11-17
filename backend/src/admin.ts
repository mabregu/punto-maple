import { UnauthorizedException } from '@nestjs/common';

/** Guard mínimo para las rutas de operación (sin dependencias externas). */
export function assertAdmin(headers: Record<string, any>): void {
  const configured = process.env.ADMIN_TOKEN;
  const received = headers['x-admin-token'];
  if (!configured || received !== configured) {
    throw new UnauthorizedException('Token de administrador inválido');
  }
}
