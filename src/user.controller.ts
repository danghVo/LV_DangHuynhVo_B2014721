import { Body, Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { ProfileDto, PasswordChagneDto } from './dto';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UserController {
  constructor(private user: UserService) {}

  @MessagePattern({ cmd: 'check-user' })
  async checkUserExist(@Body('userUuid') userUuid: string) {
    const isExist = await this.user.checkUserExist(userUuid);

    return isExist;
  }

  @MessagePattern({ cmd: 'user-profile' })
  async profile(@Body('userUuid') userUuid: string) {
    const profile = await this.user.profile(userUuid);

    delete profile.password;

    return profile;
  }

  @MessagePattern({ cmd: 'user-get-uuid' })
  async getUuid(@Body('email') email: string) {
    const uuid = await this.user.getUuid(email);

    return uuid;
  }

  @MessagePattern({ cmd: 'user-change-password' })
  async changePassword(
    @Body() body: { userUuid: string; passwordChagneDto: PasswordChagneDto },
  ) {
    const updatedUser = await this.user.changePassword(body);

    return updatedUser;
  }

  @MessagePattern({ cmd: 'user-update-profile' })
  async updateProfile(
    @Body()
    body: {
      profileDto: ProfileDto;
      userUuid: string;
      avatar: Express.Multer.File;
    },
  ) {
    const profile = await this.user.updateProfile(body);

    return profile;
  }
}
