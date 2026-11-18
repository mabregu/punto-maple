import { Body, Controller, Headers, Post, Query, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { validateMercadoPagoSignature } from './signature';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('preference')
  createPreference(@Body() body: { code: string }) {
    return this.paymentsService.createPreference(body.code);
  }

  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers() headers: Record<string, any>,
    @Query() query: Record<string, any>,
  ) {
    const secret = process.env.MP_WEBHOOK_SECRET || '';
    const dataId = String(body?.data?.id || query['data.id'] || '');

    if (secret) {
      const valid = validateMercadoPagoSignature({
        xSignature: headers['x-signature'],
        xRequestId: headers['x-request-id'],
        dataId,
        secret,
      });
      if (!valid) throw new UnauthorizedException('Firma de webhook inválida');
    } else if ((process.env.MP_MODE || 'test') !== 'test') {
      throw new UnauthorizedException('Webhook sin secret configurado');
    }

    return this.paymentsService.handleWebhook(body);
  }
}
