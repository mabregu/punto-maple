import { Body, Controller, Get, Headers, Param, Patch } from '@nestjs/common';
import { assertAdmin } from '../admin';
import { ProductsService, UpdateProductDto } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('admin')
  findAllForAdmin(@Headers() headers: Record<string, any>) {
    assertAdmin(headers);
    return this.productsService.findAllForAdmin();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Headers() headers: Record<string, any>,
  ) {
    assertAdmin(headers);
    return this.productsService.update(id, dto);
  }
}
