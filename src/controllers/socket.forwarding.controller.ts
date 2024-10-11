import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MessageBody } from '@nestjs/websockets';
import { SocketGateway } from 'src/socket/socket.gateway';
import { LoggerUtil } from 'src/utils/Logger';

@Controller()
export class SocketForwardingController {
  constructor(private readonly server: SocketGateway) {}

  @MessagePattern('forwarding')
  async handleForwarding(@MessageBody() data: { to: string; payload: string }) {
    try {
      const { to, payload } = data;
      LoggerUtil.log(`Forwarding to ${to}`, 'Socket Forwarding');
      this.server.server.emit(to, () => payload);
    } catch (error) {
      LoggerUtil.error(error, 'Socket Forwarding');
    }
  }
}
