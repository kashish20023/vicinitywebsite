import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REEL_THROTTLE_KEY, ReelThrottleOptions } from '../decorators/reel-throttle.decorator.js';

interface RateLimitRecord {
  timestamps: number[];
}

@Injectable()
export class ReelRateLimitGuard implements CanActivate {
  private static store = new Map<string, RateLimitRecord>();

  constructor(private readonly reflector: Reflector) {}

  static clearStore(): void {
    ReelRateLimitGuard.store.clear();
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<ReelThrottleOptions>(
      REEL_THROTTLE_KEY,
      context.getHandler(),
    );

    // If no explicit @ReelThrottle options are configured, allow request
    if (!options) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userId = req?.user?.id || req?.user?.userId;
    const sessionId = req?.body?.sessionId;
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || 'anonymous';
    const identifier = userId || sessionId || ip;

    const routePrefix = options.keyPrefix || context.getHandler().name;
    const key = `reel_ratelimit:${routePrefix}:${identifier}`;

    const now = Date.now();
    const ttlMs = (options.ttlSeconds || 60) * 1000;
    const windowStart = now - ttlMs;

    let record = ReelRateLimitGuard.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      ReelRateLimitGuard.store.set(key, record);
    }

    // Filter timestamps within sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= options.limit) {
      const oldestInWindow = record.timestamps[0];
      const retryAfter = Math.max(1, Math.ceil((oldestInWindow + ttlMs - now) / 1000));

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.timestamps.push(now);
    return true;
  }
}
