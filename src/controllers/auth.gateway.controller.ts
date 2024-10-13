import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, map } from 'rxjs';
import { Public } from 'src/decorator/public.decorator';
import { ServiceHealth } from 'src/decorator/serviec-healths';
import { SignInDto } from 'src/dto/auth/signIn.dto';
import { SignUpDto } from 'src/dto/auth/signUp.dto';
import { SocketGateway } from 'src/socket/socket.gateway';
import checkResponseError from 'src/utils/checkResponseError';
import { LoggerUtil } from 'src/utils/Logger';

@ServiceHealth
@Controller('auth')
export class AuthGatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('REDIS_SERVICE') private readonly redisClient: ClientProxy,
    // @Inject('MAIL_SERVICE') private readonly mailClient: ClientProxy,
    private readonly socket: SocketGateway,
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
    // await this.mailClient.connect();
    const { status, data, error } = await lastValueFrom(
      this.authClient.send({ cmd: 'signup' }, payload),
    );

    if (status === 'error') {
      LoggerUtil.log(error, 'Signup Process');
      throw new HttpException(error, 403);
    } else {
      LoggerUtil.log(`${payload.email} wrote to database`, 'Signup Process');

      return { message: 'Check your email for confirmation' };
    }
  }

  @Public()
  @Post('/signIn')
  async signIn(@Body() payload: SignInDto) {
    LoggerUtil.log(`${payload.email} is signing in`, 'Reviced Signin Request');

    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'signin' }, payload),
    );

    await checkResponseError(response, { context: 'Signin Process' });

    this.redisClient.send(
      { cmd: 'set' },
      { key: payload.email, value: response.refreshToken },
    );

    LoggerUtil.log(
      `Store refresh token of ${payload.email}`,
      'Stored Refresh Token',
    );

    return { data: { accessToken: response.accessToken } };
  }

  @Public()
  @Post('/refreshToken')
  async refreshToken(@Body() payload: { email: string; refreshToken: string }) {
    const response = await lastValueFrom(
      this.redisClient.send({ cmd: 'get' }, { key: payload.email }),
    );

    if (response === payload.refreshToken) {
      LoggerUtil.log(
        `Refresh token of ${payload.email} is valid`,
        'Refresh Token Process',
      );

      const response = await lastValueFrom(
        this.authClient.send({ cmd: 'refreshToken' }, { email: payload.email }),
      );

      if (response.status === 'error') {
        LoggerUtil.log(response.message, 'Refresh Token Process');
        throw new HttpException(response.message, 500);
      }

      LoggerUtil.log('Refresh token success', 'Refresh Token Process');

      return { data: { accessToken: response.accessToken } };
    } else {
      LoggerUtil.log('Refresh token is invalid', 'Refresh Token Process');
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  @Post('/logOut')
  async logout(@Req() req: Request & { user: { uuid: string } }) {
    const response = await lastValueFrom(
      this.authClient.send({ cmd: 'logout' }, req.user.uuid),
    );

    if (response.status === 'error') {
      LoggerUtil.log(response.message, 'Logout Process');
      throw new HttpException(response.message, 500);
    }

    LoggerUtil.log('Logout success', 'Logout Process');

    return { data: { message: response.message } };
  }
}
