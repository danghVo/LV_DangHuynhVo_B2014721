import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './apigateway.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionFilter } from './exception/AllExceptionFilter';

async function bootstrap() {
  const port = process.env.PORT;

  const app = await NestFactory.create(ApiGatewayModule);

  Logger.log(`ApiGateway is running on: ${port}`, 'Bootstrap');

  app.useGlobalFilters(new AllExceptionFilter(app.get(HttpAdapterHost)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimating unwanted fields
    }),
  );

  app.setGlobalPrefix('api');
  app.enableCors();

  await app.listen(port);
}

bootstrap();
