import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { SocketModule } from './socket.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(SocketModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || 'localhost',
      port: 4008,
    },
  });

  await app.listen();
}
bootstrap();
