import { NestFactory } from '@nestjs/core';
import { MailModule } from './mail.module';
import { Transport } from '@nestjs/microservices';
import { ServiceExceptionFilter } from './exception/SerivceExceptionFilter';

async function bootstrap() {
  const service = await NestFactory.createMicroservice(MailModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || 'localhost',
      port: 4005,
    },
  });

  service.useGlobalFilters(new ServiceExceptionFilter());

  await service.listen();
}
bootstrap();
