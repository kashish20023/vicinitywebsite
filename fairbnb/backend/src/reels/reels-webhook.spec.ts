import { Test, TestingModule } from '@nestjs/testing';
import { ReelsService } from './reels.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('Phase 3 — Cloudinary Processing & Webhook Security Suite', () => {
  let reelsService: ReelsService;
  let cloudinaryService: CloudinaryService;
  let prisma: PrismaClientMock;

  const timestamp = Math.floor(Date.now() / 1000);
  const mockDraftReel = {
    id: 'reel_draft_100',
    creatorId: 'user_host_1',
    status: 'DRAFT',
    videoUrl: null,
    hlsUrl: null,
    posterUrl: null,
    cloudinaryPublicId: null,
    publishedAt: null,
    duration: null,
    width: null,
    height: null,
    format: null,
  };

  const mockPublishedReel = {
    id: 'reel_published_200',
    creatorId: 'user_host_1',
    status: 'PUBLISHED',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/reel_published_200.mp4',
    hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_published_200.m3u8',
    posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_published_200.jpg',
    cloudinaryPublicId: 'fairbnb/reels/reel_published_200',
    publishedAt: new Date(),
  };

  const mockRejectedReel = {
    id: 'reel_rejected_300',
    creatorId: 'user_host_1',
    status: 'REJECTED',
  };

  class PrismaClientMock {
    reel = {
      findFirst: jest.fn(async ({ where }: any) => {
        const orConditions = where.OR || [];
        for (const cond of orConditions) {
          if (cond.id === mockDraftReel.id || cond.cloudinaryPublicId === mockDraftReel.id || cond.id === `fairbnb/reels/${mockDraftReel.id}`) {
            return { ...mockDraftReel };
          }
          if (cond.id === mockPublishedReel.id || cond.cloudinaryPublicId === mockPublishedReel.cloudinaryPublicId) {
            return { ...mockPublishedReel };
          }
          if (cond.id === mockRejectedReel.id) {
            return { ...mockRejectedReel };
          }
        }
        return null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        return {
          id: where.id,
          ...data,
          updatedAt: new Date(),
        };
      }),
    };
  }

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    prisma = new PrismaClientMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReelsService,
        CloudinaryService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'CLOUDINARY_CLOUD_NAME') return 'fairbnb_test_cloud';
              if (key === 'CLOUDINARY_API_KEY') return 'test_api_key_123';
              if (key === 'CLOUDINARY_API_SECRET') return 'SUPER_SECRET_KEY_456';
              if (key === 'CLOUDINARY_FOLDER') return 'fairbnb/reels';
              return null;
            },
          },
        },
      ],
    }).compile();

    reelsService = module.get<ReelsService>(ReelsService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('Attack 1 — Fake Webhook with Nonexistent Reel ID', () => {
    it('should return safe failure response and NOT publish any record', async () => {
      const payload = {
        public_id: 'fairbnb/reels/non_existent_reel_999',
        resource_type: 'video',
        duration: 12.0,
      };
      const rawBody = JSON.stringify(payload);
      const validSig = `valid_sig_${timestamp}`;

      const result = await reelsService.processCloudinaryWebhook(
        payload,
        rawBody,
        validSig,
        timestamp,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('No matching Reel record found');
      expect(prisma.reel.update).not.toHaveBeenCalled();
    });
  });

  describe('Attack 2 — Webhook Signature Forgery / Invalid Signature', () => {
    it('should reject webhook with invalid signature with 401 Unauthorized', async () => {
      const payload = { public_id: mockDraftReel.id };
      const rawBody = JSON.stringify(payload);
      const invalidSig = 'invalid_tampered_signature';

      await expect(
        reelsService.processCloudinaryWebhook(
          payload,
          rawBody,
          invalidSig,
          timestamp,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject webhook with missing signature header with 401 Unauthorized', async () => {
      const payload = { public_id: mockDraftReel.id };
      const rawBody = JSON.stringify(payload);

      await expect(
        reelsService.processCloudinaryWebhook(payload, rawBody, undefined, timestamp),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject test signature bypass when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      const payload = { public_id: mockDraftReel.id };
      const rawBody = JSON.stringify(payload);
      const testSig = `valid_sig_${timestamp}`;

      await expect(
        reelsService.processCloudinaryWebhook(payload, rawBody, testSig, timestamp),
      ).rejects.toThrow(UnauthorizedException);
      process.env.NODE_ENV = 'test';
    });
  });

  describe('Attack 3 — Valid Signature but Unmatched Public ID or Non-Video Resource', () => {
    it('should reject unknown public_id safely without database mutations', async () => {
      const payload = { public_id: 'unknown_public_asset' };
      const rawBody = JSON.stringify(payload);
      const validSig = `valid_sig_${timestamp}`;

      const result = await reelsService.processCloudinaryWebhook(
        payload,
        rawBody,
        validSig,
        timestamp,
      );

      expect(result.success).toBe(false);
      expect(prisma.reel.update).not.toHaveBeenCalled();
    });

    it('should reject non-video resource_type safely', async () => {
      const payload = {
        public_id: mockDraftReel.id,
        resource_type: 'image',
      };
      const rawBody = JSON.stringify(payload);
      const validSig = `valid_sig_${timestamp}`;

      const result = await reelsService.processCloudinaryWebhook(
        payload,
        rawBody,
        validSig,
        timestamp,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("expected 'video'");
      expect(prisma.reel.update).not.toHaveBeenCalled();
    });
  });

  describe('Attack 5 — Replay Attack & Duplicate Webhook Idempotency', () => {
    it('should handle repeated webhook deliveries for published reels idempotently', async () => {
      const payload = {
        public_id: mockPublishedReel.cloudinaryPublicId,
        resource_type: 'video',
        duration: 20.0,
      };
      const rawBody = JSON.stringify(payload);
      const validSig = `valid_sig_${timestamp}`;

      const result = await reelsService.processCloudinaryWebhook(
        payload,
        rawBody,
        validSig,
        timestamp,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('PUBLISHED');
      expect(result.message).toContain('Idempotent call');
      expect(prisma.reel.update).not.toHaveBeenCalled();
    });

    it('should reject webhooks with timestamps older than 300 seconds with 401 Unauthorized', async () => {
      const payload = {
        public_id: mockDraftReel.id,
        resource_type: 'video',
      };
      const rawBody = JSON.stringify(payload);
      const staleTimestamp = Math.floor(Date.now() / 1000) - 350; // 350s ago (> 300s window)
      const sig = `valid_sig_${staleTimestamp}`;

      await expect(
        reelsService.processCloudinaryWebhook(
          payload,
          rawBody,
          sig,
          staleTimestamp,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Attack 6 — Cloudinary Processing Failure Notification', () => {
    it('should transition Reel status to FAILED when Cloudinary reports upload_failed', async () => {
      const payload = {
        public_id: mockDraftReel.id,
        notification_type: 'upload_failed',
        error: { message: 'Video transcoding failed' },
      };
      const rawBody = JSON.stringify(payload);
      const validSig = `valid_sig_${timestamp}`;

      const result = await reelsService.processCloudinaryWebhook(
        payload,
        rawBody,
        validSig,
        timestamp,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('FAILED');
      expect(prisma.reel.update).toHaveBeenCalledWith({
        where: { id: mockDraftReel.id },
        data: { status: 'FAILED' },
      });
    });
  });

  describe('Lifecycle State Machine & Eager HLS Processing', () => {
    it('should transition DRAFT Reel to PROCESSING phase when raw video upload notification arrives', async () => {
      const payload = {
        public_id: mockDraftReel.id,
        resource_type: 'video',
        notification_type: 'upload',
        secure_url: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/v1/reel_draft_100.mp4',
        duration: 18.5,
      };
      const rawBody = JSON.stringify(payload);
      const validSig = `valid_sig_${timestamp}`;

      const result = await reelsService.processCloudinaryWebhook(
        payload,
        rawBody,
        validSig,
        timestamp,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('PROCESSING');
      expect(result.reelId).toBe(mockDraftReel.id);

      expect(prisma.reel.update).toHaveBeenCalledWith({
        where: { id: mockDraftReel.id },
        data: expect.objectContaining({
          status: 'PROCESSING',
          cloudinaryPublicId: mockDraftReel.id,
          videoUrl: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/v1/reel_draft_100.mp4',
        }),
      });
    });

    it('should transition PROCESSING Reel to PUBLISHED when eager HLS processing completes', async () => {
      const payload = {
        public_id: mockDraftReel.id,
        resource_type: 'video',
        notification_type: 'eager',
        duration: 18.5,
        width: 1080,
        height: 1920,
        format: 'mp4',
        secure_url: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/v1/reel_draft_100.mp4',
        eager: [
          {
            format: 'm3u8',
            secure_url: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/sp_hd/v1/reel_draft_100.m3u8',
          },
        ],
      };
      const rawBody = JSON.stringify(payload);
      const validSig = `valid_sig_${timestamp}`;

      const result = await reelsService.processCloudinaryWebhook(
        payload,
        rawBody,
        validSig,
        timestamp,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('PUBLISHED');
      expect(result.reelId).toBe(mockDraftReel.id);

      expect(prisma.reel.update).toHaveBeenCalledWith({
        where: { id: mockDraftReel.id },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          videoUrl: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/v1/reel_draft_100.mp4',
          hlsUrl: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/sp_hd/v1/reel_draft_100.m3u8',
          posterUrl: expect.stringContaining('reel_draft_100.jpg'),
          duration: 18.5,
          width: 1080,
          height: 1920,
          format: 'mp4',
        }),
      });
    });

    it('should fall back to direct videoUrl and keep hlsUrl null when eager processing produces no m3u8 variant', async () => {
      const payload = {
        public_id: mockDraftReel.id,
        resource_type: 'video',
        notification_type: 'eager',
        duration: 15.0,
        width: 720,
        height: 1280,
        format: 'mp4',
        secure_url: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/v1/reel_draft_100.mp4',
        eager: [
          {
            format: 'mp4',
            secure_url: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/w_720/v1/reel_draft_100.mp4',
          },
        ],
      };
      const rawBody = JSON.stringify(payload);
      const validSig = `valid_sig_${timestamp}`;

      const result = await reelsService.processCloudinaryWebhook(
        payload,
        rawBody,
        validSig,
        timestamp,
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('PUBLISHED');
      expect(result.message).toContain('direct video fallback');

      expect(prisma.reel.update).toHaveBeenCalledWith({
        where: { id: mockDraftReel.id },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          videoUrl: 'https://res.cloudinary.com/fairbnb_test_cloud/video/upload/v1/reel_draft_100.mp4',
          hlsUrl: null, // Strictly null, never a synthetic 404 URL
        }),
      });
    });
  });
});
