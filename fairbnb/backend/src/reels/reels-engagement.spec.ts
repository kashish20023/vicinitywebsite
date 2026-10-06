import { Test, TestingModule } from '@nestjs/testing';
import { ReelsService } from './reels.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('Phase 6 — Reels Engagement (Likes, Comments & Reports) Suite', () => {
  let reelsService: ReelsService;
  let prisma: PrismaClientMock;

  const mockUser = { id: 'user_1', name: 'John Doe', avatarUrl: 'https://example.com/avatar.jpg' };
  const mockOtherUser = { id: 'user_2', name: 'Jane Smith' };

  const mockPublishedReel = {
    id: 'reel_pub_100',
    status: 'PUBLISHED',
    likeCount: 5,
    commentCount: 2,
  };

  const mockDraftReel = {
    id: 'reel_draft_200',
    status: 'DRAFT',
  };

  class PrismaClientMock {
    reelLikesStore: Array<{ reelId: string; userId: string }> = [
      { reelId: 'reel_pub_100', userId: 'existing_user' },
    ];
    reelCommentsStore: Array<{ id: string; reelId: string; userId: string; content: string; createdAt: Date }> = [
      { id: 'comment_1', reelId: 'reel_pub_100', userId: 'user_1', content: 'Great property!', createdAt: new Date() },
      { id: 'comment_2', reelId: 'reel_pub_100', userId: 'user_2', content: 'Awesome view!', createdAt: new Date() },
    ];
    reelReportsStore: Array<{ id: string; reelId: string; reporterId: string; reason: string; status: string }> = [];

    reel = {
      findFirst: jest.fn(async ({ where }: any) => {
        if (where.id === mockPublishedReel.id && (where.status === 'PUBLISHED' || !where.status)) {
          return { ...mockPublishedReel };
        }
        if (where.id === mockDraftReel.id && where.status === 'PUBLISHED') {
          return null;
        }
        return null;
      }),
      update: jest.fn(async ({ where, data }: any) => ({
        id: where.id,
        ...data,
      })),
    };

    reelLike = {
      create: jest.fn(async ({ data }: any) => {
        const exists = this.reelLikesStore.some(
          (l) => l.reelId === data.reelId && l.userId === data.userId,
        );
        if (exists) {
          const err = new Error('Unique constraint failed') as any;
          err.code = 'P2002';
          throw err;
        }
        this.reelLikesStore.push(data);
        return data;
      }),
      deleteMany: jest.fn(async ({ where }: any) => {
        this.reelLikesStore = this.reelLikesStore.filter(
          (l) => !(l.reelId === where.reelId && l.userId === where.userId),
        );
        return { count: 1 };
      }),
      count: jest.fn(async ({ where }: any) => {
        return this.reelLikesStore.filter((l) => l.reelId === where.reelId).length;
      }),
    };

    reelComment = {
      create: jest.fn(async ({ data }: any) => {
        const newComment = {
          id: `comment_${Date.now()}`,
          reelId: data.reelId,
          userId: data.userId,
          content: data.content,
          createdAt: new Date(),
          user: { ...mockUser },
        };
        this.reelCommentsStore.push(newComment as any);
        return newComment;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return this.reelCommentsStore
          .filter((c) => c.reelId === where.reelId)
          .map((c) => ({ ...c, user: { ...mockUser } }));
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        const item = this.reelCommentsStore.find((c) => c.id === where.id);
        return item || null;
      }),
      delete: jest.fn(async ({ where }: any) => {
        this.reelCommentsStore = this.reelCommentsStore.filter((c) => c.id !== where.id);
        return { id: where.id };
      }),
      count: jest.fn(async ({ where }: any) => {
        return this.reelCommentsStore.filter((c) => c.reelId === where.reelId).length;
      }),
    };

    reelReport = {
      create: jest.fn(async ({ data }: any) => {
        const report = {
          id: `report_${Date.now()}`,
          ...data,
          status: 'PENDING',
          createdAt: new Date(),
        };
        this.reelReportsStore.push(report);
        return report;
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

  describe('Like / Unlike Functionality', () => {
    it('should like a published Reel and increment likeCount', async () => {
      const res = await reelsService.likeReel(mockUser.id, mockPublishedReel.id);

      expect(res.liked).toBe(true);
      expect(res.likeCount).toBe(2); // 1 existing + 1 new
      expect(prisma.reel.update).toHaveBeenCalledWith({
        where: { id: mockPublishedReel.id },
        data: { likeCount: 2 },
      });
    });

    it('should reject liking an unpublished/draft Reel with NotFoundException', async () => {
      await expect(
        reelsService.likeReel(mockUser.id, mockDraftReel.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle duplicate like requests idempotently without throwing', async () => {
      await reelsService.likeReel(mockUser.id, mockPublishedReel.id);
      const res = await reelsService.likeReel(mockUser.id, mockPublishedReel.id);

      expect(res.liked).toBe(true);
    });

    it('should unlike a Reel and decrement likeCount', async () => {
      await reelsService.likeReel(mockUser.id, mockPublishedReel.id);
      const res = await reelsService.unlikeReel(mockUser.id, mockPublishedReel.id);

      expect(res.liked).toBe(false);
      expect(res.likeCount).toBe(1);
    });
  });

  describe('Comments Functionality', () => {
    it('should add a valid comment to a published Reel', async () => {
      const res = await reelsService.addComment(
        mockUser.id,
        mockPublishedReel.id,
        '  Amazing location!  ',
      );

      expect(res.content).toBe('Amazing location!');
      expect(res.author.id).toBe(mockUser.id);
      expect(prisma.reel.update).toHaveBeenCalledWith({
        where: { id: mockPublishedReel.id },
        data: { commentCount: 3 },
      });
    });

    it('should reject empty or whitespace-only comment content with BadRequestException', async () => {
      await expect(
        reelsService.addComment(mockUser.id, mockPublishedReel.id, '   '),
      ).rejects.toThrow(BadRequestException);
    });

    it('should read comments for a published Reel', async () => {
      const res = await reelsService.getComments(mockPublishedReel.id);

      expect(res.items.length).toBe(2);
      expect(res.items[0].author).toBeDefined();
      expect((res.items[0].author as any).password).toBeUndefined();
    });

    it('should allow user to delete their own comment', async () => {
      const res = await reelsService.deleteComment(
        'user_1',
        mockPublishedReel.id,
        'comment_1',
      );

      expect(res.success).toBe(true);
      expect(prisma.reelComment.delete).toHaveBeenCalledWith({
        where: { id: 'comment_1' },
      });
    });

    it('should reject non-owner user attempting to delete another user comment with ForbiddenException', async () => {
      await expect(
        reelsService.deleteComment('user_2', mockPublishedReel.id, 'comment_1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Reel Reports Functionality', () => {
    it('should submit a valid report for a published Reel with PENDING status', async () => {
      const res = await reelsService.reportReel(
        mockUser.id,
        mockPublishedReel.id,
        'Inappropriate background music',
      );

      expect(res.success).toBe(true);
      expect(res.status).toBe('PENDING');
      expect(res.reportId).toBeDefined();
    });

    it('should reject empty report reason with BadRequestException', async () => {
      await expect(
        reelsService.reportReel(mockUser.id, mockPublishedReel.id, ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Share Tracking Functionality', () => {
    it('should validate share tracking for a published Reel', async () => {
      const res = await reelsService.trackShare(mockPublishedReel.id);

      expect(res.success).toBe(true);
      expect(res.reelId).toBe(mockPublishedReel.id);
    });

    it('should reject share tracking for an unpublished/draft Reel with NotFoundException', async () => {
      await expect(
        reelsService.trackShare(mockDraftReel.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

