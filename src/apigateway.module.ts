import { SocketModule } from 'src/socket/socket.module';
import { Module } from '@nestjs/common';
import { AuthGatewayController } from './controllers/auth.gateway.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_GUARD } from '@nestjs/core';
import { ApiGuard } from './guard/Api/api.guard';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClusteringGatewayController } from './controllers/clustering.gateway.controller';
import { ClassGatewayController } from './controllers/class.gateway.controller';
import { ClassManagementGatewayController } from './controllers/classManagement.controller';
import { UserController } from './controllers/user.gateway.controller';
import { PostGatewayController } from './controllers/post.gateway.controller';
import { SocketForwardingController } from './controllers/socket.forwarding.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SocketModule,
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_HOST ?? 'localhost',
          port: 4001,
        },
      },
      {
        name: 'REDIS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: 6379,
        },
      },
      {
        name: 'CLASS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.CLASS_HOST ?? 'localhost',
          port: 4002,
        },
      },
      {
        name: 'CLASSMANAGEMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.CLASSMANAGEMENT_HOST ?? 'localhost',
          port: 4003,
        },
      },
      {
        name: 'POST_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.POST_HOST ?? 'localhost',
          port: 4006,
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_HOST ?? 'localhost',
          port: 4007,
        },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.NOTIFICATION_HOST ?? 'localhost',
          port: 4004,
        },
      },
    ]),
  ],
  controllers: [
    AuthGatewayController,
    ClusteringGatewayController,
    ClassGatewayController,
    ClassManagementGatewayController,
    UserController,
    PostGatewayController,
    SocketForwardingController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiGuard,
    },
  ],
})
export class ApiGatewayModule {}
