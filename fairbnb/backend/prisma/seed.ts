import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Fairbnb Database Seeding...');

  // Read dummy data JSON file
  const jsonPath = path.join(__dirname, '../fairbnb_dummy_data.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Dummy data file not found at ${jsonPath}`);
    process.exit(1);
  }

  const dummyData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // 1. Seed Users
  console.log(`👤 Seeding ${dummyData.users.length} users...`);
  const seedEmails = dummyData.users.map((u: any) => u.email).filter(Boolean);
  await prisma.user.deleteMany({ where: { email: { in: seedEmails } } });

  for (const user of dummyData.users) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        passwordHash: user.passwordHash,
        role: user.role as UserRole,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
    });
  }

  // 1b. Seed Quick Demo Accounts explicitly to match frontend login buttons
  const demoUsers = [
    { email: 'guest@fairbnb.com', name: 'Demo Guest', role: UserRole.USER, pass: 'guest123', phone: '+919999900001' },
    { email: 'host@fairbnb.com', name: 'Demo Host', role: UserRole.HOST, pass: 'host123', phone: '+919999900002' },
    { email: 'demo.cohost@fairbnb.com', name: 'Demo Co-Host', role: UserRole.HOST, pass: 'Password@123', phone: '+919999900003' },
    { email: 'admin@fairbnb.com', name: 'Demo Admin', role: UserRole.ADMIN, pass: 'admin123', phone: '+919999900004' },
  ];

  for (const u of demoUsers) {
    const passwordHash = await bcrypt.hash(u.pass, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, name: u.name, isActive: true },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        phone: u.phone,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    });
  }
  console.log('✅ Users & Quick Demo Accounts seeded successfully!');

  // 2. Seed Properties
  console.log(`🏠 Seeding ${dummyData.properties.length} properties...`);
  for (const prop of dummyData.properties) {
    await prisma.property.upsert({
      where: { slug: prop.slug },
      update: {
        title: prop.title,
        description: prop.description,
        shortDescription: prop.shortDescription,
        neighborhoodDescription: prop.neighborhoodDescription,
        aiKnowledgeBasePublic: prop.aiKnowledgeBasePublic,
        aiKnowledgeBasePrivate: prop.aiKnowledgeBasePrivate,
        category: prop.category,
        propertyType: prop.propertyType,
        listingPurpose: prop.listingPurpose,
        address: prop.address,
        locality: prop.locality,
        city: prop.city,
        state: prop.state,
        country: prop.country,
        pincode: prop.pincode,
        latitude: prop.latitude,
        longitude: prop.longitude,
        maxGuests: prop.maxGuests,
        bedrooms: prop.bedrooms,
        beds: prop.beds,
        bathrooms: prop.bathrooms,
        basePrice: prop.basePrice,
        instantBook: prop.instantBook,
        totalStock: prop.totalStock,
        minNights: prop.minNights,
        cancellationPolicy: prop.cancellationPolicy,
        images: prop.images,
        gallery: prop.gallery,
        coverImage: prop.coverImage,
        listingExtras: prop.listingExtras,
        status: prop.status,
        rejectionReason: prop.rejectionReason,
        verificationStatus: prop.verificationStatus,
        verificationNote: prop.verificationNote,
        ownershipProofDocs: prop.ownershipProofDocs,
        pointOfContact: prop.pointOfContact,
        adminTags: prop.adminTags,
        icalExportToken: prop.icalExportToken,
        hostId: prop.hostId,
        ownerId: prop.ownerId,
      },
      create: {
        id: prop.id,
        slug: prop.slug,
        title: prop.title,
        description: prop.description,
        shortDescription: prop.shortDescription,
        neighborhoodDescription: prop.neighborhoodDescription,
        aiKnowledgeBasePublic: prop.aiKnowledgeBasePublic,
        aiKnowledgeBasePrivate: prop.aiKnowledgeBasePrivate,
        category: prop.category,
        propertyType: prop.propertyType,
        listingPurpose: prop.listingPurpose,
        address: prop.address,
        locality: prop.locality,
        city: prop.city,
        state: prop.state,
        country: prop.country,
        pincode: prop.pincode,
        latitude: prop.latitude,
        longitude: prop.longitude,
        maxGuests: prop.maxGuests,
        bedrooms: prop.bedrooms,
        beds: prop.beds,
        bathrooms: prop.bathrooms,
        basePrice: prop.basePrice,
        instantBook: prop.instantBook,
        totalStock: prop.totalStock,
        minNights: prop.minNights,
        cancellationPolicy: prop.cancellationPolicy,
        images: prop.images,
        gallery: prop.gallery,
        coverImage: prop.coverImage,
        listingExtras: prop.listingExtras,
        status: prop.status,
        rejectionReason: prop.rejectionReason,
        verificationStatus: prop.verificationStatus,
        verificationNote: prop.verificationNote,
        ownershipProofDocs: prop.ownershipProofDocs,
        pointOfContact: prop.pointOfContact,
        adminTags: prop.adminTags,
        icalExportToken: prop.icalExportToken,
        hostId: prop.hostId,
        ownerId: prop.ownerId,
      },
    });
  }
  console.log('✅ Properties seeded successfully!');

  // 3. Seed Sample Bookings
  console.log('📅 Seeding sample bookings...');
  const sampleBookings = [
    {
      id: 'bk_seed_001',
      propertyId: 'prop_goa_villa_001',
      guestId: 'usr_guest_3004004004',
      checkIn: new Date('2026-09-01T00:00:00.000Z'),
      checkOut: new Date('2026-09-05T00:00:00.000Z'),
      totalAmount: 58000.0,
      guests: 4,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      bookingType: 'instant',
      source: 'Fairbnb Web',
      couponCode: 'WELCOME10',
      discountAmount: 2000.0,
    },
    {
      id: 'bk_seed_002',
      propertyId: 'prop_manali_retreat_002',
      guestId: 'usr_guest_3005005005',
      checkIn: new Date('2026-09-10T00:00:00.000Z'),
      checkOut: new Date('2026-09-12T00:00:00.000Z'),
      totalAmount: 17800.0,
      guests: 2,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      bookingType: 'standard',
      source: 'Fairbnb App',
    },
    {
      id: 'bk_seed_003',
      propertyId: 'prop_jaipur_haveli_003',
      guestId: 'usr_guest_3004004004',
      checkIn: new Date('2026-09-15T00:00:00.000Z'),
      checkOut: new Date('2026-09-18T00:00:00.000Z'),
      totalAmount: 54000.0,
      guests: 6,
      status: 'CANCELLED',
      paymentStatus: 'PARTIALLY_REFUNDED',
      refundStatus: 'PARTIAL',
      cancellation: {
        reason: 'Guest plans changed due to flight schedule',
        cancelledBy: 'USER',
        cancelledAt: '2026-08-22T10:00:00.000Z',
      },
    },
    {
      id: 'bk_seed_004',
      propertyId: 'prop_mumbai_penthouse_004',
      guestId: 'usr_guest_3005005005',
      checkIn: new Date('2026-10-01T00:00:00.000Z'),
      checkOut: new Date('2026-10-03T00:00:00.000Z'),
      totalAmount: 50000.0,
      guests: 3,
      status: 'PENDING',
      paymentStatus: 'PENDING',
    },
  ];

  for (const b of sampleBookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }
  console.log('✅ Sample Bookings seeded successfully!');

  // 4. Seed Sample Refunds
  console.log('💸 Seeding sample refunds...');
  const sampleRefunds = [
    {
      id: 'ref_seed_001',
      bookingId: 'bk_seed_003',
      amount: 18000.0,
      reason: 'Partial refund per cancellation policy',
      status: 'COMPLETED',
      processedById: 'usr_admin_1001001001',
      requestedAt: new Date('2026-08-22T10:30:00.000Z'),
      processedAt: new Date('2026-08-22T11:00:00.000Z'),
    },
    {
      id: 'ref_seed_002',
      bookingId: 'bk_seed_001',
      amount: 5000.0,
      reason: 'Courtesy discount refund by host',
      status: 'PENDING',
      processedById: 'usr_admin_1001001001',
      requestedAt: new Date('2026-08-24T09:00:00.000Z'),
    },
  ];

  for (const r of sampleRefunds) {
    await prisma.refund.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
  }
  console.log('✅ Sample Refunds seeded successfully!');

  // 5. Seed Real Coupons (Migrated from legacy hardcoded codes)
  console.log('🎟️ Seeding real coupons...');
  const sampleCoupons = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: 5000,
      usageLimit: 1000,
      timesUsed: 0,
      isActive: true,
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: new Date('2030-01-01T00:00:00.000Z'),
    },
    {
      code: 'FAIRBNB500',
      discountType: 'FLAT',
      discountValue: 500,
      minOrderAmount: 2000,
      maxDiscountAmount: 500,
      usageLimit: 1000,
      timesUsed: 0,
      isActive: true,
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validUntil: new Date('2030-01-01T00:00:00.000Z'),
    },
  ];

  for (const c of sampleCoupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log('✅ Sample Coupons seeded successfully!');

  // 6. Link properties to Co-Host demo user
  const coHostUser = await prisma.user.findUnique({ where: { email: 'demo.cohost@fairbnb.com' } });
  if (coHostUser) {
    const allProps = await prisma.property.findMany();
    for (const p of allProps) {
      if (p.hostId !== coHostUser.id) {
        await prisma.coHostRelationship.upsert({
          where: { propertyId_coHostUserId: { propertyId: p.id, coHostUserId: coHostUser.id } },
          update: { status: 'ACTIVE' },
          create: {
            propertyId: p.id,
            hostUserId: p.hostId,
            coHostUserId: coHostUser.id,
            status: 'ACTIVE',
            permissionLevel: 'FULL_ACCESS',
            acceptedAt: new Date(),
          },
        });
      }
    }
    console.log('✅ Demo Co-Host relationships seeded successfully!');
  }

  console.log('\n🎉 Fairbnb Database Seeding Completed!');
  console.log('🔑 Quick Demo Logins:');
  console.log('   Admin: admin@fairbnb.com / admin123');
  console.log('   Co-Host: demo.cohost@fairbnb.com / Password@123');
  console.log('   Host: host@fairbnb.com / host123');
  console.log('   Guest: guest@fairbnb.com / guest123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
