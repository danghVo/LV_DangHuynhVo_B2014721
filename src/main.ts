import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './apigateway.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const port = process.env.APP_PORT;
  
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableCors();
  app.setGlobalPrefix("api");

  Logger.log(`ApiGateway is running on: ${port}`, 'Bootstrap');
  await app.listen(port);
}
bootstrap();
