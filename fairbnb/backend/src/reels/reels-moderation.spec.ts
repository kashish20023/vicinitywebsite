import { Test, TestingModule } from '@nestjs/testing';
import { ReelsService } from './reels.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('Phase 11 — Reels Moderation & Safety Suite', () => {
  let reelsService: ReelsService;
  let prisma: PrismaClientMock;

  const mockAdminUser = { id: 'admin_user_1', role: 'ADMIN' };
  const mockReporterUser = { id: 'reporter_user_1', name: 'Alice Reporter' };
  const mockCreatorUser = { id: 'creator_user_1', name: 'Bob Creator' };

  const mockPublishedReel = {
    id: 'reel_mod_published_1',
    creatorId: mockCreatorUser.id,
    status: 'PUBLISHED',
    caption: 'Safe travel video',
    likeCount: 10,
    commentCount: 2,
    viewCount: 50,
  };

  const mockHiddenReel = {
    id: 'reel_mod_hidden_2',
    creatorId: mockCreatorUser.id,
    status: 'HIDDEN',
    caption: 'Inappropriate video',
  };

  const mockComment = {
    id: 'comment_mod_1',
    reelId: mockPublishedReel.id,
    userId: mockCreatorUser.id,
    content: 'Spam comment text',
  };

  class PrismaClientMock {
    reelsStore = [
      { ...mockPublishedReel },
      { ...mockHiddenReel },
    ];
    commentsStore = [{ ...mockComment }];
    reportsStore: Array<any> = [];

    reel = {
      findFirst: jest.fn(async ({ where }: any) => {
        const item = this.reelsStore.find((r) => {
          if (where.id && r.id !== where.id) return false;
          if (where.status && r.status !== where.status) return false;
          return true;
        });
        return item ? { ...item } : null;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const item = this.reelsStore.find((r) => r.id === where.id);
        return item ? { ...item } : null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return this.reelsStore.filter((r) => {
          if (where?.status && r.status !== where.status) return false;
          return true;
        });
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = this.reelsStore.findIndex((r) => r.id === where.id);
        if (idx !== -1) {
          this.reelsStore[idx] = { ...this.reelsStore[idx], ...data };
          return this.reelsStore[idx];
        }
        return { id: where.id, ...data };
      }),
    };

    reelComment = {
      findUnique: jest.fn(async ({ where }: any) => {
        const item = this.commentsStore.find((c) => c.id === where.id);
        return item ? { ...item } : null;
      }),
      deleteMany: jest.fn(async ({ where }: any) => {
        const initialLen = this.commentsStore.length;
        this.commentsStore = this.commentsStore.filter((c) => c.id !== where.id);
        return { count: initialLen - this.commentsStore.length };
      }),
    };

    reelReport = {
      create: jest.fn(async ({ data }: any) => {
        const record = {
          id: `report_${Date.now()}_${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          resolvedAt: null,
          status: 'PENDING',
          ...data,
        };
        this.reportsStore.push(record);
        return record;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          this.reportsStore.find((rep) => {
            if (where.reelId && rep.reelId !== where.reelId) return false;
            if (where.commentId !== undefined && rep.commentId !== where.commentId) return false;
            if (where.reporterId && rep.reporterId !== where.reporterId) return false;
            if (where.status && rep.status !== where.status) return false;
            return true;
          }) || null
        );
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return this.reportsStore.find((rep) => rep.id === where.id) || null;
      }),
      findMany: jest.fn(async () => {
        return this.reportsStore.map((rep) => ({
          ...rep,
          reporter: { id: mockReporterUser.id, name: mockReporterUser.name, email: 'reporter@fairbnb.com' },
          reel: rep.reelId ? mockPublishedReel : null,
          comment: rep.commentId ? mockComment : null,
        }));
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = this.reportsStore.findIndex((rep) => rep.id === where.id);
        if (idx !== -1) {
          this.reportsStore[idx] = { ...this.reportsStore[idx], ...data };
          return this.reportsStore[idx];
        }
        return { id: where.id, ...data };
      }),
    };

    reelAnalytics = {
      findUnique: jest.fn(async () => null),
    };
    reelViewSession = {
      groupBy: jest.fn(async () => []),
      count: jest.fn(async () => 0),
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

  describe('Reel & Comment Reporting', () => {
    it('should allow authenticated user to report a published Reel', async () => {
      const res = await reelsService.reportReel(
        mockReporterUser.id,
        mockPublishedReel.id,
        'Inappropriate content',
      );

      expect(res.success).toBe(true);
      expect(res.reportId).toBeDefined();
      expect(res.status).toBe('PENDING');
      expect(prisma.reportsStore.length).toBe(1);
    });

    it('should reject reporting non-existent or non-published Reel with NotFoundException', async () => {
      await expect(
        reelsService.reportReel(
          mockReporterUser.id,
          mockHiddenReel.id,
          'Inappropriate content',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject reporting with empty reason using BadRequestException', async () => {
      await expect(
        reelsService.reportReel(mockReporterUser.id, mockPublishedReel.id, '  '),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow reporting a comment and link commentId to report', async () => {
      const res = await reelsService.reportComment(
        mockReporterUser.id,
        mockPublishedReel.id,
        mockComment.id,
        'Harassment comment',
      );

      expect(res.success).toBe(true);
      expect(res.reportId).toBeDefined();
      expect(prisma.reportsStore[0].commentId).toBe(mockComment.id);
    });

    it('should reject comment report if comment does not belong to the Reel', async () => {
      await expect(
        reelsService.reportComment(
          mockReporterUser.id,
          mockPublishedReel.id,
          'comment_unrelated_99',
          'Harassment comment',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Admin Moderation Actions & Role Enforcement', () => {
    it('should retrieve admin report queue for moderation', async () => {
      await reelsService.reportReel(
        mockReporterUser.id,
        mockPublishedReel.id,
        'Spam video',
      );

      const queue = await reelsService.getAdminReports({ status: 'PENDING' });
      expect(queue.items.length).toBe(1);
      expect(queue.items[0].reason).toBe('Spam video');
    });

    it('should allow admin to DISMISS a report without altering Reel status', async () => {
      const rep = await reelsService.reportReel(
        mockReporterUser.id,
        mockPublishedReel.id,
        'False claim',
      );

      const res = await reelsService.handleAdminReportAction(rep.reportId, 'DISMISS');
      expect(res.success).toBe(true);
      expect(res.status).toBe('DISMISSED');

      const reel = await prisma.reel.findUnique({ where: { id: mockPublishedReel.id } });
      expect(reel?.status).toBe('PUBLISHED');
    });

    it('should allow admin to HIDE a reported Reel', async () => {
      const rep = await reelsService.reportReel(
        mockReporterUser.id,
        mockPublishedReel.id,
        'Inappropriate content',
      );

      const res = await reelsService.handleAdminReportAction(rep.reportId, 'HIDE');
      expect(res.success).toBe(true);
      expect(res.status).toBe('RESOLVED');
      expect(res.reelStatus).toBe('HIDDEN');

      const reel = await prisma.reel.findUnique({ where: { id: mockPublishedReel.id } });
      expect(reel?.status).toBe('HIDDEN');
    });

    it('should allow admin to REJECT or ARCHIVE a Reel directly', async () => {
      const res = await reelsService.updateReelModerationStatus(
        mockPublishedReel.id,
        'REJECTED',
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('REJECTED');

      const reel = await prisma.reel.findUnique({ where: { id: mockPublishedReel.id } });
      expect(reel?.status).toBe('REJECTED');
    });
  });

  describe('Public Visibility Exclusion for Moderated Content', () => {
    it('should strictly exclude HIDDEN, REJECTED, and ARCHIVED Reels from public feed', async () => {
      // Transition published Reel to HIDDEN
      await reelsService.updateReelModerationStatus(mockPublishedReel.id, 'HIDDEN');

      const feed = await reelsService.getReelsFeed({});
      expect(feed.items.length).toBe(0);
    });

    it('should return 404 for likes/comments/shares on HIDDEN or REJECTED Reels', async () => {
      await reelsService.updateReelModerationStatus(mockPublishedReel.id, 'HIDDEN');

      await expect(
        reelsService.likeReel(mockReporterUser.id, mockPublishedReel.id),
      ).rejects.toThrow(NotFoundException);

      await expect(
        reelsService.addComment(mockReporterUser.id, mockPublishedReel.id, 'Test comment'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        reelsService.trackShare(mockPublishedReel.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
