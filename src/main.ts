import { NestFactory } from '@nestjs/core';
import { MailModule } from './mail.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const service = await NestFactory.createMicroservice(MailModule, {
    transport: Transport.TCP,
    options: {
      host: "localhost",
      port: 4005,
    },
  });

  await service.listen();
}
bootstrap();
