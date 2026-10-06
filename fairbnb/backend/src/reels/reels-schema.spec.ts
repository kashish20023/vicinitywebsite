import { PrismaClient } from '@prisma/client';

describe('Phase 1 — Reels Prisma Data Model Verification', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should verify schema relations and unique constraints for Reels models', async () => {
    const timestamp = Date.now();

    // 1. Create test user (creator)
    const creator = await prisma.user.create({
      data: {
        name: `Test Creator ${timestamp}`,
        phone: `+9199${timestamp.toString().slice(-8)}`,
        passwordHash: 'hashed_password',
        role: 'HOST',
      },
    });

    // 2. Create test property
    const property = await prisma.property.create({
      data: {
        title: `Test Villa ${timestamp}`,
        description: 'Luxury villa for testing',
        category: 'Villa',
        propertyType: 'Entire House',
        listingPurpose: 'RENT',
        city: 'Jaipur',
        state: 'Rajasthan',
        country: 'India',
        maxGuests: 6,
        bedrooms: 3,
        beds: 3,
        bathrooms: 3,
        basePrice: 5000,
        instantBook: true,
        totalStock: 1,
        minNights: 1,
        cancellationPolicy: 'FLEXIBLE',
        status: 'APPROVED',
        verificationStatus: 'VERIFIED',
        slug: `test-villa-${timestamp}`,
        hostId: creator.id,
        gallery: {},
        listingExtras: {},
      },
    });

    // 3. Create Reel
    const reel = await prisma.reel.create({
      data: {
        creatorId: creator.id,
        videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/test.mp4',
        hlsUrl: 'https://res.cloudinary.com/demo/video/upload/v1/test.m3u8',
        posterUrl: 'https://res.cloudinary.com/demo/video/upload/v1/test.jpg',
        cloudinaryPublicId: 'demo/test',
        duration: 15.5,
        width: 1080,
        height: 1920,
        caption: 'Beautiful luxury villa tour #vacation',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    expect(reel.id).toBeDefined();
    expect(reel.creatorId).toBe(creator.id);
    expect(reel.status).toBe('PUBLISHED');

    // 4. Tag Property (ReelListing)
    const listingTag = await prisma.reelListing.create({
      data: {
        reelId: reel.id,
        propertyId: property.id,
      },
    });
    expect(listingTag.id).toBeDefined();

    // 5. Test unique constraint on ReelListing (reelId, propertyId)
    await expect(
      prisma.reelListing.create({
        data: {
          reelId: reel.id,
          propertyId: property.id,
        },
      }),
    ).rejects.toThrow();

    // 6. Create ReelLike
    const like = await prisma.reelLike.create({
      data: {
        reelId: reel.id,
        userId: creator.id,
      },
    });
    expect(like.id).toBeDefined();

    // 7. Test unique constraint on ReelLike (reelId, userId)
    await expect(
      prisma.reelLike.create({
        data: {
          reelId: reel.id,
          userId: creator.id,
        },
      }),
    ).rejects.toThrow();

    // 8. Create ReelComment
    const comment = await prisma.reelComment.create({
      data: {
        reelId: reel.id,
        userId: creator.id,
        content: 'Stunning property!',
      },
    });
    expect(comment.id).toBeDefined();
    expect(comment.content).toBe('Stunning property!');

    // 9. Create ReelReport
    const report = await prisma.reelReport.create({
      data: {
        reelId: reel.id,
        reporterId: creator.id,
        reason: 'Inappropriate content',
        status: 'PENDING',
      },
    });
    expect(report.id).toBeDefined();
    expect(report.status).toBe('PENDING');

    // Clean up test records
    await prisma.reelReport.delete({ where: { id: report.id } });
    await prisma.reelComment.delete({ where: { id: comment.id } });
    await prisma.reelLike.delete({ where: { id: like.id } });
    await prisma.reelListing.delete({ where: { id: listingTag.id } });
    await prisma.reel.delete({ where: { id: reel.id } });
    await prisma.property.delete({ where: { id: property.id } });
    await prisma.user.delete({ where: { id: creator.id } });
  });
});
