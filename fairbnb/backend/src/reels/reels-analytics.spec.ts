import { Test, TestingModule } from '@nestjs/testing';
import { ReelsService } from './reels.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReelEventType } from './dto/create-reel-event.dto.js';

describe('Phase 9 — Reels Views & Analytics Suite', () => {
  let reelsService: ReelsService;
  let prisma: PrismaClientMock;

  const mockCreatorUser = { id: 'user_creator_1', name: 'Elena Rostova' };
  const mockOtherUser = { id: 'user_guest_2', name: 'John Guest' };

  const mockPublishedReel = {
    id: 'reel_pub_analytics_1',
    creatorId: mockCreatorUser.id,
    status: 'PUBLISHED',
    duration: 30.0,
    likeCount: 15,
    commentCount: 4,
    viewCount: 10,
  };

  const mockDraftReel = {
    id: 'reel_draft_analytics_2',
    creatorId: mockCreatorUser.id,
    status: 'DRAFT',
    duration: 15.0,
  };

  class PrismaClientMock {
    analyticsStore = new Map<string, any>();
    viewSessionsStore: Array<any> = [];

    reel = {
      findFirst: jest.fn(async ({ where }: any) => {
        if (where.id === mockPublishedReel.id) {
          if (where.status === 'PUBLISHED' || !where.status) {
            return { ...mockPublishedReel };
          }
        }
        if (where.id === mockDraftReel.id && where.status === 'PUBLISHED') {
          return null;
        }
        if (where.id === mockDraftReel.id) {
          return { ...mockDraftReel };
        }
        return null;
      }),
      update: jest.fn(async ({ where, data }: any) => ({
        id: where.id,
        ...data,
      })),
    };

    reelAnalytics = {
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const existing = this.analyticsStore.get(where.reelId);
        if (!existing) {
          const newItem = { id: `analytics_${where.reelId}`, ...create };
          this.analyticsStore.set(where.reelId, newItem);
          return newItem;
        } else {
          if (update.views?.increment) existing.views += update.views.increment;
          if (update.totalWatchDuration?.increment) existing.totalWatchDuration += update.totalWatchDuration.increment;
          if (update.completions25?.increment) existing.completions25 += update.completions25.increment;
          if (update.completions50?.increment) existing.completions50 += update.completions50.increment;
          if (update.completions75?.increment) existing.completions75 += update.completions75.increment;
          if (update.completions100?.increment) existing.completions100 += update.completions100.increment;
          this.analyticsStore.set(where.reelId, existing);
          return existing;
        }
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = this.analyticsStore.get(where.reelId) || { id: `analytics_${where.reelId}`, views: 0 };
        const updated = { ...existing, ...data };
        this.analyticsStore.set(where.reelId, updated);
        return updated;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return this.analyticsStore.get(where.reelId) || null;
      }),
    };

    reelViewSession = {
      findUnique: jest.fn(async ({ where }: any) => {
        const { reelId, sessionId } = where.reelId_sessionId || {};
        return this.viewSessionsStore.find((s) => s.reelId === reelId && s.sessionId === sessionId) || null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const item = { id: `session_${Date.now()}_${Math.random()}`, ...data };
        this.viewSessionsStore.push(item);
        return item;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = this.viewSessionsStore.findIndex((s) => s.id === where.id);
        if (idx !== -1) {
          this.viewSessionsStore[idx] = { ...this.viewSessionsStore[idx], ...data };
          return this.viewSessionsStore[idx];
        }
        return data;
      }),
      count: jest.fn(async ({ where }: any) => {
        return this.viewSessionsStore.filter((s) => {
          if (s.reelId !== where.reelId) return false;
          if (where.userId === null) return s.userId === null;
          return true;
        }).length;
      }),
      groupBy: jest.fn(async ({ where }: any) => {
        const filtered = this.viewSessionsStore.filter((s) => {
          if (s.reelId !== where.reelId) return false;
          if (where?.userId?.not === null) return s.userId !== null;
          return true;
        });
        const userIds = new Set(filtered.map((s) => s.userId).filter(Boolean));
        return Array.from(userIds).map((u) => ({ userId: u }));
      }),
    };
  }

  beforeEach(async () => {
    prisma = new PrismaClientMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReelsService,
        CloudinaryService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: () => null },
        },
      ],
    }).compile();

    reelsService = module.get<ReelsService>(ReelsService);
  });

  describe('Event Ingestion & Buffering', () => {
    it('should queue PLAY_STARTED event for a published Reel and return success', async () => {
      const res = await reelsService.recordEvent(mockPublishedReel.id, {
        eventType: ReelEventType.PLAY_STARTED,
        sessionId: 'sess_123',
        positionSeconds: 0,
        durationSeconds: 30,
      });

      expect(res.success).toBe(true);
      expect(res.queued).toBe(true);
    });

    it('should reject recording events for unpublished/draft Reels with NotFoundException', async () => {
      await expect(
        reelsService.recordEvent(mockDraftReel.id, {
          eventType: ReelEventType.PLAY_STARTED,
          sessionId: 'sess_456',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should safely do nothing when flushEventBuffer is called with empty buffer', async () => {
      await expect(reelsService.flushEventBuffer()).resolves.not.toThrow();
    });
  });

  describe('Batch Aggregation & Deduplication', () => {
    it('should flush buffered events and aggregate views, duration, and completion milestones', async () => {
      await reelsService.recordEvent(
        mockPublishedReel.id,
        {
          eventType: ReelEventType.PLAY_STARTED,
          sessionId: 'sess_user_1',
          positionSeconds: 0,
          durationSeconds: 30,
        },
        'user_a',
      );

      await reelsService.recordEvent(
        mockPublishedReel.id,
        {
          eventType: ReelEventType.PLAY_PROGRESS,
          sessionId: 'sess_user_1',
          positionSeconds: 15,
          durationSeconds: 30,
          progressPercent: 50,
        },
        'user_a',
      );

      await reelsService.recordEvent(
        mockPublishedReel.id,
        {
          eventType: ReelEventType.PLAY_COMPLETED,
          sessionId: 'sess_user_1',
          positionSeconds: 30,
          durationSeconds: 30,
          progressPercent: 100,
        },
        'user_a',
      );

      await reelsService.flushEventBuffer();

      const analytics = await reelsService.getReelAnalytics(
        mockPublishedReel.id,
        mockCreatorUser.id,
      );

      expect(analytics.views).toBe(1);
      expect(analytics.totalWatchDuration).toBe(30.0);
      expect(analytics.completions.c100).toBe(1);
      expect(analytics.completions.completionRate).toBe(100.0);
      expect(analytics.engagement.likeCount).toBe(15);
      expect(analytics.engagement.commentCount).toBe(4);
    });

    it('should count 3 sessions from the SAME authenticated user as views=3, uniqueViewers=1', async () => {
      // 3 separate playback sessions by User A
      await reelsService.recordEvent(
        mockPublishedReel.id,
        { eventType: ReelEventType.PLAY_STARTED, sessionId: 'sess_1', positionSeconds: 5 },
        'user_a',
      );
      await reelsService.recordEvent(
        mockPublishedReel.id,
        { eventType: ReelEventType.PLAY_STARTED, sessionId: 'sess_2', positionSeconds: 10 },
        'user_a',
      );
      await reelsService.recordEvent(
        mockPublishedReel.id,
        { eventType: ReelEventType.PLAY_STARTED, sessionId: 'sess_3', positionSeconds: 15 },
        'user_a',
      );

      await reelsService.flushEventBuffer();

      const analytics = await reelsService.getReelAnalytics(
        mockPublishedReel.id,
        mockCreatorUser.id,
      );

      expect(analytics.views).toBe(3);
      expect(analytics.uniqueViewers).toBe(1);
    });

    it('should count sessions from DIFFERENT authenticated users as uniqueViewers=2', async () => {
      await reelsService.recordEvent(
        mockPublishedReel.id,
        { eventType: ReelEventType.PLAY_STARTED, sessionId: 'sess_u1', positionSeconds: 5 },
        'user_a',
      );
      await reelsService.recordEvent(
        mockPublishedReel.id,
        { eventType: ReelEventType.PLAY_STARTED, sessionId: 'sess_u2', positionSeconds: 10 },
        'user_b',
      );

      await reelsService.flushEventBuffer();

      const analytics = await reelsService.getReelAnalytics(
        mockPublishedReel.id,
        mockCreatorUser.id,
      );

      expect(analytics.views).toBe(2);
      expect(analytics.uniqueViewers).toBe(2);
    });

    it('should deduplicate multiple PLAY_STARTED events within the same sessionId', async () => {
      await reelsService.recordEvent(mockPublishedReel.id, {
        eventType: ReelEventType.PLAY_STARTED,
        sessionId: 'sess_dedup',
        positionSeconds: 0,
      });

      await reelsService.recordEvent(mockPublishedReel.id, {
        eventType: ReelEventType.PLAY_STARTED,
        sessionId: 'sess_dedup',
        positionSeconds: 0,
      });

      await reelsService.flushEventBuffer();

      const analytics = await reelsService.getReelAnalytics(
        mockPublishedReel.id,
        mockCreatorUser.id,
      );

      expect(analytics.views).toBe(1);
    });
  });

  describe('Creator Analytics Authorization', () => {
    it('should allow Reel creator to view analytics', async () => {
      const res = await reelsService.getReelAnalytics(
        mockPublishedReel.id,
        mockCreatorUser.id,
      );

      expect(res.reelId).toBe(mockPublishedReel.id);
      expect(res.views).toBeDefined();
      expect(res.completions).toBeDefined();
      expect(res.engagement).toBeDefined();
    });

    it('should reject non-owner user attempting to view Reel analytics with ForbiddenException', async () => {
      await expect(
        reelsService.getReelAnalytics(mockPublishedReel.id, mockOtherUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

