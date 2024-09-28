import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  Inject,
  Logger,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Validate } from 'class-validator';
import { response } from 'express';
import { lastValueFrom, map } from 'rxjs';
import { Public } from 'src/decorator/public.decorator';
import { ServiceHealth } from 'src/decorator/serviec-healths';
import { SignInDto } from 'src/dto/auth/signIn.dto';
import { SignUpDto } from 'src/dto/auth/signUp.dto';
import { ResponseFailPayload } from 'src/type/generate';
import checkResponseError from 'src/utils/checkResponseError';
import { LoggerUtil } from 'src/utils/Logger';

@ServiceHealth
@Controller('auth')
export class AuthGatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('REDIS_SERVICE') private readonly redisClient: ClientProxy,
    @Inject('MAIL_SERVICE') private readonly mailClient: ClientProxy,
  ) {}

  async isAlive() {
    return await lastValueFrom(
      this.authClient
        .send({ cmd: 'ping' }, {})
        .pipe(map((message: string) => message)),
    );
  }

  @Public()
  @Post('/signUp')
  async signUp(@Body() payload: SignUpDto) {
    await this.mailClient.connect();
    const { status, data, error } = await lastValueFrom(
      this.authClient.send({ cmd: 'signup' }, payload),
    );

    if (status === 'error') {
      LoggerUtil.log(error, 'Signup Process');
      throw new HttpException(error, 403);
    } else {
      LoggerUtil.log(`${payload.email} wrote to database`, 'Signup Process');
      this.mailClient.send({ cmd: 'send-mail-confirm' }, { email: data.email });
      LoggerUtil.log(`Send OTP to ${data.email}`, 'Signup Process');

      return { message: 'Check your email for confirmation' };
    }
  }

  @Public()
  @Post('/signIn')
  async signIn(@Body() payload: SignInDto) {
    LoggerUtil.log(`${payload.email} is signing in`, 'Reviced Signin Request');

    const response = this.authClient.send<{
      accessToken: string;
      refreshToken: string;
    }>({ cmd: 'signin' }, payload);

    await checkResponseError(response, { context: 'Signin Process' });

    response.subscribe((message) => {
      this.redisClient.send(
        { cmd: 'set' },
        { key: payload.email, value: message.refreshToken },
      );

      LoggerUtil.log(
        `Store refresh token of ${payload.email}`,
        'Stored Refresh Token',
      );
    });

    const responseRetrive = (await lastValueFrom(response)) as {
      accessToken: string;
      refreshToken: string;
    };

    return { data: { accessToken: responseRetrive.accessToken } };
  }

  @Post('/resendOtp')
  async resendOTP(@Body() payload: { email: string }) {
    const response = await lastValueFrom(
      this.mailClient.send({ cmd: 'send-mail-confirm' }, payload),
    );

    if (response.status === 'error') {
      LoggerUtil.log(response.message, 'Resend OTP Process');
      throw new HttpException(response.message, 500);
    }

    LoggerUtil.log(`Resend OTP to ${payload.email}`, 'Resend OTP Process');

    return { message: 'Check your email for confirmation' };
  }

  @Public()
  @Post('/logOut')
  async logout() {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'logout' }, {}),
    );

    if (response.status === 'error') {
      LoggerUtil.log(response.message, 'Logout Process');
      throw new HttpException(response.message, 500);
    }

    LoggerUtil.log('Logout success', 'Logout Process');

    return { message: response.message };
  }
}
