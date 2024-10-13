import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ProfileDto, PasswordChagneDto } from './dto';

import * as argon2 from 'argon2';
import * as moment from 'moment';
import { PrismaService } from './utils/prisma.service';
import { AwsService } from './utils/aws.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UserService {
  private prisma: PrismaService;
  private aws: AwsService;

  constructor() {
    this.prisma = new PrismaService();
    this.aws = new AwsService();
  }

  async checkUserExist(userUuid: string) {
    try {
      await this.prisma.user.findUniqueOrThrow({
        where: { uuid: userUuid },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async profile(uuid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid },
    });

    if (user.avatar) {
      user.avatar = await this.aws.getImage(user.avatar);
    }

    delete user.password;
    delete user.refreshToken;
    delete user.updatedAt;

    return {
      ...user,
      createAt: moment(user.createAt).format('DD-MM-YYYY'),
    };
  }

  async getUuid(email: string) {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { email },
      });

      return user.uuid;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            error: 'Người dùng không tồn tại',
            status: 404,
          });
        }
      } else
        throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async updateProfile({
    userUuid,
    profileDto,
    avatar,
  }: {
    userUuid: string;
    profileDto: ProfileDto;
    avatar: Express.Multer.File;
  }) {
    try {
      let avatarKey = undefined;

      if (avatar) {
        avatarKey = await this.aws.uploadAvatar(userUuid, avatar);
      }

      const updatedProfile = await this.prisma.user.update({
        where: { uuid: userUuid },
        data: {
          name: profileDto.name,
          age: parseInt(profileDto.age),
          avatar: avatarKey,
        },
      });

      return updatedProfile;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new RpcException({
            error: 'Người dùng không tồn tại',
            status: 404,
          });
        }
      } else
        throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async changePassword({
    userUuid,
    passwordChagneDto,
  }: {
    userUuid: string;
    passwordChagneDto: PasswordChagneDto;
  }) {
    const updatedUser = await this.prisma.user.findUniqueOrThrow({
      where: { uuid: userUuid },
    });

    const verify = await argon2.verify(
      updatedUser.password,
      passwordChagneDto.oldPassword,
    );

    if (!verify) {
      throw new RpcException({ error: 'Mật khẩu cũ không đúng', status: 400 });
    }

    if (passwordChagneDto.newPassword !== passwordChagneDto.confirmPassword)
      throw new RpcException({ error: 'Mật khẩu không khớp', status: 400 });

    try {
      const hashNewpassword = await argon2.hash(passwordChagneDto.newPassword);

      await this.prisma.user.update({
        where: { uuid: userUuid },
        data: {
          password: hashNewpassword,
        },
      });

      return { message: 'Mật khẩu đã được thay đổi' };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            message: 'Người dùng không tồn tại',
            status: 404,
          });
        }
      } else
        throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }
}
