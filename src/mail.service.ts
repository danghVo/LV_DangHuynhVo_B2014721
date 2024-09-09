import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OTPUtil } from './util/OtpUtil';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MailService {
    constructor(
        private mailer: MailerService,
        private config: ConfigService,
        @Inject("REDIS_SERVICE") private redisClient: ClientProxy,
    ) { }
    
    private async generateOTP(email: string) {
        let newOTP = OTPUtil.generateOTP();

        const currentOTP = this.redisClient.send('get-key', email + "-otp");
        if (currentOTP) {
            let isSame: boolean;

            currentOTP.subscribe(otp => {
                isSame = otp === newOTP;
            })

            while (isSame) {
                newOTP = OTPUtil.generateOTP();

                currentOTP.subscribe(otp => {
                    isSame = otp === newOTP;
                })
            }
        } else {
            this.redisClient.send('set-key', { key: email + "-otp", value: newOTP });
        }
        // const isTokenValid = 

        return newOTP;
    }

    async mailConfirm(email: string) {
        const token = await this.generateOTP(email);
        console.log(token);

        const body = {
            from: 'huynhvo47@gmail.com',
            to: email,
            text: 'CLUSTERING HELPER SYSTEM ONE TIME PASSWORD',
            html: `<br>This is your one time password: <b>${token}</b>`,
        };

        await this.sendMail(body);
    }

    private async sendMail(body: any) {
        await this.mailer.sendMail(body);
    }
}
