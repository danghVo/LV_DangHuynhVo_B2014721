import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { LoggerUtil } from 'src/utils/Logger';
import { PasswordChagneDto, ProfileDto } from 'src/dto/user';
import checkResponseError from 'src/utils/checkResponseError';
import { lastValueFrom } from 'rxjs';

@Controller('user')
export class UserController {
  constructor(@Inject('USER_SERVICE') private userService: ClientProxy) {}

  @Get('profile')
  async profile(@Req() req: Request & { user: { uuid: string } }) {
    LoggerUtil.log(
      `${req.user.uuid} is getting profile`,
      'UserGateway:Profile',
    );

    const response = await lastValueFrom(
      this.userService.send(
        { cmd: 'user-profile' },
        { userUuid: req.user.uuid },
      ),
    );

    await checkResponseError(response, { context: 'UserGateway:Profile' });

    return { data: response };
  }

  @Get('uuid')
  async getUuid(@Query() query: { email: string }) {
    LoggerUtil.log(`Getting uuid of ${query.email}`, 'UserGateway:GetUuid');

    const response = await lastValueFrom(
      this.userService.send({ cmd: 'user-get-uuid' }, { email: query.email }),
    );

    await checkResponseError(response, { context: 'UserGateway:GetUuid' });

    return { data: response };
  }

  @Put('changePassword')
  async changePassword(
    @Body() passwordChagneDto: PasswordChagneDto,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} is changing password`,
      'UserGateway:ChangePassword',
    );

    const response = await lastValueFrom(
      this.userService.send(
        { cmd: 'user-change-password' },
        { userUuid: req.user.uuid, passwordChagneDto },
      ),
    );

    await checkResponseError(response, {
      context: 'UserGateway:ChangePassword',
    });

    return { data: response };
  }

  @UseInterceptors(FileInterceptor('file'))
  @Patch('updateProfile')
  async updateProfile(
    @Body() profileDto: ProfileDto,
    @Req() req: Request & { user: { uuid: string } },
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    LoggerUtil.log(
      `${req.user.uuid} is updating profile`,
      'UserGateway:UpdateProfile',
    );

    const response = await lastValueFrom(
      this.userService.send(
        { cmd: 'user-update-profile' },
        { profileDto, userUuid: req.user.uuid, avatar },
      ),
    );

    await checkResponseError(response, {
      context: 'UserGateway:UpdateProfile',
    });

    return { data: response };
  }
}
