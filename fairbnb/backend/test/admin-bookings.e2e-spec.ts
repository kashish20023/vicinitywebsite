import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Admin Bookings & Refunds Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let hostToken: string;
  let guestToken: string;

  let adminUser: any;
  let hostUser: any;
  let guestUser: any;
  let testProperty: any;
  let activeBooking: any;
  let cancelledBooking: any;

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
    const testEmails = ['bk_admin@test.com', 'bk_host@test.com', 'bk_guest@test.com'];

    // Cleanup existing test accounts
    const existing = await prisma.user.findMany({ where: { email: { in: testEmails } } });
    if (existing.length) {
      const ids = existing.map((u) => u.id);
      await prisma.booking.deleteMany({ where: { guestId: { in: ids } } });
      await prisma.property.deleteMany({ where: { hostId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }

    adminUser = await prisma.user.create({
      data: {
        name: 'Booking Admin User',
        email: 'bk_admin@test.com',
        phone: '+919999111001',
        passwordHash: hash,
        role: UserRole.ADMIN,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
      },
    });

    hostUser = await prisma.user.create({
      data: {
        name: 'Booking Host User',
        email: 'bk_host@test.com',
        phone: '+919999111002',
        passwordHash: hash,
        role: UserRole.HOST,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
      },
    });

    guestUser = await prisma.user.create({
      data: {
        name: 'Booking Guest User',
        email: 'bk_guest@test.com',
        phone: '+919999111003',
        passwordHash: hash,
        role: UserRole.USER,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
      },
    });

    testProperty = await prisma.property.create({
      data: {
        title: 'Emerald Bay Manor',
        description: 'Luxury manor in Goa for e2e tests',
        slug: 'emerald-bay-manor-e2e',
        category: 'Villa',
        propertyType: 'Entire Villa',
        listingPurpose: 'Rent',
        address: 'Beach Road 12',
        locality: 'Baga',
        city: 'Goa',
        state: 'Goa',
        country: 'India',
        pincode: 403516,
        maxGuests: 6,
        bedrooms: 3,
        beds: 3,
        bathrooms: 3,
        basePrice: 10000,
        instantBook: true,
        totalStock: 1,
        minNights: 1,
        cancellationPolicy: 'FLEXIBLE',
        images: [],
        gallery: [],
        listingExtras: {},
        status: 'PUBLISHED',
        verificationStatus: 'APPROVED',
        hostId: hostUser.id,
      },
    });

    activeBooking = await prisma.booking.create({
      data: {
        propertyId: testProperty.id,
        guestId: guestUser.id,
        checkIn: new Date('2026-10-10T00:00:00.000Z'),
        checkOut: new Date('2026-10-12T00:00:00.000Z'),
        totalAmount: 20000,
        guests: 2,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        bookingType: 'instant',
        source: 'Web',
      },
    });

    cancelledBooking = await prisma.booking.create({
      data: {
        propertyId: testProperty.id,
        guestId: guestUser.id,
        checkIn: new Date('2026-11-01T00:00:00.000Z'),
        checkOut: new Date('2026-11-03T00:00:00.000Z'),
        totalAmount: 20000,
        guests: 2,
        status: 'CANCELLED',
        paymentStatus: 'PAID',
        cancellation: { reason: 'Guest cancelled early', cancelledBy: 'USER' },
      },
    });

    // Authenticate Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bk_admin@test.com', password: 'Password123!' })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    // Authenticate Host
    const hostLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bk_host@test.com', password: 'Password123!' })
      .expect(200);
    hostToken = hostLogin.body.accessToken;

    // Authenticate Guest User
    const guestLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bk_guest@test.com', password: 'Password123!' })
      .expect(200);
    guestToken = guestLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.refund.deleteMany({ where: { bookingId: { in: [activeBooking.id, cancelledBooking.id] } } });
    await prisma.booking.deleteMany({ where: { guestId: guestUser.id } });
    await prisma.property.deleteMany({ where: { hostId: hostUser.id } });
    await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, hostUser.id, guestUser.id] } } });
    await app.close();
  });

  describe('Authorization Guard Enforcement', () => {
    it('returns 401 Unauthorized for unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/admin/bookings').expect(401);
      await request(app.getHttpServer()).get('/admin/bookings/summary').expect(401);
      await request(app.getHttpServer()).get('/admin/refunds').expect(401);
    });

    it('returns 403 Forbidden for USER and HOST roles', async () => {
      await request(app.getHttpServer())
        .get('/admin/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/admin/bookings')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(403);
    });

    it('allows ADMIN role requests', async () => {
      await request(app.getHttpServer())
        .get('/admin/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('GET /admin/bookings (List, Pagination, Filtering, Sorting, Search)', () => {
    it('returns paginated list of bookings with safe relations', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/bookings?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);

      const bookingItem = res.body.data.find((b: any) => b.id === activeBooking.id);
      expect(bookingItem).toBeDefined();
      expect(bookingItem.guest).toBeDefined();
      expect(bookingItem.guest.passwordHash).toBeUndefined(); // Safe user check
      expect(bookingItem.property).toBeDefined();
    });

    it('filters bookings by status and city', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/bookings?status=CONFIRMED&city=Goa')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((b: any) => b.status === 'CONFIRMED')).toBe(true);
    });

    it('searches bookings by guest name or property title', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/bookings?search=Emerald')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].property.title).toContain('Emerald');
    });
  });

  describe('GET /admin/bookings/summary', () => {
    it('returns aggregated metrics and revenue totals', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/bookings/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.totalBookings).toBeDefined();
      expect(typeof res.body.totalBookings).toBe('number');
      expect(typeof res.body.totalRevenue).toBe('number');
      expect(typeof res.body.totalRefunded).toBe('number');
    });
  });

  describe('GET /admin/bookings/cancelled', () => {
    it('returns only cancelled bookings', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/bookings/cancelled')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((b: any) => b.status === 'CANCELLED')).toBe(true);
    });
  });

  describe('GET /admin/bookings/:id', () => {
    it('returns 404 for non-existent booking ID', async () => {
      await request(app.getHttpServer())
        .get('/admin/bookings/non-existent-uuid-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('returns single booking details with host and property info', async () => {
      const res = await request(app.getHttpServer())
        .get(`/admin/bookings/${activeBooking.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(activeBooking.id);
      expect(res.body.guest.email).toBe('bk_guest@test.com');
      expect(res.body.property.host.email).toBe('bk_host@test.com');
    });
  });

  describe('PATCH /admin/bookings/:id/status', () => {
    it('updates booking status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/bookings/${activeBooking.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
    });

    it('rejects invalid status transitions', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/bookings/${activeBooking.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PENDING' })
        .expect(400);
    });
  });

  describe('PATCH /admin/bookings/:id/cancel', () => {
    it('cancels an active booking with reason', async () => {
      // First set booking back to CONFIRMED
      await prisma.booking.update({ where: { id: activeBooking.id }, data: { status: 'CONFIRMED' } });

      const res = await request(app.getHttpServer())
        .patch(`/admin/bookings/${activeBooking.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Admin emergency cancellation' })
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
      expect(res.body.cancellation.reason).toBe('Admin emergency cancellation');
      expect(res.body.cancellation.cancelledBy).toBe('ADMIN');
    });

    it('returns 409 Conflict if booking is already cancelled', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/bookings/${activeBooking.id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Try cancel again' })
        .expect(409);
    });
  });

  describe('REFUNDS LIFECYCLE (Request, List, Process, Fail)', () => {
    let createdRefundId: string;

    it('validates refund amount cannot exceed booking total amount', async () => {
      await request(app.getHttpServer())
        .post(`/admin/bookings/${activeBooking.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 999999, reason: 'Excessive refund' })
        .expect(400);
    });

    it('creates a valid refund request (POST /admin/bookings/:id/refund)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/admin/bookings/${activeBooking.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 5000, reason: 'Partial admin refund' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.amount).toBe(5000);
      expect(res.body.status).toBe('PENDING');
      createdRefundId = res.body.id;
    });

    it('prevents duplicate active refund requests on same booking', async () => {
      await request(app.getHttpServer())
        .post(`/admin/bookings/${activeBooking.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 1000, reason: 'Duplicate refund request' })
        .expect(409);
    });

    it('lists refunds with pagination & filter (GET /admin/refunds)', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/refunds?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.some((r: any) => r.id === createdRefundId)).toBe(true);
    });

    it('gets refund details by ID (GET /admin/refunds/:id)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/admin/refunds/${createdRefundId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdRefundId);
      expect(res.body.booking).toBeDefined();
    });

    it('processes refund to COMPLETED (PATCH /admin/refunds/:id/process)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/refunds/${createdRefundId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');

      // Verify booking payment status updated to PARTIALLY_REFUNDED
      const updatedBooking = await prisma.booking.findUnique({ where: { id: activeBooking.id } });
      expect(updatedBooking?.paymentStatus).toBe('PARTIALLY_REFUNDED');
      expect(updatedBooking?.refundStatus).toBe('PARTIAL');
    });

    it('fails a new refund request with reason (PATCH /admin/refunds/:id/fail)', async () => {
      // Create a second refund request
      const refundRes = await request(app.getHttpServer())
        .post(`/admin/bookings/${activeBooking.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 1000, reason: 'Test fail refund' })
        .expect(201);

      const failRes = await request(app.getHttpServer())
        .patch(`/admin/refunds/${refundRes.body.id}/fail`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Bank rejected transfer' })
        .expect(200);

      expect(failRes.body.status).toBe('FAILED');
      expect(failRes.body.failureReason).toBe('Bank rejected transfer');
    });
  });
});
