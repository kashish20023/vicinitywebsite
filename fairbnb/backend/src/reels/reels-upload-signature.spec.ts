import { Test, TestingModule } from '@nestjs/testing';
import { ReelsService } from './reels.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('Phase 2 — Secure Reel Upload Signature API Security Suite', () => {
  let reelsService: ReelsService;
  let prisma: PrismaClientMock;
  let cloudinaryService: CloudinaryService;

  const mockHost = { id: 'host_user_1', role: 'HOST' };
  const mockGuest = { id: 'guest_user_1', role: 'USER' };
  const mockAdmin = { id: 'admin_user_1', role: 'ADMIN' };
  const mockCoHost = { id: 'cohost_user_1', role: 'HOST' };
  const mockInactiveCoHost = { id: 'cohost_inactive_1', role: 'HOST' };

  const mockOwnedProperty = {
    id: 'prop_owned_1',
    hostId: 'host_user_1',
    ownerId: 'host_user_1',
  };

  const mockOtherHostProperty = {
    id: 'prop_other_1',
    hostId: 'host_user_other',
    ownerId: 'host_user_other',
  };

  class PrismaClientMock {
    property = {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === mockOwnedProperty.id) return mockOwnedProperty;
        if (where.id === mockOtherHostProperty.id) return mockOtherHostProperty;
        return null;
      }),
    };

    coHostRelationship = {
      findUnique: jest.fn(async ({ where }: { where: { propertyId_coHostUserId: { propertyId: string; coHostUserId: string } } }) => {
        const { propertyId, coHostUserId } = where.propertyId_coHostUserId;
        if (propertyId === mockOtherHostProperty.id && coHostUserId === mockCoHost.id) {
          return {
            id: 'rel_active_1',
            status: 'ACTIVE',
            permissions: [{ permission: 'EDIT_LISTING' }],
          };
        }
        if (propertyId === mockOtherHostProperty.id && coHostUserId === mockInactiveCoHost.id) {
          return {
            id: 'rel_inactive_1',
            status: 'INACTIVE',
            permissions: [{ permission: 'EDIT_LISTING' }],
          };
        }
        return null;
      }),
    };

    reel = {
      create: jest.fn(async ({ data }: any) => ({
        id: 'reel_created_123',
        creatorId: data.creatorId,
        caption: data.caption || null,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
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

  describe('Attack 1 — Guest User Authorization Bypass', () => {
    it('should reject normal USER / GUEST with 403 Forbidden', async () => {
      await expect(
        reelsService.createUploadSignature(mockGuest, {
          propertyId: mockOwnedProperty.id,
          caption: 'Guest attempt',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Attack 2 — Host Impersonation & Server-Controlled Creator Identity', () => {
    it('should assign creatorId strictly from authenticated req.user.id', async () => {
      const result = await reelsService.createUploadSignature(mockHost, {
        propertyId: mockOwnedProperty.id,
        caption: 'Host reel',
      });

      expect(prisma.reel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            creatorId: mockHost.id,
            status: 'DRAFT', // MUST BE DRAFT / INITIAL STATE (NEVER PUBLISHED)
          }),
        }),
      );
      expect(result.reelId).toBe('reel_created_123');
    });
  });

  describe('Attack 3 — Cross-Property Access (Host A accessing Host B Property)', () => {
    it('should reject Host attempting to request upload signature for another host property with 403 Forbidden', async () => {
      await expect(
        reelsService.createUploadSignature(mockHost, {
          propertyId: mockOtherHostProperty.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Attack 4 — Co-Host Permission Boundaries', () => {
    it('should allow active Co-Host with EDIT_LISTING permission to obtain upload signature', async () => {
      const result = await reelsService.createUploadSignature(mockCoHost, {
        propertyId: mockOtherHostProperty.id,
        caption: 'Co-Host reel',
      });

      expect(result.signature).toBeDefined();
      expect(result.reelId).toBe('reel_created_123');
    });

    it('should reject inactive Co-Host with 403 Forbidden', async () => {
      await expect(
        reelsService.createUploadSignature(mockInactiveCoHost, {
          propertyId: mockOtherHostProperty.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject non-co-host user attempting property upload signature with 403 Forbidden', async () => {
      const randomUser = { id: 'random_user_99', role: 'HOST' };
      await expect(
        reelsService.createUploadSignature(randomUser, {
          propertyId: mockOtherHostProperty.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Attack 5 — Cloudinary API Secret Leakage Verification', () => {
    it('should NEVER return or expose CLOUDINARY_API_SECRET in the API response', async () => {
      const result = await reelsService.createUploadSignature(mockHost, {
        propertyId: mockOwnedProperty.id,
      });

      const responseString = JSON.stringify(result);
      expect(responseString).not.toContain('SUPER_SECRET_KEY_456');
      expect((result as any).apiSecret).toBeUndefined();
      expect((result as any).CLOUDINARY_API_SECRET).toBeUndefined();
    });
  });

  describe('Attack 6 — Parameter Tampering & Server Control Verification', () => {
    it('should enforce server-controlled folder, resourceType, eager HLS, and timestamp', async () => {
      const result = await reelsService.createUploadSignature(mockHost, {
        propertyId: mockOwnedProperty.id,
      });

      expect(result.folder).toBe('fairbnb/reels');
      expect(result.resourceType).toBe('video');
      expect(result.eager).toBe('sp_hd/m3u8');
      expect(result.eagerAsync).toBe(true);
      expect(result.apiKey).toBe('test_api_key_123');
      expect(result.cloudName).toBe('fairbnb_test_cloud');
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.signature).toBeDefined();
    });
  });

  describe('Reel Lifecycle Initial State Check', () => {
    it('should NEVER set Reel status to PUBLISHED during signature creation', async () => {
      await reelsService.createUploadSignature(mockHost, {
        propertyId: mockOwnedProperty.id,
      });

      const createCallData = (prisma.reel.create as jest.Mock).mock.calls[0][0].data;
      expect(createCallData.status).not.toBe('PUBLISHED');
      expect(createCallData.status).toBe('DRAFT');
    });
  });
});
