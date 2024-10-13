import { NestFactory } from '@nestjs/core';
import { ClassManagementModule } from './classManagement.module';
import { Transport } from '@nestjs/microservices';
import { ServiceExceptionFilter } from './exception/SerivceExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ClassManagementModule, {
    transport: Transport.TCP,
    options: {
      port: 4003,
      host: process.env.HOST || 'localhost',
    },
  });

  app.useGlobalFilters(new ServiceExceptionFilter());

  await app.listen();
}
bootstrap();
