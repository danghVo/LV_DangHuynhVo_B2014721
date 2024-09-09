import { Module } from '@nestjs/common';
import { AuthGatewayController } from './controllers/auth.gateway.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RoleGuard } from './guard/Role/role.guard';
import { APP_GUARD } from '@nestjs/core';
import { ApiGuard } from './guard/Api/api.guard';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ClusteringGatewayController } from './controllers/clustering.gateway.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
            isGlobal: true,
    }),
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 4001
        }
      },
      {
        name: 'REDIS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: "localhost",
          port: 4003,
        },
      },
      {
        name: 'MAIL_SERVICE',
        transport: Transport.TCP,
        options: {
          host: "localhost",
          port: 4005,
        },
      },
      {
        name: "CLUSTERING_SERVICE",
        transport: Transport.REDIS,
        options: {
          host: "localhost",
          port: 6379,
        }
      }
    ])
  ],
  controllers: [AuthGatewayController, ClusteringGatewayController],
  providers: [
    {
          provide: APP_GUARD,
          useClass: ApiGuard,
      }
  ]
})
export class ApiGatewayModule {}
