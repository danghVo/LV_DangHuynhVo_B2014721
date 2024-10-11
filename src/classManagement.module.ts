import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { ClassManagementController } from './classManagement.controller';
import { ClassManagementService } from './classManagement.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'API_GATEWAY',
        transport: Transport.TCP,
        options: {
          host: process.env.API_GATEWAY_HOST ?? 'localhost',
          port: parseInt(process.env.API_GATEWAY_PORT ?? '3000'),
        },
      },
    ]),
  ],
  controllers: [ClassManagementController],
  providers: [ClassManagementService],
})
export class ClassManagementModule {}
