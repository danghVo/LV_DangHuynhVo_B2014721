import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto, SignUpDto } from './dto';
import * as argon2 from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './utils/prisma.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  private prisma: PrismaService;

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    this.prisma = new PrismaService();
  }

  async signToken(
    payload: { uuid: String; email: String; role: String },
    secret: string,
    expiresIn: string = '60s',
  ) {
    return await this.jwt.signAsync(payload, { secret, expiresIn: expiresIn });
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_SECRET_KEY_REFRESH'),
      });

      delete payload.iat;
      delete payload.exp;

      const secret = this.config.get('JWT_SECRET_KEY');

      const accessToken = await this.signToken(payload, secret);

      return accessToken;
    } catch (error) {
      console.error(error);

      if (error instanceof UnauthorizedException) {
        throw new RpcException({
          error: 'Token không hợp lệ',
          status: 401,
        });
      }

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async validSignUpPayload(
    signUpDto: SignUpDto,
  ): Promise<{ isValid: boolean; error: string }> {
    const isUserExisted = await this.prisma.user.findUnique({
      where: { email: signUpDto.email },
    });

    if (isUserExisted) {
      return { isValid: false, error: 'Email đã được đăng ký' };
    }

    if (signUpDto.password !== signUpDto.confirmPassword) {
      return { isValid: false, error: 'Mật khẩu không khớp' };
    }

    return { isValid: true, error: '' };
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      // hash password
      const hashPassword = await argon2.hash(signUpDto.password);

      // create user
      const newUser = await this.prisma.user.create({
        data: {
          email: signUpDto.email,
          password: hashPassword,
          name: signUpDto.name,
          role: signUpDto.role,
          age: signUpDto.age,
        },
      });

      return { uuid: newUser.uuid, email: newUser.email, name: newUser.name };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            error: 'Email đã được đăng ký',
            status: 400,
          });
        }
      } else throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async signIn(signInDto: SignInDto) {
    // checking if user exists
    const userExisted = await this.prisma.user.findUnique({
      where: { email: signInDto.email },
    });

    if (!userExisted) {
      throw new RpcException({ error: 'Email không tồn tại', status: 404 });
    }

    // hash password
    const passwordChecking = await argon2.verify(
      userExisted.password,
      signInDto.password,
    );

    if (!passwordChecking) {
      throw new RpcException({
        error: 'Mật khẩu không chính xác',
        status: 400,
      });
    }

    delete userExisted.password;

    const payload = {
      uuid: userExisted.uuid,
      email: userExisted.email,
      role: userExisted.role,
    };

    const secret = this.config.get('JWT_SECRET_KEY');
    const secretRefesh = this.config.get('JWT_SECRET_KEY_REFRESH');
    const access_token = await this.signToken(payload, secret);
    const refresh_token = await this.signToken(payload, secretRefesh, '1d');

    await this.prisma.user.update({
      where: { uuid: userExisted.uuid },
      data: { refreshToken: refresh_token },
    });

    return { access_token, refresh_token };
  }

  async logout(uuid: string) {
    try {
      await this.prisma.user.update({
        where: { uuid },
        data: { refreshToken: null },
      });

      return { message: 'Đăng xuất thành công' };
    } catch (error) {
      console.error(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }
}
