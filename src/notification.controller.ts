import {
  Controller,
  Delete,
  Get,
  Patch,
  Req,
  Param,
  Body,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern } from '@nestjs/microservices';
import { NewNotifi } from './type/generate';

@Controller()
export class NotificationController {
  constructor(private service: NotificationService) {}

  @MessagePattern({ cmd: 'create' })
  async createNotification(
    @Body()
    data: NewNotifi,
  ) {
    return await this.service.createNotification(data);
  }

  @MessagePattern({ cmd: 'get-all' })
  async getNotification(@Body() data: { userUuid: string }) {
    return await this.service.getNotification(data.userUuid);
  }

  @MessagePattern({ cmd: 'readed' })
  async readNotification(
    @Body() data: { userUuid: string; notifyUuid: string },
  ) {
    return await this.service.readNotification(data.userUuid, data.notifyUuid);
  }

  @MessagePattern({ cmd: 'delete' })
  async deleteNotification(
    @Body() data: { userUuid: string; notifyUuid: string },
  ) {
    return await this.service.deleteNotification(
      data.userUuid,
      data.notifyUuid,
    );
  }

  @MessagePattern({ cmd: 'clear' })
  async deleteAllNotification(@Body() data: { userUuid: string }) {
    return await this.service.deleteAllNotification(data.userUuid);
  }
}
