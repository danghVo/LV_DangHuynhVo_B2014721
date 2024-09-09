import { Controller, Logger } from "@nestjs/common";
import { MailService } from "./mail.service";
import { MessagePattern, Payload } from "@nestjs/microservices";

@Controller()
export class MailController {
    constructor(
        private mailService: MailService,
    ) {}
    
    @MessagePattern({ cmd: 'ping' })
    ping() {
        console.log("Pong");
        return "Pong";
    }

    @MessagePattern({ cmd: 'send-mail-confirm' })
    mailConfirm(@Payload() data: { email: string }) {
        try {
            this.mailService.mailConfirm(data.email);
        } catch (error) {
            Logger.error(error);
        }
    }
}