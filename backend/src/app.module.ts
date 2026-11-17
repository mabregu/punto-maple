import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [ProductsModule, OrdersModule, ReviewsModule],
  controllers: [HealthController],
})
export class AppModule {}
