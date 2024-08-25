import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guard/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({})
  ],
  controllers: [AuthController],
  providers: [
      AuthService,
      {
          provide: APP_GUARD,
          useClass: AuthGuard,
      },
  ],
})
export class AuthModule {}