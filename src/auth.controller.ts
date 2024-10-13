import { Body, Controller, Post, Session } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto } from './dto';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @MessagePattern({ cmd: 'ping' })
  ping() {
    return 'Pong';
  }

  @MessagePattern({ cmd: 'signup' })
  async signUp(@Body() data: SignUpDto) {
    let { isValid, error } = await this.authService.validSignUpPayload(data);

    if (isValid) {
      const result = await this.authService.signUp(data);

      return { status: 'success', data: result };
    } else return { status: 'fail', data: null, error };
  }

  @MessagePattern({ cmd: 'signin' })
  async signIn(@Body() data: SignInDto) {
    const { access_token, refresh_token } = await this.authService.signIn(data);

    return { accessToken: access_token, refreshToken: refresh_token };
  }

  @MessagePattern({ cmd: 'logout' })
  async logout(@Body() userUuid: string) {
    await this.authService.logout(userUuid);

    return { message: 'Đăng xuất thành công' };
  }

  @MessagePattern({ cmd: 'refresh-token' })
  async refreshToken(data: { refresh_token: string }) {
    return await this.authService.refreshAccessToken(data.refresh_token);
  }
}
