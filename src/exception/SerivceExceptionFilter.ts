import {
  ArgumentsHost,
  Catch,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, of, throwError } from 'rxjs';

@Catch(RpcException)
export class ServiceExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    Logger.error(
      JSON.stringify(exception.getError()),
      'ServiceExceptionFilter',
    );

    return of({
      status: 'error',
      message: exception.getError(),
    });
  }
}
