import { response } from 'express';
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Inject,
  Get,
  Req,
  Patch,
  Param,
  Delete,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import checkResponseError from 'src/utils/checkResponseError';
import { LoggerUtil } from 'src/utils/Logger';
import { lastValueFrom } from 'rxjs';

@Controller('notifications')
export class NotificationGatewayController {
  constructor(
    @Inject('NOTIFICATION_SERVICE') private notificationService: ClientProxy,
  ) {}

  @Get('/all')
  async getNotification(@Req() req: Request & { user: { uuid: string } }) {
    LoggerUtil.log('Get all notification', 'NotificationGateway:GetNoti');
    const response = await lastValueFrom(
      this.notificationService.send(
        { cmd: 'get-all' },
        { userUuid: req.user.uuid },
      ),
    );

    await checkResponseError(response, { context: 'NotifiGateway:GetNoti' });

    return response;
  }

  @Patch('/read/:notifyUuid')
  async readNotification(
    @Req() req: Request & { user: { uuid: string } },
    @Param('notifyUuid') notifyUuid: string,
  ) {
    LoggerUtil.log('Read notification', 'NotificationGateway:ReadNoti');

    const response = await lastValueFrom(
      this.notificationService.send(
        { cmd: 'readed' },
        { userUuid: req.user.uuid, notifyUuid },
      ),
    );

    await checkResponseError(response, { context: 'NotifiGateway:ReadNoti' });

    return response;
  }

  @Delete('/delete/:notifyUuid')
  async deleteNotification(
    @Req() req: Request & { user: { uuid: string } },
    @Param('notifyUuid') notifyUuid: string,
  ) {
    LoggerUtil.log('Delete notification', 'NotificationGateway:DeleteNoti');

    const response = await lastValueFrom(
      this.notificationService.send(
        { cmd: 'delete' },
        { userUuid: req.user.uuid, notifyUuid },
      ),
    );

    await checkResponseError(response, { context: 'NotifiGateway:DeleteNoti' });

    return response;
  }

  @Delete('/all')
  async deleteAllNotification(
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      'Delete all notification',
      'NotificationGateway:DeleteAllNoti',
    );
    const response = await lastValueFrom(
      this.notificationService.send(
        { cmd: 'clear' },
        { userUuid: req.user.uuid },
      ),
    );

    await checkResponseError(response, {
      context: 'NotifiGateway:DeleteAllNoti',
    });

    return response;
  }
}
