import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';

async function bootstrap() {
  const config = new ConfigService();
  const port = config.get('SERVICE_PORT');
  const tcpPort = config.get('SERVICE_TCP_PORT');
  const host = config.get('SERVICE_HOST');
  console.log(`host: ${host}, port: ${port}, tcp post: ${tcpPort}`);

  const service = await NestFactory.create(AuthModule)

  service.connectMicroservice({
      transport: Transport.TCP,
      options: {
        host,
        port: tcpPort,
        retryAttempts: 5,
      }
    },
  );

  service.use(session({
    secret: "client-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 60000,
    }
  }))

  await service.startAllMicroservices();
  await service.listen(port);
}
bootstrap();
