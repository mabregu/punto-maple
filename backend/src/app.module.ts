import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { CouponsModule } from './coupons/coupons.module';

@Module({
  imports: [ProductsModule, OrdersModule, ReviewsModule, PaymentsModule, CouponsModule],
  controllers: [HealthController],
})
export class AppModule {}
