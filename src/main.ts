import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { UserModule } from './user.module';
import { ServiceExceptionFilter } from './exception/SerivceExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserModule, {
    transport: Transport.TCP,
    options: {
      port: 4007,
      host: process.env.HOST || 'localhost',
    },
  });

  app.useGlobalFilters(new ServiceExceptionFilter());

  await app.listen();
}
bootstrap();
