import { HttpException } from '@nestjs/common';
import { lastValueFrom, Observable } from 'rxjs';
import { LoggerUtil } from './Logger';

export default async function checkResponseError<T>(
  response: Observable<T>,
  loggerInfo: { context: string },
) {
  const responseRetrive = (await lastValueFrom(response)) as {
    status: string;
    message: {
      error: string;
      status: number;
    };
  };

  if (responseRetrive.status === 'error') {
    LoggerUtil.error(responseRetrive.message.error, loggerInfo.context);

    throw new HttpException(
      responseRetrive.message.error,
      responseRetrive.message.status,
    );
  }
}
