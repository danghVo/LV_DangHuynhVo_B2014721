import { Controller, Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';

@Controller()
export class MailController {
  constructor(private mailService: MailService) {}

  @MessagePattern({ cmd: 'ping' })
  ping() {
    console.log('Received ping');
    return 'Pong';
  }

  @MessagePattern({ cmd: 'send-mail-confirm' })
  mailConfirm(@Payload() data: { email: string }) {
    console.log(data);
    try {
      this.mailService.mailConfirm(data.email);
    } catch (error) {
      Logger.error(error);

      throw new RpcException({ error, status: 500 });
    }
  }
}
