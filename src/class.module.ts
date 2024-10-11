import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'API_GATEWAY',
        transport: Transport.TCP,
        options: {
          host: process.env.APIGATEWAY_HOST || 'localhost',
          port: 3000,
        },
      },
    ]),
  ],
  controllers: [ClassController],
  providers: [ClassService],
})
export class ClassModule {}
