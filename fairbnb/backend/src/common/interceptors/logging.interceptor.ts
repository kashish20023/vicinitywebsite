import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Generate or extract request correlation ID
    const requestId =
      req.headers['x-request-id'] ||
      req.headers['x-correlation-id'] ||
      `req_${crypto.randomBytes(6).toString('hex')}`;

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    const startTime = Date.now();
    const { method, url } = req;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Structured HTTP log entry (only for /reels routes to keep logs clean)
        if (url.includes('/reels')) {
          let latencyBucket = '<50ms';
          if (durationMs >= 500) latencyBucket = '500ms+';
          else if (durationMs >= 250) latencyBucket = '250-500ms';
          else if (durationMs >= 100) latencyBucket = '100-250ms';
          else if (durationMs >= 50) latencyBucket = '50-100ms';

          this.logger.log(
            JSON.stringify({
              event: 'http.request.completed',
              requestId,
              method,
              url,
              statusCode,
              durationMs,
              latencyBucket,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      }),
    );
  }
}
