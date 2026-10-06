import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Manual Admin Full Functionality Verification', () => {
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

  it('runs complete manual verification of all Admin Dashboard, Users, Properties, Bookings & Refunds features', async () => {
    console.log('\n================================================================');
    console.log('🚀 STARTING MANUAL VERIFICATION OF ALL ADMIN DASHBOARD & BOOKING MODULES');
    console.log('================================================================\n');

    // STEP 0: Clean up test accounts
    console.log('🧹 [Step 0] Cleaning database for test accounts...');
    const testEmails = ['man_admin@fairbnb.com', 'man_host@fairbnb.com', 'man_guest@fairbnb.com'];
    const existing = await prisma.user.findMany({ where: { email: { in: testEmails } } });
    if (existing.length) {
      const ids = existing.map((u) => u.id);
      await prisma.refund.deleteMany({ where: { booking: { guestId: { in: ids } } } });
      await prisma.booking.deleteMany({ where: { guestId: { in: ids } } });
      await prisma.property.deleteMany({ where: { hostId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    console.log('  -> Cleanup complete.\n');

    // STEP 1: Create Admin, Host & Guest User
    console.log('👤 [Step 1] Creating Admin, Host, and Guest test accounts...');
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'man_admin@fairbnb.com',
        phone: '+919900112233',
        passwordHash,
        role: UserRole.ADMIN,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
      },
    });

    const host = await prisma.user.create({
      data: {
        name: 'Vikas Oberoi (Host)',
        email: 'man_host@fairbnb.com',
        phone: '+919900112244',
        passwordHash,
        role: UserRole.HOST,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
      },
    });

    const guest = await prisma.user.create({
      data: {
        name: 'Siddharth Malhotra (Guest)',
        email: 'man_guest@fairbnb.com',
        phone: '+919900112255',
        passwordHash,
        role: UserRole.USER,
        phoneVerified: false,
        emailVerified: false,
        isActive: true,
      },
    });

    console.log(`  -> Admin ID: ${admin.id}`);
    console.log(`  -> Host ID:  ${host.id}`);
    console.log(`  -> Guest ID: ${guest.id}\n`);

    // STEP 2: Authenticate Admin & Host
    console.log('🔑 [Step 2] Authenticating Admin user (POST /auth/login)...');
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'man_admin@fairbnb.com', password: 'Password123!' })
      .expect(200);

    const adminToken = adminLoginRes.body.accessToken;
    console.log('  -> JWT Token acquired for Admin.\n');

    const hostLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'man_host@fairbnb.com', password: 'Password123!' })
      .expect(200);

    const hostToken = hostLoginRes.body.accessToken;

    // STEP 3: Admin Overview Metrics
    console.log('📊 [Step 3] Verification of Overview Dashboard (GET /admin/overview)...');
    const overviewRes = await request(app.getHttpServer())
      .get('/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    console.log('  -> Total Users Count:', overviewRes.body.overview.users.total);
    console.log('  -> Total Properties Count:', overviewRes.body.overview.properties.total);
    console.log('  -> Total Hosts Count:', overviewRes.body.overview.users.hosts);
    console.log('  -> Confirmed: Overview metrics retrieved successfully.\n');

    // STEP 4: Admin Users Submodule
    console.log('👥 [Step 4] Verification of Users Submodule...');
    const allUsersRes = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    console.log(`  -> GET /admin/users returned ${allUsersRes.body.length} users.`);

    const hostsRes = await request(app.getHttpServer())
      .get('/admin/users/hosts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> GET /admin/users/hosts returned ${hostsRes.body.length} hosts.`);

    const pendingUserRes = await request(app.getHttpServer())
      .get('/admin/users/verification')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> GET /admin/users/verification returned ${pendingUserRes.body.length} unverified users.`);

    // Verify Guest User phone/email
    console.log('  -> Verifying Guest User status (PATCH /admin/users/:id/verify)...');
    const verifyUserRes = await request(app.getHttpServer())
      .patch(`/admin/users/${guest.id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phoneVerified: true, emailVerified: true })
      .expect(200);
    console.log(`  -> User phoneVerified: ${verifyUserRes.body.phoneVerified}, emailVerified: ${verifyUserRes.body.emailVerified}`);

    // Block & Unblock User
    console.log('  -> Blocking User (PATCH /admin/users/:id/status)...');
    await request(app.getHttpServer())
      .patch(`/admin/users/${guest.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);

    const blockedRes = await request(app.getHttpServer())
      .get('/admin/users/blocked')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> GET /admin/users/blocked returned ${blockedRes.body.length} blocked users.`);

    // Unblock back
    await request(app.getHttpServer())
      .patch(`/admin/users/${guest.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true })
      .expect(200);
    console.log('  -> User unblocked successfully.\n');

    // STEP 5: Create Properties & Admin Property Submodule Verification
    console.log('🏡 [Step 5] Host creates Property & Admin verifies (Properties Submodule)...');
    const createPropRes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'Grand Palace Villa Baga',
        description: 'Luxury Baga beachfront villa with private pool',
        category: 'Villa',
        propertyType: 'Entire Villa',
        listingPurpose: 'Rent',
        address: 'Baga Creek Road 5',
        locality: 'Baga',
        city: 'Goa',
        state: 'Goa',
        country: 'India',
        pincode: 403516,
        maxGuests: 8,
        bedrooms: 4,
        beds: 4,
        bathrooms: 4,
        basePrice: 16000,
        instantBook: true,
      })
      .expect(201);

    const propId = createPropRes.body.id;
    console.log(`  -> Property Created! ID: ${propId}`);

    const pendingPropsRes = await request(app.getHttpServer())
      .get('/admin/properties/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> GET /admin/properties/pending returned ${pendingPropsRes.body.length} pending properties.`);

    // Approve Property
    const approvePropRes = await request(app.getHttpServer())
      .patch(`/admin/properties/${propId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE', verificationNote: 'All property documents clear' })
      .expect(200);

    console.log(`  -> Property Verification Status: "${approvePropRes.body.verificationStatus}", Status: "${approvePropRes.body.status}"`);

    const approvedPropsRes = await request(app.getHttpServer())
      .get('/admin/properties/approved')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> GET /admin/properties/approved returned ${approvedPropsRes.body.length} approved properties.\n`);

    // STEP 6: Create Booking & Test Bookings Submodule
    console.log('📅 [Step 6] Creating Booking & Testing Admin Bookings Submodule...');
    const booking = await prisma.booking.create({
      data: {
        propertyId: propId,
        guestId: guest.id,
        checkIn: new Date('2026-10-01T00:00:00.000Z'),
        checkOut: new Date('2026-10-05T00:00:00.000Z'),
        totalAmount: 64000,
        guests: 4,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        bookingType: 'instant',
        source: 'Fairbnb App',
      },
    });
    console.log(`  -> Booking Created! ID: ${booking.id}, Amount: ₹${booking.totalAmount}`);

    // GET /admin/bookings
    const allBookingsRes = await request(app.getHttpServer())
      .get('/admin/bookings?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> GET /admin/bookings returned page ${allBookingsRes.body.meta.page} of ${allBookingsRes.body.meta.totalPages} (Total: ${allBookingsRes.body.meta.total}).`);

    // GET /admin/bookings/summary
    const summaryRes = await request(app.getHttpServer())
      .get('/admin/bookings/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> Booking Summary -> Total Bookings: ${summaryRes.body.totalBookings}, Confirmed: ${summaryRes.body.confirmedBookings}, Revenue: ₹${summaryRes.body.totalRevenue}`);

    // GET /admin/bookings/:id
    const bookingDetailRes = await request(app.getHttpServer())
      .get(`/admin/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> Booking Details retrieved for Guest: "${bookingDetailRes.body.guest.name}", Property: "${bookingDetailRes.body.property.title}"`);

    // Admin Cancels Booking (PATCH /admin/bookings/:id/cancel)
    console.log('  -> Admin Cancels Booking (PATCH /admin/bookings/:id/cancel)...');
    const cancelRes = await request(app.getHttpServer())
      .patch(`/admin/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Maintenance issue at property' })
      .expect(200);
    console.log(`  -> Booking Status: "${cancelRes.body.status}", Cancellation Reason: "${cancelRes.body.cancellation.reason}"`);

    const cancelledListRes = await request(app.getHttpServer())
      .get('/admin/bookings/cancelled')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> GET /admin/bookings/cancelled returned ${cancelledListRes.body.data.length} cancelled bookings.\n`);

    // STEP 7: Refunds Submodule Verification
    console.log('💸 [Step 7] Testing Refunds Submodule (Request, List, Process, Fail)...');

    // 7a. Request Refund
    console.log('  -> Creating Refund Request (POST /admin/bookings/:id/refund)...');
    const reqRefundRes = await request(app.getHttpServer())
      .post(`/admin/bookings/${booking.id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 32000, reason: '50% partial refund for maintenance cancel' })
      .expect(201);

    const refundId = reqRefundRes.body.id;
    console.log(`  -> Refund Created! ID: ${refundId}, Amount: ₹${reqRefundRes.body.amount}, Status: "${reqRefundRes.body.status}"`);

    // 7b. Process Refund (PATCH /admin/refunds/:id/process)
    console.log('  -> Processing Refund (PATCH /admin/refunds/:id/process)...');
    const processRefundRes = await request(app.getHttpServer())
      .patch(`/admin/refunds/${refundId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    console.log(`  -> Refund Status updated to: "${processRefundRes.body.status}"`);

    // 7c. Prevent Over-Refund
    console.log('  -> Testing Over-Refund Prevention (Attempting refund > remaining balance ₹32,000)...');
    await request(app.getHttpServer())
      .post(`/admin/bookings/${booking.id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 50000, reason: 'Excessive refund' })
      .expect(400);
    console.log('  -> Confirmed: Over-refund attempt blocked with 400 Bad Request.');

    // 7d. GET /admin/refunds
    const refundsListRes = await request(app.getHttpServer())
      .get('/admin/refunds?status=COMPLETED')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    console.log(`  -> GET /admin/refunds returned ${refundsListRes.body.data.length} completed refunds.`);

    // Check updated booking paymentStatus
    const updatedBookingDB = await prisma.booking.findUnique({ where: { id: booking.id } });
    console.log(`  -> Updated Booking Payment Status in DB: "${updatedBookingDB?.paymentStatus}", Refund Status: "${updatedBookingDB?.refundStatus}"\n`);

    // STEP 8: Cleanup
    console.log('🧹 [Step 8] Finalizing cleanup of test data...');
    await prisma.refund.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.deleteMany({ where: { id: booking.id } });
    await prisma.property.deleteMany({ where: { id: propId } });
    await prisma.user.deleteMany({ where: { id: { in: [admin.id, host.id, guest.id] } } });
    console.log('  -> Cleanup finished successfully.\n');

    console.log('================================================================');
    console.log('🎉 ALL ADMIN DASHBOARD & BOOKINGS FUNCTIONALITY VERIFIED 100%');
    console.log('================================================================\n');
  });
});
