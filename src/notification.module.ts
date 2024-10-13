import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
// import { SocketModule } from 'src/socket/socket.module';

@Module({
  //   imports: [PrismaModule, SocketModule],
  imports: [
    ClientsModule.register([
      {
        name: 'API_GATEWAY',
        transport: Transport.TCP,
        options: {
          host: process.env.API_GATEWAY_HOST ?? 'localhost',
          port: parseInt(process.env.API_GATEWAY_PORT ?? '4000'),
        },
      },
    ]),
  ],
  exports: [NotificationService],
  providers: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
