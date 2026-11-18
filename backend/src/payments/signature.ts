import * as crypto from 'crypto';

/**
 * Valida la firma de los webhooks de Mercado Pago.
 * Manifest exacto: id:{data.id};request-id:{x-request-id};ts:{ts};
 */
export function validateMercadoPagoSignature(opts: {
  xSignature?: string;
  xRequestId?: string;
  dataId?: string;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = opts;
  if (!xSignature || !xRequestId || !dataId || !secret) return false;

  const parts: Record<string, string> = {};
  for (const chunk of xSignature.split(',')) {
    const [key, ...value] = chunk.trim().split('=');
    parts[key] = value.join('=');
  }
  const ts = parts['ts'];
  const hash = parts['v1'];
  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const receivedBuffer = Buffer.from(hash, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
