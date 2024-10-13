import { Inject, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as moment from 'moment';
import { PrismaService } from './utils/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NewNotifi } from './type/generate';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class NotificationService {
  private prisma: PrismaService;
  //   private socket: SocketGateway;

  constructor(
    @Inject('API_GATEWAY') private readonly apiGatewayClient: ClientProxy,
  ) {
    this.prisma = new PrismaService();
  }

  async createNotification(
    data: NewNotifi,
    // userUuid: string,
    // socketTo: string,
    // to: string,
    // from: string,
    // type: string,
    // createTime: { time: string; date: string },
    // messageType?: string,
  ) {
    try {
      let message = '';
      let title = '';
      const { userUuid, socketTo, to, from, type, createTime, messageType } =
        data;

      if (type.includes('post')) {
        if (messageType === 'Exercise') {
          title = 'Bài tập mới';
          message = 'Có bài tập mới từ ' + from;
        } else if (messageType === 'Vote') {
          title = 'Bình chọn mới';
          message = 'Có bình chọn mới từ ' + from;
        } else if (messageType === 'Announcement') {
          title = 'Thông báo mới';
          message = 'Có bài thông báo mới từ ' + from;
        }
      } else if (type.includes('comment')) {
        title = 'Bình luận mới';
        message = 'Có bình luận mới từ ' + from;
      } else if (type.includes('chat')) {
        title = 'Tin nhắn mới';
        message = 'Có tin nhắn mới từ ' + from;
      } else if (type.includes('mark')) {
        title = 'Đã có điểm';
        message = 'Đã có điểm từ ' + from;
      } else if (type.includes('assignment')) {
        title = 'Nộp bài tập';
        message = from + ' đã nộp bài tập';
      }

      const newNotification = await this.prisma.notification.create({
        data: {
          userUuid,
          title,
          message,
          createdInTime: createTime.time,
          link: to,
          createdInDate: createTime.date,
        },
      });

      //   this.socket.server.emit(`${socketTo}/notification`, () => {
      //     return 'New notification';
      //   });

      this.apiGatewayClient.send('forwarding', {
        to: `${socketTo}/notification`,
        payload: { message: 'New notification' },
      });

      return newNotification;
    } catch (error) {
      console.log(error);
    }
  }

  async getNotification(userUuid: string) {
    try {
      const newNotification = await this.prisma.notification.findMany({
        where: {
          userUuid,
        },
      });

      return newNotification
        .sort((a, b) => {
          if (moment(a.createdAt).isBefore(b.createdAt)) {
            return -1;
          } else return 1;
        })
        .map((notification) => ({
          ...notification,
          createdInDate: undefined,
          createdInTime: undefined,
          sendIn: {
            time: notification.createdInTime,
            date: notification.createdInDate,
          },
        }));
    } catch (error) {
      console.log(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async readNotification(userUuid: string, notifyUuid: string) {
    try {
      const notification = await this.prisma.notification.update({
        where: {
          uuid: notifyUuid,
          userUuid,
        },
        data: {
          isRead: true,
        },
      });

      return notification;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            error: 'Không tìm thấy thông báo',
            status: 404,
          });
        }
      }
      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async deleteNotification(userUuid: string, notifyUuid: string) {
    try {
      await this.prisma.notification.delete({
        where: {
          uuid: notifyUuid,
          userUuid,
        },
      });

      return { message: 'Xóa thông báo thành công' };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            error: 'Không tìm thấy thông báo',
            status: 404,
          });
        }
      }
      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async deleteAllNotification(userUuid: string) {
    try {
      await this.prisma.notification.deleteMany({
        where: {
          userUuid,
        },
      });

      return { message: 'Xóa tất cả thông báo thành công' };
    } catch (error) {
      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }
}
