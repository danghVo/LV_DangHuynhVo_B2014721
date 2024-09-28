import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { OTPUtil } from './util/OtpUtil';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MailService {
  constructor(
    private mailer: MailerService,
    @Inject('REDIS_SERVICE') private redisClient: ClientProxy,
  ) {}

  private async generateOTP(email: string) {
    let newOTP = OTPUtil.generateOTP();

    const currentOTP = this.redisClient.send({ cmd: 'get' }, email + '-otp');
    if (currentOTP) {
      let isSame: boolean;

      currentOTP.subscribe((otp) => {
        isSame = otp === newOTP;
      });

      while (isSame) {
        newOTP = OTPUtil.generateOTP();

        currentOTP.subscribe((otp) => {
          isSame = otp === newOTP;
        });
      }
    } else {
      this.redisClient.send(
        { cmd: 'set' },
        { key: email + '-otp', value: newOTP },
      );
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
      subject: 'CLUSTERING HELPER SYSTEM ONE TIME PASSWORD',
      //   text: 'CLUSTERING HELPER SYSTEM ONE TIME PASSWORD',
      html: `<br>This is your one time password: <b>${token}</b>`,
    };

    await this.sendMail(body);
  }

  private async sendMail(body: any) {
    try {
      await this.mailer.sendMail(body);

      return true;
    } catch (error) {
      console.log(error);

      return false;
    }
  }
}
