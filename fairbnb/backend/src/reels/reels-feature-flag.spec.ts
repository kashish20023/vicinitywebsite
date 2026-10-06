import { Test, TestingModule } from '@nestjs/testing';
import { ReelsFeatureGuard } from './guards/reels-feature.guard';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('Phase 2 — Reels Feature Flag (REELS_FEATURE_ENABLED)', () => {
  let guard: ReelsFeatureGuard;
  let adminSettingsService: jest.Mocked<AdminSettingsService>;

  beforeEach(async () => {
    const mockAdminSettingsService = {
      isReelsEnabled: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReelsFeatureGuard,
        {
          provide: AdminSettingsService,
          useValue: mockAdminSettingsService,
        },
      ],
    }).compile();

    guard = module.get<ReelsFeatureGuard>(ReelsFeatureGuard);
    adminSettingsService = module.get(AdminSettingsService);
  });

  it('should allow request execution when REELS_FEATURE_ENABLED is true', async () => {
    adminSettingsService.isReelsEnabled.mockResolvedValue(true);

    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/reels', method: 'GET' }),
      }),
    };

    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
  });

  it('should throw 503 Service Unavailable when REELS_FEATURE_ENABLED is false', async () => {
    adminSettingsService.isReelsEnabled.mockResolvedValue(false);

    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/reels', method: 'GET' }),
      }),
    };

    await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);

    try {
      await guard.canActivate(mockContext);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(err.getResponse()).toEqual({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Reels feature is currently disabled.',
        error: 'Service Unavailable',
      });
    }
  });

  it('should default to enabled if setting is missing', async () => {
    adminSettingsService.isReelsEnabled.mockResolvedValue(true);

    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/reels/upload-signature', method: 'POST' }),
      }),
    };

    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
  });
});
