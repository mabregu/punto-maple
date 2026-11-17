import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🥚 Punto Maple API escuchando en puerto ${port}`);
}

bootstrap();
