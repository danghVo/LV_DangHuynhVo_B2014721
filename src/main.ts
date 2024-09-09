import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const config = new ConfigService();
  const tcpPort = config.get('SERVICE_TCP_PORT');
  const host = config.get('SERVICE_HOST');
  console.log(`host: ${host}, tcp post: ${tcpPort}`);

  const service = await NestFactory.createMicroservice(AuthModule, {
    transport: Transport.TCP,
    options: {
      host,
      port: tcpPort,
      retryAttempts: 5,
    },
  });

  await service.listen();
}
bootstrap();
