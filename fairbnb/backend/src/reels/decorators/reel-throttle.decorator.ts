import { SetMetadata } from '@nestjs/common';

export const REEL_THROTTLE_KEY = 'REEL_THROTTLE';

export interface ReelThrottleOptions {
  limit: number;
  ttlSeconds?: number;
  keyPrefix?: string;
}

export const ReelThrottle = (limit: number, ttlSeconds = 60, keyPrefix?: string) =>
  SetMetadata(REEL_THROTTLE_KEY, { limit, ttlSeconds, keyPrefix });
