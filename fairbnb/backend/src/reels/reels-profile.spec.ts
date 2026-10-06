import { Test, TestingModule } from '@nestjs/testing';
import { ReelsController } from './reels.controller';
import { ReelsService } from './reels.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { ReelsFeatureGuard } from './guards/reels-feature.guard';
import { AdminSettingsService } from '../admin-settings/admin-settings.service';

describe('Phase 7 — Creator Profiles (Listings + Reels) Backend Suite', () => {
  let controller: ReelsController;
  let reelsService: ReelsService;

  const mockPrismaService = {
    reel: {
      findMany: jest.fn(),
    },
  };

  const mockCloudinaryService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReelsController],
      providers: [
        ReelsService,
        ReelsFeatureGuard,
        { provide: AdminSettingsService, useValue: { isReelsEnabled: jest.fn().mockResolvedValue(true) } },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    controller = module.get<ReelsController>(ReelsController);
    reelsService = module.get<ReelsService>(ReelsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(reelsService).toBeDefined();
  });

  it('should filter published reels by creatorId when requested', async () => {
    const creatorId = 'creator_test_123';
    const mockReels = [
      {
        id: 'reel_creator_1',
        hlsUrl: 'https://res.cloudinary.com/demo/video/upload/sp_hd/v1/reel_1.m3u8',
        posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0/v1/reel_1.jpg',
        caption: 'Luxury Beach House Tour',
        status: 'PUBLISHED',
        publishedAt: new Date('2026-09-20T00:00:00Z'),
        creator: {
          id: creatorId,
          name: 'Elena Rostova',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      },
    ];

    mockPrismaService.reel.findMany.mockResolvedValue(mockReels);

    const result = await controller.getCreatorReels(creatorId);

    expect(mockPrismaService.reel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'PUBLISHED',
          creatorId: creatorId,
        },
      }),
    );
    expect(result.items.length).toBe(1);
    expect(result.items[0].creator.id).toBe(creatorId);
  });

  it('should support creatorId query parameter on main feed endpoint', async () => {
    const creatorId = 'host_456';
    mockPrismaService.reel.findMany.mockResolvedValue([]);

    await controller.getReelsFeed('10', undefined, creatorId);

    expect(mockPrismaService.reel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'PUBLISHED',
          creatorId: creatorId,
        },
      }),
    );
  });
});
