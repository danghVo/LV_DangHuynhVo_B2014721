import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(NotificationModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || 'localhost',
      port: 4004,
    },
  });

  await app.listen();
}
bootstrap();
