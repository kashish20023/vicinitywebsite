import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ReelRateLimitGuard } from './guards/reel-rate-limit.guard.js';
import { REEL_THROTTLE_KEY } from './decorators/reel-throttle.decorator.js';

describe('ReelRateLimitGuard — Phase 12 Abuse Protection', () => {
  let guard: ReelRateLimitGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ReelRateLimitGuard(reflector);
    ReelRateLimitGuard.clearStore();
  });

  afterEach(() => {
    ReelRateLimitGuard.clearStore();
  });

  function createMockContext(
    routeHandler: Function,
    user?: { id: string },
    body?: any,
    headers?: any,
  ): ExecutionContext {
    const req = {
      user,
      body: body || {},
      headers: headers || {},
      socket: { remoteAddress: '127.0.0.1' },
    };

    return {
      getHandler: () => routeHandler,
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;
  }

  it('allows requests when no @ReelThrottle metadata is set', () => {
    const handler = () => {};
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    const ctx = createMockContext(handler, { id: 'user_1' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  describe('Upload Signature Protection (@ReelThrottle(10, 60, "upload-signature"))', () => {
    const handler = function uploadSignature() {};

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        limit: 10,
        ttlSeconds: 60,
        keyPrefix: 'upload-signature',
      });
    });

    it('allows 10 upload signature requests and rejects the 11th with 429', () => {
      const ctx = createMockContext(handler, { id: 'host_100' });

      for (let i = 0; i < 10; i++) {
        expect(guard.canActivate(ctx)).toBe(true);
      }

      expect(() => guard.canActivate(ctx)).toThrow(HttpException);

      try {
        guard.canActivate(ctx);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const response = err.getResponse();
        expect(response.statusCode).toBe(429);
        expect(response.message).toContain('Too many requests');
        expect(response.retryAfter).toBeGreaterThan(0);
      }
    });

    it('rate limits users independently', () => {
      const ctxUser1 = createMockContext(handler, { id: 'host_1' });
      const ctxUser2 = createMockContext(handler, { id: 'host_2' });

      for (let i = 0; i < 10; i++) {
        expect(guard.canActivate(ctxUser1)).toBe(true);
      }
      expect(() => guard.canActivate(ctxUser1)).toThrow(HttpException);

      // host_2 should still be allowed
      expect(guard.canActivate(ctxUser2)).toBe(true);
    });
  });

  describe('Comment Spam Protection (@ReelThrottle(10, 60, "add-comment"))', () => {
    const handler = function addComment() {};

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        limit: 10,
        ttlSeconds: 60,
        keyPrefix: 'add-comment',
      });
    });

    it('allows 10 comments within window and blocks 11th comment', () => {
      const ctx = createMockContext(handler, { id: 'user_commenter' });

      for (let i = 0; i < 10; i++) {
        expect(guard.canActivate(ctx)).toBe(true);
      }

      expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    });
  });

  describe('Like Flooding Protection (@ReelThrottle(30, 60, "like-reel"))', () => {
    const handler = function likeReel() {};

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        limit: 30,
        ttlSeconds: 60,
        keyPrefix: 'like-reel',
      });
    });

    it('allows 30 rapid likes/unlikes and rate-limits the 31st', () => {
      const ctx = createMockContext(handler, { id: 'liker_1' });

      for (let i = 0; i < 30; i++) {
        expect(guard.canActivate(ctx)).toBe(true);
      }

      expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    });
  });

  describe('Analytics Event Protection (@ReelThrottle(60, 60, "record-event"))', () => {
    const handler = function recordEvent() {};

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        limit: 60,
        ttlSeconds: 60,
        keyPrefix: 'record-event',
      });
    });

    it('allows 60 playback progress events and throttles excessive 61st event', () => {
      const ctx = createMockContext(handler, undefined, { sessionId: 'sess_123' });

      for (let i = 0; i < 60; i++) {
        expect(guard.canActivate(ctx)).toBe(true);
      }

      expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    });
  });

  describe('Report Flooding Protection (@ReelThrottle(5, 60, "report-reel"))', () => {
    const handler = function reportReel() {};

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue({
        limit: 5,
        ttlSeconds: 60,
        keyPrefix: 'report-reel',
      });
    });

    it('allows 5 report submissions per minute and blocks the 6th', () => {
      const ctx = createMockContext(handler, { id: 'user_reporter' });

      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(ctx)).toBe(true);
      }

      expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    });
  });
});
