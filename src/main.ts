import { NestFactory } from '@nestjs/core';
import { Transport, BaseRpcExceptionFilter } from '@nestjs/microservices';
import { PostModule } from './post.module';
import { ServiceExceptionFilter } from './exception/SerivceExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(PostModule, {
    transport: Transport.TCP,
    options: {
      port: 4006,
      host: process.env.HOST || 'localhost',
    },
  });

  app.useGlobalFilters(new ServiceExceptionFilter());

  await app.listen();
}
bootstrap();
