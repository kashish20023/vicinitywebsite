import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Manual Property Integration Verification', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('verifies complete Property CRUD, Location Fields, and Approval Lifecycle', async () => {
    console.log('\n================================================================');
    console.log('🚀 STARTING COMPREHENSIVE MANUAL INTEGRATION TEST FOR PROPERTIES');
    console.log('================================================================\n');

    // STEP 0: Cleanup
    console.log('🧹 [Step 0] Cleaning test database state...');
    const testEmails = ['manhost@fairbnb.com', 'manadmin@fairbnb.com'];
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: testEmails } },
    });
    if (existingUsers.length > 0) {
      const uIds = existingUsers.map((u) => u.id);
      await prisma.property.deleteMany({ where: { hostId: { in: uIds } } });
      await prisma.user.deleteMany({ where: { id: { in: uIds } } });
    }
    console.log('  -> Database cleaned.');

    // STEP 1: Create accounts
    console.log('👤 [Step 1] Creating test accounts (HOST, ADMIN)...');
    const hash = await bcrypt.hash('Password@123', 10);

    const hostUser = await prisma.user.create({
      data: {
        name: 'Manual Test Host',
        email: 'manhost@fairbnb.com',
        phone: '7771112222',
        passwordHash: hash,
        role: UserRole.HOST,
        isActive: true,
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        name: 'Manual Test Admin',
        email: 'manadmin@fairbnb.com',
        phone: '7771113333',
        passwordHash: hash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    // Login Host
    const hostLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'manhost@fairbnb.com', password: 'Password@123' })
      .expect(200);
    const hostToken = hostLoginRes.body.accessToken;
    console.log('  -> Host authenticated. Token acquired.');

    // Login Admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'manadmin@fairbnb.com', password: 'Password@123' })
      .expect(200);
    const adminToken = adminLoginRes.body.accessToken;
    console.log('  -> Admin authenticated. Token acquired.');

    // STEP 2: Host Creates Property
    console.log('🏡 [Step 2] Host creates Property with Location fields...');
    const createPropRes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'Seaside Paradise Villa',
        description: 'Breathtaking 4-bedroom villa right on the beach with private pool',
        shortDescription: 'Luxury beachside paradise',
        category: 'Villa',
        propertyType: 'Entire Villa',
        listingPurpose: 'Rental',

        // Location fields
        address: '456 Marine Drive, Apt 10B',
        locality: 'Colaba',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: 400005,
        latitude: 18.922,
        longitude: 72.8347,

        maxGuests: 8,
        bedrooms: 4,
        beds: 5,
        bathrooms: 4,
        basePrice: 22000,
        instantBook: true,
      })
      .expect(201);

    const propertyId = createPropRes.body.id;
    console.log(`  -> Property Created! ID: ${propertyId}`);
    console.log(`  -> Status: "${createPropRes.body.status}"`);
    console.log(`  -> Verification Status: "${createPropRes.body.verificationStatus}"`);
    console.log(`  -> Location: ${createPropRes.body.address}, ${createPropRes.body.locality}, ${createPropRes.body.city}, ${createPropRes.body.state}, ${createPropRes.body.country} (PIN: ${createPropRes.body.pincode})`);

    expect(createPropRes.body.status).toBe('PENDING_APPROVAL');
    expect(createPropRes.body.verificationStatus).toBe('PENDING');

    // STEP 3: Public Catalog check
    console.log('🔒 [Step 3] Public GET /properties (Pending property hidden)...');
    const publicCatalogRes = await request(app.getHttpServer())
      .get('/properties')
      .expect(200);

    const foundInPublic = publicCatalogRes.body.find((p: any) => p.id === propertyId);
    expect(foundInPublic).toBeUndefined();
    console.log('  -> Confirmed: Pending property hidden from public catalog.');

    // STEP 4: Host my-properties check
    console.log('📋 [Step 4] Host GET /properties/my-properties...');
    const hostMyPropsRes = await request(app.getHttpServer())
      .get('/properties/my-properties')
      .set('Authorization', `Bearer ${hostToken}`)
      .expect(200);

    const foundInHost = hostMyPropsRes.body.find((p: any) => p.id === propertyId);
    expect(foundInHost).toBeDefined();
    console.log(`  -> Confirmed: Host sees pending property "${foundInHost.title}".`);

    // STEP 5: Admin Approves Property
    console.log('⚡ [Step 5] Admin Approves Property (PATCH /properties/:id/approve)...');
    const approveRes = await request(app.getHttpServer())
      .patch(`/properties/${propertyId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(approveRes.body.status).toBe('PUBLISHED');
    expect(approveRes.body.verificationStatus).toBe('APPROVED');
    console.log('  -> Status updated to PUBLISHED / APPROVED.');

    // STEP 6: Public Catalog re-check
    console.log('🌐 [Step 6] Public GET /properties after approval...');
    const publicCatalogRes2 = await request(app.getHttpServer())
      .get('/properties?city=Mumbai')
      .expect(200);

    const foundInPublic2 = publicCatalogRes2.body.find((p: any) => p.id === propertyId);
    expect(foundInPublic2).toBeDefined();
    console.log(`  -> Confirmed: Approved property visible to public in ${foundInPublic2.city}!`);

    // STEP 7: Admin Auto-Approval Creation
    console.log('👑 [Step 7] Admin creates a property (Auto-Approval check)...');
    const adminPropRes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Imperial Tower Penthouse',
        description: 'Penthouse suite created directly by Admin',
        category: 'Penthouse',
        propertyType: 'Entire Apartment',
        listingPurpose: 'Rental',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        maxGuests: 6,
        bedrooms: 3,
        beds: 3,
        bathrooms: 3,
        basePrice: 35000,
      })
      .expect(201);

    expect(adminPropRes.body.status).toBe('PUBLISHED');
    expect(adminPropRes.body.verificationStatus).toBe('APPROVED');
    console.log('  -> Confirmed: Admin property auto-approved.');

    // STEP 8: Admin Rejection
    console.log('🚫 [Step 8] Admin Rejects Property (PATCH /properties/:id/reject)...');
    const rejectRes = await request(app.getHttpServer())
      .patch(`/properties/${propertyId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rejectionReason: 'Missing fire safety certificate' })
      .expect(200);

    expect(rejectRes.body.status).toBe('REJECTED');
    expect(rejectRes.body.rejectionReason).toBe('Missing fire safety certificate');
    console.log('  -> Confirmed: Status set to REJECTED with reason.');

    // STEP 9: Input Validation
    console.log('🧪 [Step 9] Input Validation & Error Handling...');
    await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'Bad Location Property',
        description: 'Missing location fields',
        category: 'Villa',
        propertyType: 'House',
        listingPurpose: 'Rental',
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        basePrice: 1000,
      })
      .expect(400);
    console.log('  -> 400 Bad Request returned for missing location fields.');

    // STEP 10: Cleanup
    console.log('🧹 [Step 10] Final Cleanup...');
    await prisma.property.deleteMany({
      where: { hostId: { in: [hostUser.id, adminUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [hostUser.id, adminUser.id] } },
    });
    console.log('  -> Cleanup finished.\n');

    console.log('================================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED 100% SUCCESSFULLY!');
    console.log('================================================================\n');
  });
});
