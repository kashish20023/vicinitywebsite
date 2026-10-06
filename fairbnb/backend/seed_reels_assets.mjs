import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRealReels() {
  console.log('--- SEEDING REAL VIDEO REELS ---');

  // Find or create host
  let host = await prisma.user.findFirst({
    where: { role: 'HOST' },
  });

  if (!host) {
    host = await prisma.user.create({
      data: {
        email: 'host.reels@fairbnb.com',
        name: 'Rohan Mehta',
        role: 'HOST',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
      },
    });
  }

  // Find or create property
  let property = await prisma.property.findFirst();

  if (!property) {
    property = await prisma.property.create({
      data: {
        hostId: host.id,
        title: 'Sunset Villa Goa',
        description: 'Luxury beachfront villa with private pool',
        address: 'Anjuna Beach Road',
        city: 'Goa',
        state: 'Goa',
        country: 'India',
        category: 'VILLA',
        propertyType: 'Entire Villa',
        basePrice: 14500,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 6,
        verificationStatus: 'APPROVED',
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        ],
      },
    });
  }

  // Clean existing test reels with dummy URLs
  await prisma.reel.deleteMany({
    where: {
      videoUrl: {
        in: ['/videos/26118.mp4', '/videos/26120.mp4'],
      },
    },
  });

  // Create Reel 1 using real video 26118.mp4
  const reel1 = await prisma.reel.create({
    data: {
      creatorId: host.id,
      videoUrl: '/videos/26118.mp4',
      posterUrl:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      caption:
        'Experience the ultimate oceanfront sunset at Sunset Villa Goa 🌅✨ #Goa #BeachVilla #FairBnB',
      duration: 18.2,
      width: 1080,
      height: 1920,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 3600 * 1000 * 2), // 2 hours ago
      likeCount: 42,
      commentCount: 8,
      viewCount: 350,
      rankingScore: 78.5,
    },
  });

  await prisma.reelListing.create({
    data: {
      reelId: reel1.id,
      propertyId: property.id,
    },
  });

  // Create Reel 2 using real video 26120.mp4
  const reel2 = await prisma.reel.create({
    data: {
      creatorId: host.id,
      videoUrl: '/videos/26120.mp4',
      posterUrl:
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      caption:
        'Private pool vibes & tropical gardens at our luxury coastal getaway 🏊‍♂️🌴 #FairBnBSights',
      duration: 14.5,
      width: 1080,
      height: 1920,
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 3600 * 1000 * 6), // 6 hours ago
      likeCount: 29,
      commentCount: 5,
      viewCount: 210,
      rankingScore: 65.2,
    },
  });

  await prisma.reelListing.create({
    data: {
      reelId: reel2.id,
      propertyId: property.id,
    },
  });

  console.log('Seeded Reel 1:', reel1.id, reel1.videoUrl);
  console.log('Seeded Reel 2:', reel2.id, reel2.videoUrl);
}

seedRealReels()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
