import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { assertAdmin } from '../admin';
import { CreateOrderDto, OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  findAll(@Headers() headers: Record<string, any>) {
    assertAdmin(headers);
    return this.ordersService.findAll();
  }

  @Delete('test')
  deleteTest(@Headers() headers: Record<string, any>) {
    assertAdmin(headers);
    return this.ordersService.deleteTestOrders();
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.ordersService.findByCode(code);
  }

  @Patch(':code/status')
  updateStatus(
    @Param('code') code: string,
    @Body() body: { status: string },
    @Headers() headers: Record<string, any>,
  ) {
    assertAdmin(headers);
    return this.ordersService.updateStatus(code, body.status);
  }
}
