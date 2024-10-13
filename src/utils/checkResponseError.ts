import { HttpException } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import { LoggerUtil } from './Logger';

export default async function checkResponseError(
  response: {
    status: string;
    message: {
      error: string;
      status: number;
    };
  },
  loggerInfo: { context: string },
) {
  if (response.status === 'error') {
    LoggerUtil.error(response.message.error, loggerInfo.context);

    throw new HttpException(response.message.error, response.message.status);
  }
}
