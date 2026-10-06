import { Test, TestingModule } from '@nestjs/testing';
import { ReelsService } from './reels.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('Phase 5 — Reels Public Feed API & Cursor Pagination Suite', () => {
  let reelsService: ReelsService;
  let prisma: PrismaClientMock;

  const mockPublishedReels = [
    {
      id: 'reel_pub_1',
      status: 'PUBLISHED',
      hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_pub_1.m3u8',
      posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_pub_1.jpg',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/reel_pub_1.mp4',
      caption: 'Sunset Beach Villa Tour',
      publishedAt: new Date('2026-09-19T20:00:00Z'),
      creator: {
        id: 'creator_1',
        name: 'Sarah Jenkins',
        avatarUrl: 'https://example.com/avatar1.jpg',
      },
      taggedListings: [
        {
          property: {
            id: 'prop_1',
            title: 'Sunset Beach Villa',
            city: 'Malibu',
            basePrice: 450,
            images: ['https://example.com/prop1.jpg'],
          },
        },
      ],
    },
    {
      id: 'reel_pub_2',
      status: 'PUBLISHED',
      hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_pub_2.m3u8',
      posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_pub_2.jpg',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/reel_pub_2.mp4',
      caption: 'Mountain Cabin Haven',
      publishedAt: new Date('2026-09-19T18:00:00Z'),
      creator: {
        id: 'creator_2',
        name: 'Mark Miller',
        avatarUrl: null,
      },
      taggedListings: [],
    },
  ];

  class PrismaClientMock {
    reel = {
      findMany: jest.fn(async (params: any) => {
        // Enforce published status check
        if (params.where?.status !== 'PUBLISHED') {
          return [];
        }

        let results = [...mockPublishedReels];
        if (params.cursor?.id) {
          const idx = results.findIndex((r) => r.id === params.cursor.id);
          if (idx !== -1) {
            results = results.slice(idx + (params.skip || 0));
          }
        }

        const limit = params.take || 10;
        return results.slice(0, limit);
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
          useValue: {
            get: () => null,
          },
        },
      ],
    }).compile();

    reelsService = module.get<ReelsService>(ReelsService);
  });

  describe('Published-Only Filtering & Privacy Enforcer', () => {
    it('should strictly query where status === PUBLISHED', async () => {
      await reelsService.getReelsFeed({});

      expect(prisma.reel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PUBLISHED' },
        }),
      );
    });

    it('should exclude private credentials and internal user secrets from creator response', async () => {
      const response = await reelsService.getReelsFeed({});

      expect(response.items.length).toBe(2);
      const item = response.items[0];

      expect(item.creator).toEqual({
        id: 'creator_1',
        name: 'Sarah Jenkins',
        avatarUrl: 'https://example.com/avatar1.jpg',
      });
      expect((item.creator as any).password).toBeUndefined();
      expect((item.creator as any).email).toBeUndefined();
    });

    it('should format tagged property listing previews correctly', async () => {
      const response = await reelsService.getReelsFeed({});
      const itemWithProp = response.items[0];

      expect(itemWithProp.property).toEqual({
        id: 'prop_1',
        title: 'Sunset Beach Villa',
        city: 'Malibu',
        pricePerNight: 450,
        thumbnailUrl: 'https://example.com/prop1.jpg',
      });
    });

    it('should filter by creatorId correctly when query.creatorId is provided', async () => {
      await reelsService.getReelsFeed({ creatorId: 'creator_1' });

      expect(prisma.reel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PUBLISHED', creatorId: 'creator_1' },
        }),
      );
    });
  });

  describe('Cursor Pagination & Deterministic Sorting', () => {
    it('should order Reels by rankingScore DESC, publishedAt DESC, id DESC', async () => {
      await reelsService.getReelsFeed({});

      expect(prisma.reel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ rankingScore: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }],
        }),
      );
    });

    it('should return nextCursor = null when no further pages exist', async () => {
      const response = await reelsService.getReelsFeed({ limit: 5 });

      expect(response.items.length).toBe(2);
      expect(response.nextCursor).toBeNull();
    });

    it('should calculate nextCursor when items exceed limit', async () => {
      const response = await reelsService.getReelsFeed({ limit: 1 });

      expect(response.items.length).toBe(1);
      expect(response.nextCursor).toBe('reel_pub_2');
    });

    it('should clamp arbitrary huge limit requests to maximum allowed limit (20)', async () => {
      await reelsService.getReelsFeed({ limit: 500 });

      expect(prisma.reel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 21, // 20 + 1 for nextCursor evaluation
        }),
      );
    });
  });
});
