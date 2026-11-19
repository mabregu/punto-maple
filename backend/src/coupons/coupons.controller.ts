import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { assertAdmin } from '../admin';
import { CouponsService, CreateCouponDto } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  findAll(@Headers() headers: Record<string, any>) {
    assertAdmin(headers);
    return this.couponsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCouponDto, @Headers() headers: Record<string, any>) {
    assertAdmin(headers);
    return this.couponsService.create(dto);
  }

  @Post('validate')
  validate(@Body() body: { code: string; subtotal: number }) {
    return this.couponsService.validate(body.code, Number(body.subtotal) || 0);
  }

  @Patch(':code')
  setActive(
    @Param('code') code: string,
    @Body() body: { active: boolean },
    @Headers() headers: Record<string, any>,
  ) {
    assertAdmin(headers);
    return this.couponsService.setActive(code, body.active === true);
  }
}
