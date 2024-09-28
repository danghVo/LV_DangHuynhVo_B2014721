import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRoot({
      transport: {
        service: 'Gmail',
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
          type: 'OAuth2',
          clientSecret: process.env.MAIL_CLIENT_SECRET,
          user: process.env.MAIL_USER,
          clientId: process.env.MAIL_CLIENT_ID,
          expires: 3599,
          accessToken: process.env.MAIL_ACCESS_TOKEN,
          refreshToken: process.env.MAIL_REFRESH_TOKEN,
        },
      },
      defaults: {
        from: 'No reply from SupEdu',
      },
    }),
    ClientsModule.register([
      {
        name: 'REDIS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: 6379,
        },
      },
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
  controllers: [MailController],
  providers: [MailService],
})
export class MailModule {}
