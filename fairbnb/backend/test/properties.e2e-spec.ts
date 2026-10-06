import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Properties Approval Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let hostToken: string;
  let hostUserId: string;
  let adminToken: string;
  let adminUserId: string;
  let userToken: string;

  let hostPropertyId: string;
  let adminPropertyId: string;

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

    // Clean up existing test users / properties
    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: ['prophost@example.com', 'propuser@example.com', 'propadmin@example.com'] } },
          { phone: { in: ['8888888888', '9999999999', '0000000001'] } },
        ],
      },
    });
    if (existingUsers.length > 0) {
      const userIds = existingUsers.map((u) => u.id);
      await prisma.property.deleteMany({
        where: { hostId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    const passwordHash = await bcrypt.hash('Password@123', 10);

    // 1. Create a HOST user
    const hostUser = await prisma.user.create({
      data: {
        name: 'Property Host',
        email: 'prophost@example.com',
        phone: '8888888888',
        passwordHash,
        role: UserRole.HOST,
        isActive: true,
      },
    });
    hostUserId = hostUser.id;

    const hostLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'prophost@example.com', password: 'Password@123' });
    hostToken = hostLogin.body.accessToken;

    // 2. Create an ADMIN user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Property Admin',
        email: 'propadmin@example.com',
        phone: '0000000001',
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'propadmin@example.com', password: 'Password@123' });
    adminToken = adminLogin.body.accessToken;

    // 3. Create a standard USER
    await prisma.user.create({
      data: {
        name: 'Standard User',
        email: 'propuser@example.com',
        phone: '9999999999',
        passwordHash,
        role: UserRole.USER,
        isActive: true,
      },
    });

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'propuser@example.com', password: 'Password@123' });
    userToken = userLogin.body.accessToken;
  });

  afterAll(async () => {
    // Clean up created properties and test users
    await prisma.property.deleteMany({
      where: { hostId: { in: [hostUserId, adminUserId] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['prophost@example.com', 'propuser@example.com', 'propadmin@example.com'] } },
    });
    await app.close();
  });

  describe('Property Creation & Approval Lifecycle', () => {
    it('1. HOST creates property -> status must be PENDING_APPROVAL / PENDING', async () => {
      const res = await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          title: 'Host Villa Pending',
          description: 'Luxury villa pending admin review',
          category: 'Villa',
          propertyType: 'Entire Villa',
          listingPurpose: 'Rental',
          city: 'Goa',
          state: 'Goa',
          country: 'India',
          maxGuests: 4,
          bedrooms: 2,
          beds: 2,
          bathrooms: 2,
          basePrice: 8000,
        })
        .expect(201);

      expect(res.body.status).toBe('PENDING_APPROVAL');
      expect(res.body.verificationStatus).toBe('PENDING');
      hostPropertyId = res.body.id;
    });

    it('2. Public GET /properties -> pending host property MUST NOT be visible', async () => {
      const res = await request(app.getHttpServer())
        .get('/properties')
        .expect(200);

      const found = res.body.find((p: any) => p.id === hostPropertyId);
      expect(found).toBeUndefined();
    });

    it('3. HOST GET /properties/my-properties -> host MUST see their pending property', async () => {
      const res = await request(app.getHttpServer())
        .get('/properties/my-properties')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const found = res.body.find((p: any) => p.id === hostPropertyId);
      expect(found).toBeDefined();
      expect(found.status).toBe('PENDING_APPROVAL');
    });

    it('4. ADMIN GET /properties/admin/all -> admin MUST see all properties including pending', async () => {
      const res = await request(app.getHttpServer())
        .get('/properties/admin/all?verificationStatus=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = res.body.find((p: any) => p.id === hostPropertyId);
      expect(found).toBeDefined();
    });

    it('5. ADMIN approves host property -> status becomes PUBLISHED & APPROVED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/properties/${hostPropertyId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.verificationStatus).toBe('APPROVED');
    });

    it('6. Public GET /properties -> approved host property MUST NOW be visible', async () => {
      const res = await request(app.getHttpServer())
        .get('/properties')
        .expect(200);

      const found = res.body.find((p: any) => p.id === hostPropertyId);
      expect(found).toBeDefined();
      expect(found.status).toBe('PUBLISHED');
      expect(found.verificationStatus).toBe('APPROVED');
    });

    it('7. ADMIN creates property -> auto-approved with status PUBLISHED & APPROVED', async () => {
      const res = await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Managed Penthouse',
          description: 'Exclusive penthouse auto-approved by admin',
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
          basePrice: 25000,
        })
        .expect(201);

      expect(res.body.status).toBe('PUBLISHED');
      expect(res.body.verificationStatus).toBe('APPROVED');
      adminPropertyId = res.body.id;
    });

    it('8. ADMIN rejects property -> status becomes REJECTED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/properties/${hostPropertyId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejectionReason: 'Incomplete ownership documents' })
        .expect(200);

      expect(res.body.status).toBe('REJECTED');
      expect(res.body.verificationStatus).toBe('REJECTED');
      expect(res.body.rejectionReason).toBe('Incomplete ownership documents');

      // Verify rejected property is no longer in public list
      const publicRes = await request(app.getHttpServer())
        .get('/properties')
        .expect(200);

      const found = publicRes.body.find((p: any) => p.id === hostPropertyId);
      expect(found).toBeUndefined();
    });
  });
});
