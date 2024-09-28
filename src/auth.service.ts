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
import { randomBytes } from 'crypto';
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

      const verifyToken = randomBytes(64).toString('hex');

      // create user
      const newUser = await this.prisma.user.create({
        data: {
          email: signUpDto.email,
          password: hashPassword,
          name: signUpDto.name,
          role: signUpDto.role,
          age: signUpDto.age,
          verifyToken,
        },
      });

      this.deleteUnverifyUser(newUser.uuid);

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

  async deleteUnverifyUser(uuid: string) {
    return new Promise((resolve, reject) => {
      console.time();
      setTimeout(
        async () => {
          console.timeEnd();
          console.log('delete user');
          const user = await this.prisma.user.findFirst({
            where: { isVerify: false, uuid },
          });

          if (!user?.isVerify) {
            await this.prisma.user.delete({
              where: { uuid },
            });
          }
        },
        5 * 60 * 1000,
      );
    });
  }

  async signIn(signInDto: SignInDto) {
    // checking if user exists
    const userExisted = await this.prisma.user.findUnique({
      where: { email: signInDto.email },
    });

    if (!userExisted) {
      throw new RpcException({ error: 'Email không tồn tại', status: 404 });
    }

    if (!userExisted.isVerify) {
      throw new RpcException({
        error: 'Email chưa được xác nhận',
        status: 403,
      });
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

    return { access_token, refresh_token };
  }

  async verifyMail(userUuid: string, token: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { uuid: userUuid },
        select: { verifyToken: true },
      });

      if (user.verifyToken !== token) {
        throw new RpcException({ error: 'Token không hợp lệ', status: 400 });
      }

      await this.prisma.user.update({
        where: { uuid: userUuid },
        data: { isVerify: true, verifyToken: null },
      });

      // this.socket.server.emit('verify', { status: 'success', message: 'Xác nhận thành công' });

      return true;
    } catch (error) {
      console.error(error);

      return false;
    }
  }

  async resendVerifyMail(uuid: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { uuid },
        select: { email: true },
      });

      const verifyToken = randomBytes(64).toString('hex');
      await this.prisma.user.update({
        where: { uuid },
        data: { verifyToken },
      });

      // await this.mailService.mailConfirm(user.email, uuid, verifyToken);
      return { message: 'Đã gửi lại mail xác nhận' };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ error: 'Email không tồn tại', status: 404 });
        }
      } else throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }
}
