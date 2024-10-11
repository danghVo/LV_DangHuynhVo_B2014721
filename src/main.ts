import { NestFactory } from '@nestjs/core';
import { ClassModule } from './class.module';
import { BaseRpcExceptionFilter, Transport } from '@nestjs/microservices';
import { ServiceExceptionFilter } from './exception/SerivceExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ClassModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || 'localhost',
      retryAttempts: 5,
      port: 4002,
    },
  });

  app.useGlobalFilters(new ServiceExceptionFilter());

  await app.listen();
}
bootstrap();
