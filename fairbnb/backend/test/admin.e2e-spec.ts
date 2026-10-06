import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Admin Dashboard Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let adminUser: any;
  let hostUser: any;
  let guestUser: any;
  let testProperty: any;

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

    // Setup Test Data
    const hash = await bcrypt.hash('Password123!', 10);
    const testEmails = ['adm_e2e_admin@test.com', 'adm_e2e_host@test.com', 'adm_e2e_guest@test.com'];

    // Cleanup existing test accounts
    const existing = await prisma.user.findMany({ where: { email: { in: testEmails } } });
    if (existing.length) {
      const ids = existing.map((u) => u.id);
      await prisma.property.deleteMany({ where: { hostId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }

    adminUser = await prisma.user.create({
      data: {
        name: 'E2E Admin User',
        email: 'adm_e2e_admin@test.com',
        phone: '+919999000001',
        passwordHash: hash,
        role: UserRole.ADMIN,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
      },
    });

    hostUser = await prisma.user.create({
      data: {
        name: 'E2E Host User',
        email: 'adm_e2e_host@test.com',
        phone: '+919999000002',
        passwordHash: hash,
        role: UserRole.HOST,
        phoneVerified: false,
        emailVerified: true,
        isActive: true,
      },
    });

    guestUser = await prisma.user.create({
      data: {
        name: 'E2E Guest User',
        email: 'adm_e2e_guest@test.com',
        phone: '+919999000003',
        passwordHash: hash,
        role: UserRole.USER,
        phoneVerified: false,
        emailVerified: false,
        isActive: false, // Blocked user for testing
      },
    });

    testProperty = await prisma.property.create({
      data: {
        title: 'E2E Test Cottage',
        description: 'Test cottage for admin e2e tests',
        slug: 'e2e-test-cottage-admin',
        category: 'Cottage',
        propertyType: 'Entire Place',
        listingPurpose: 'Rent',
        city: 'Shimla',
        state: 'Himachal Pradesh',
        country: 'India',
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        basePrice: 5000,
        instantBook: true,
        totalStock: 1,
        minNights: 1,
        cancellationPolicy: 'FLEXIBLE',
        images: [],
        gallery: [],
        listingExtras: {},
        status: 'PENDING_APPROVAL',
        verificationStatus: 'PENDING',
        hostId: hostUser.id,
      },
    });

    // Authenticate Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'adm_e2e_admin@test.com', password: 'Password123!' })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    // Authenticate Regular User
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'adm_e2e_host@test.com', password: 'Password123!' })
      .expect(200);
    userToken = userLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.property.deleteMany({ where: { hostId: { in: [adminUser.id, hostUser.id, guestUser.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, hostUser.id, guestUser.id] } } });
    await app.close();
  });

  describe('Authorization Guard Checks', () => {
    it('rejects unauthenticated requests (401)', async () => {
      await request(app.getHttpServer()).get('/admin/overview').expect(401);
    });

    it('rejects non-admin role requests (403)', async () => {
      await request(app.getHttpServer())
        .get('/admin/overview')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /admin/overview', () => {
    it('returns dashboard overview metrics', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.overview).toBeDefined();
      expect(res.body.overview.users).toBeDefined();
      expect(res.body.overview.properties).toBeDefined();
      expect(typeof res.body.overview.users.total).toBe('number');
      expect(typeof res.body.overview.properties.total).toBe('number');
    });
  });

  describe('GET /admin/users & Users Submodule', () => {
    it('GET /admin/users returns all users', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /admin/users/hosts returns hosts with property count', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/users/hosts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const hostItem = res.body.find((h: any) => h.id === hostUser.id);
      expect(hostItem).toBeDefined();
      expect(hostItem.totalPropertiesCount).toBeGreaterThanOrEqual(1);
    });

    it('GET /admin/users/verification returns users pending verification', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/users/verification')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('PATCH /admin/users/:id/verify updates user verification', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/users/${hostUser.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phoneVerified: true, emailVerified: true })
        .expect(200);

      expect(res.body.phoneVerified).toBe(true);
      expect(res.body.emailVerified).toBe(true);
    });

    it('GET /admin/users/blocked returns blocked users', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/users/blocked')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const blocked = res.body.find((u: any) => u.id === guestUser.id);
      expect(blocked).toBeDefined();
    });

    it('PATCH /admin/users/:id/status updates active/blocked status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/users/${guestUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(res.body.isActive).toBe(true);
    });
  });

  describe('GET /admin/properties & Properties Submodule', () => {
    it('GET /admin/properties returns all properties with host data', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/properties')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].host).toBeDefined();
    });

    it('GET /admin/properties/pending returns pending properties', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/properties/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const pendingProp = res.body.find((p: any) => p.id === testProperty.id);
      expect(pendingProp).toBeDefined();
    });

    it('PATCH /admin/properties/:id/verify approves a property', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/properties/${testProperty.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'APPROVE', verificationNote: 'E2E Approved' })
        .expect(200);

      expect(res.body.verificationStatus).toBe('APPROVED');
      expect(res.body.status).toBe('PUBLISHED');
    });

    it('GET /admin/properties/approved returns approved properties', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/properties/approved')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const approvedProp = res.body.find((p: any) => p.id === testProperty.id);
      expect(approvedProp).toBeDefined();
    });

    it('PATCH /admin/properties/:id/verify rejects a property', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/properties/${testProperty.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'REJECT', rejectionReason: 'Docs invalid' })
        .expect(200);

      expect(res.body.verificationStatus).toBe('REJECTED');
      expect(res.body.status).toBe('REJECTED');
      expect(res.body.rejectionReason).toBe('Docs invalid');
    });

    it('GET /admin/properties/rejected returns rejected properties', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/properties/rejected')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const rejectedProp = res.body.find((p: any) => p.id === testProperty.id);
      expect(rejectedProp).toBeDefined();
    });
  });
});
