import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import {
  BaseRpcExceptionFilter,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { ServiceExceptionFilter } from './exception/SerivceExceptionFilter';

async function bootstrap() {
  const service = await NestFactory.createMicroservice(AuthModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.HOST ?? 'localhost',
      port: 4001,
      retryAttempts: 5,
    },
  });

  service.useGlobalFilters(new ServiceExceptionFilter());

  await service.listen();
}

bootstrap();
