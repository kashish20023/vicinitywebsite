import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requestHits = new Map<string, number[]>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler());
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'] || '127.0.0.1';
    const userId = request.user?.id || 'anonymous';
    const route = request.route?.path || request.url;
    const key = `${ip}:${userId}:${route}`;

    const now = Date.now();
    const windowStart = now - options.ttlSeconds * 1000;

    let hits = this.requestHits.get(key) || [];
    hits = hits.filter((timestamp) => timestamp > windowStart);

    if (hits.length >= options.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${options.limit} requests per ${options.ttlSeconds} seconds.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    hits.push(now);
    this.requestHits.set(key, hits);
    return true;
  }
}
