import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MyLogger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: MyLogger) {
    this.logger.setContext('REQUEST');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();

    const method = request.method;
    const url = request.originalUrl;
    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        this.logger.log(`[${method}] ${url} - ${delay}ms`);
      }),
      catchError(error => {
        const delay = Date.now() - now;
        this.logger.error(
          `[${method}] ${url} | err: ${error.toString()} - ${delay}ms`,
        );
        return throwError(error);
      }),
    );
  }
}
