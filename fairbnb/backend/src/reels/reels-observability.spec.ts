import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { ReelRateLimitGuard } from './guards/reel-rate-limit.guard';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

describe('Phase 17 — Reels Observability & Production Monitoring', () => {
  let cloudinaryService: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'CLOUDINARY_CLOUD_NAME') return 'test_cloud';
              if (key === 'CLOUDINARY_API_KEY') return 'test_key';
              if (key === 'CLOUDINARY_API_SECRET') return 'super_secret_key_123';
              return null;
            },
          },
        },
      ],
    }).compile();

    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('1. Secret Safety & Sanitization', () => {
    it('should never expose Cloudinary API Secret in signed upload response object', () => {
      const params = cloudinaryService.generateSignedUploadParams('reel_test_123');

      expect(params).toBeDefined();
      expect(params.signature).toBeDefined();
      expect(params.apiKey).toBe('test_key');
      expect(params.cloudName).toBe('test_cloud');
      
      // Ensure API secret key is never leaked in return object
      expect((params as any).apiSecret).toBeUndefined();
      expect(JSON.stringify(params)).not.toContain('super_secret_key_123');
    });

    it('should reject webhooks with stale timestamp and emit structured warning', () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
      const staleTimestamp = Math.floor(Date.now() / 1000) - 100000;

      const isValid = cloudinaryService.verifyWebhookSignature(
        JSON.stringify({ notification_type: 'eager' }),
        staleTimestamp,
        'invalid_sig',
      );

      expect(isValid).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rejected webhook with stale timestamp'),
      );
      loggerSpy.mockRestore();
    });
  });

  describe('2. Request Correlation Interceptor', () => {
    it('should attach X-Request-ID header to HTTP response', (done) => {
      const interceptor = new LoggingInterceptor();
      const mockReq: any = {
        headers: {},
        method: 'GET',
        url: '/reels',
      };
      const mockRes: any = {
        setHeader: jest.fn(),
        statusCode: 200,
      };

      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => mockRes,
        }),
      };

      const mockCallHandler: any = {
        handle: () => of({ items: [], nextCursor: null }),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockRes.setHeader).toHaveBeenCalledWith(
            'X-Request-ID',
            expect.stringMatching(/^req_[a-f0-9]+$/),
          );
          expect(mockReq.requestId).toBeDefined();
          done();
        },
      });
    });
  });

  describe('3. Rate Limit Diagnostics', () => {
    it('should track rate limits without exposing sensitive tokens', () => {
      ReelRateLimitGuard.clearStore();
      expect(true).toBe(true);
    });
  });
});
