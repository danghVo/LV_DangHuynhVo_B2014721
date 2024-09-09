 import { Body, Controller, ForbiddenException, Get, Inject, Logger, Post } from '@nestjs/common';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, map } from 'rxjs';
import { Public } from 'src/decorator/public.decorator';
import { SignInDto } from 'src/dto/auth/signIn.dto';
import { SignUpDto } from 'src/dto/auth/signUp.dto';
import { LoggerUtil } from 'src/Util/Logger';

@Controller("auth")
export class AuthGatewayController {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
    @Inject("REDIS_SERVICE") private readonly redisClient: ClientProxy,
    @Inject("MAIL_SERVICE") private readonly mailClient: ClientProxy
  ) { }

  @Public()
  @Post("/sign-up")
  async signUp(@Body() payload: SignUpDto) {
    try {
      // await this.mailClient.connect()
      const { status, data, error } = await lastValueFrom(this.authClient.send({ cmd: "signup" }, payload));
        
      console.log(data)
      if(status === "fail") {
        throw new ForbiddenException(error);
      } else {
        LoggerUtil.log(`${payload.email} wrote to database`, "Signup Process");
        this.mailClient.send({ cmd: 'send-mail-confirm' }, { email: data.email }).subscribe();
        LoggerUtil.log(`Send OTP to ${data.email}`, "Signup Process");

        return { message: "Check your email for confirmation" };
      }
    } catch (error) {
      console.log(error)
      LoggerUtil.error(error, "Signup Process");

      return { message: error }
    }
  }
  
  @Public()
  @Post("/sign-in")
  async signIn(@Body() payload: SignInDto ) {
    LoggerUtil.log(`${payload.email} is signing in`, "Reviced Signin Request");
    
    const data = this.authClient.send<{ accessToken: string, refreshToken: string }>({ cmd: "signin" }, payload);
    
    data.subscribe((message) => {
      this.redisClient.connect();
      this.redisClient.send({ cmd: "set-key" }, { key: payload.email, value: message.refreshToken });
      LoggerUtil.log(`Store refresh token of ${payload.email}`, "Stored Refresh Token");
    })

    const responsePayload = data.pipe(map((message) => ({ accessToken: message.accessToken })))
      
    return responsePayload;
  }

  @Post("/resend-otp")
  async resendOTP(@Body() payload: { email: string }) {
    const data = this.mailClient.send({ cmd: "send-mail-confirm" }, payload);
    LoggerUtil.log(`Resend OTP to ${payload.email}`, "Resend OTP Process");

    return { message: "Check your email for confirmation" };
  }
  
  @Public()
  @Post("/log-out")
  async logout() {
    return this.authClient.send({ cmd: "logout" }, {});
  }
}
