import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { BookingsService } from '../src/bookings/bookings.service.js';
import { PaymentsService } from '../src/payments/payments.service.js';
import { CouponsService } from '../src/coupons/coupons.service.js';
import * as bcrypt from 'bcrypt';

describe('Coupon Release on Expiry and Payment Failure E2E Test', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let bookingsService: BookingsService;
  let paymentsService: PaymentsService;
  let couponsService: CouponsService;

  let guestId: string;
  let hostId: string;
  let adminId: string;
  let propertyId: string;
  let createdTestProperty = false;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    bookingsService = moduleRef.get(BookingsService);
    paymentsService = moduleRef.get(PaymentsService);
    couponsService = moduleRef.get(CouponsService);

    const testEmails = [
      'coupon_rel_guest@fairbnb.test',
      'coupon_rel_host@fairbnb.test',
      'coupon_rel_admin@fairbnb.test',
    ];
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: testEmails } },
    });
    if (existingUsers.length > 0) {
      const uIds = existingUsers.map((u) => u.id);
      await prisma.booking.deleteMany({ where: { guestId: { in: uIds } } });
      await prisma.property.deleteMany({ where: { hostId: { in: uIds } } });
      await prisma.user.deleteMany({ where: { id: { in: uIds } } });
    }

    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const host = await prisma.user.create({
      data: {
        name: 'Coupon Release Host',
        email: 'coupon_rel_host@fairbnb.test',
        phone: '9991112221',
        passwordHash,
        role: 'HOST',
        isActive: true,
      },
    });
    hostId = host.id;

    const guest = await prisma.user.create({
      data: {
        name: 'Coupon Release Guest',
        email: 'coupon_rel_guest@fairbnb.test',
        phone: '9991112222',
        passwordHash,
        role: 'USER',
        isActive: true,
      },
    });
    guestId = guest.id;

    const admin = await prisma.user.create({
      data: {
        name: 'Coupon Release Admin',
        email: 'coupon_rel_admin@fairbnb.test',
        phone: '9991112223',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    adminId = admin.id;

    let property = await prisma.property.findFirst({
      where: { status: 'PUBLISHED', verificationStatus: 'APPROVED' },
    });

    if (!property) {
      property = await prisma.property.create({
        data: {
          title: 'Coupon Release Test Villa',
          description: 'Test Property for Coupon Release',
          slug: 'coupon-release-villa-' + Date.now(),
          category: 'Villa',
          propertyType: 'Entire Villa',
          listingPurpose: 'Rental',
          address: '100 Beach Road',
          city: 'Goa',
          state: 'Goa',
          country: 'India',
          pincode: 403516,
          latitude: 15.5,
          longitude: 73.7,
          maxGuests: 4,
          bedrooms: 2,
          beds: 2,
          bathrooms: 2,
          basePrice: 2000,
          cleaningFee: 200,
          serviceFeeRate: 0.1,
          taxRate: 0.18,
          instantBook: true,
          totalStock: 1,
          minNights: 1,
          cancellationPolicy: 'FLEXIBLE',
          images: [],
          gallery: [],
          listingExtras: {},
          status: 'PUBLISHED',
          verificationStatus: 'APPROVED',
          hostId: host.id,
        },
      });
      createdTestProperty = true;
    }
    propertyId = property.id;
    await prisma.property.update({
      where: { id: propertyId },
      data: { minNights: 1, basePrice: 2000 },
    });
  }, 30000);

  afterAll(async () => {
    const testCodes = [
      'LIMIT1RELTEST',
      'AUTOEXPIRE1TEST',
      'HOSTCANCELTEST',
      'ADMINCANCELTEST',
      'GUESTCANCELTEST',
    ];
    await prisma.refund.deleteMany({
      where: { booking: { couponCode: { in: testCodes } } },
    });
    await prisma.booking.deleteMany({
      where: { couponCode: { in: testCodes } },
    });
    await prisma.coupon.deleteMany({
      where: { code: { in: testCodes } },
    });
    if (createdTestProperty && propertyId) {
      await prisma.property.deleteMany({ where: { id: propertyId } });
    }
    if (guestId || hostId || adminId) {
      await prisma.user.deleteMany({
        where: { id: { in: [guestId, hostId, adminId].filter(Boolean) } },
      });
    }
    await moduleRef.close();
  });

  it('Payment failed webhook releases coupon and is idempotent on duplicate delivery', async () => {
    const couponCode = 'LIMIT1RELTEST';

    // 1. Create a coupon with usageLimit: 1
    await prisma.coupon.deleteMany({ where: { code: couponCode } });
    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'FLAT',
        discountValue: 300,
        minOrderAmount: 1000,
        usageLimit: 1,
        timesUsed: 0,
        validFrom: new Date(Date.now() - 1000 * 60),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isActive: true,
      },
    });

    // 2. Create a PENDING booking using it
    const bookingRes1 = await bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: new Date(Date.UTC(2035, 1, 1, 14, 0, 0)).toISOString(),
      checkOut: new Date(Date.UTC(2035, 1, 3, 10, 0, 0)).toISOString(),
      guests: 2,
      couponCode,
    });

    // timesUsed becomes 1
    let coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(coupon!.timesUsed).toBe(1);

    // Attempting a second booking with this coupon should fail
    await expect(
      bookingsService.createGuestBooking(guestId, {
        propertyId,
        checkIn: new Date(Date.UTC(2035, 1, 5, 14, 0, 0)).toISOString(),
        checkOut: new Date(Date.UTC(2035, 1, 7, 10, 0, 0)).toISOString(),
        guests: 2,
        couponCode,
      }),
    ).rejects.toThrow(/usage limit/i);

    // 3. Simulate a payment.failed webhook for that booking
    const webhookPayload = {
      event: 'payment.failed',
      payload: {
        providerOrderId: bookingRes1.payment.providerOrderId,
        failureReason: 'Card was declined by issuing bank',
      },
      signature: 'valid_mock_signature',
    };

    const webhookRes1 =
      (await paymentsService.handleWebhook(webhookPayload)) as any;
    expect(webhookRes1.success).toBe(false);
    expect(webhookRes1.booking.status).toBe('EXPIRED');
    expect(webhookRes1.payment.status).toBe('FAILED');

    // 4. Assert timesUsed is back to 0
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    expect(coupon!.timesUsed).toBe(0);

    // AND a NEW booking with the same coupon can now succeed!
    const bookingRes2 = await bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: new Date(Date.UTC(2035, 1, 10, 14, 0, 0)).toISOString(),
      checkOut: new Date(Date.UTC(2035, 1, 12, 10, 0, 0)).toISOString(),
      guests: 2,
      couponCode,
    });

    expect(bookingRes2.booking.couponCode).toBe(couponCode);
    expect(bookingRes2.booking.discountAmount).toBe(300);

    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    expect(coupon!.timesUsed).toBe(1);

    // 5. Fire the SAME webhook payload a second time (idempotency test)
    const webhookRes2 = await paymentsService.handleWebhook(webhookPayload);
    expect(webhookRes2.success).toBe(false);

    // Assert timesUsed stays at 1 (or >= 0, never negative or erroneously decremented)
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    expect(coupon!.timesUsed).toBe(1);
  });

  it('autoExpirePendingBookings expires stale bookings past expiresAt and releases coupons in batch', async () => {
    const couponCode = 'AUTOEXPIRE1TEST';

    // 1. Create a coupon with usageLimit: 2
    await prisma.coupon.deleteMany({ where: { code: couponCode } });
    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'FLAT',
        discountValue: 400,
        minOrderAmount: 1000,
        usageLimit: 2,
        timesUsed: 0,
        validFrom: new Date(Date.now() - 1000 * 60),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isActive: true,
      },
    });

    // 2. Create 2 bookings using the coupon
    const booking1 = await bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: new Date(Date.UTC(2036, 2, 1, 14, 0, 0)).toISOString(),
      checkOut: new Date(Date.UTC(2036, 2, 3, 10, 0, 0)).toISOString(),
      guests: 2,
      couponCode,
    });

    const booking2 = await bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: new Date(Date.UTC(2036, 2, 5, 14, 0, 0)).toISOString(),
      checkOut: new Date(Date.UTC(2036, 2, 7, 10, 0, 0)).toISOString(),
      guests: 2,
      couponCode,
    });

    let coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(coupon!.timesUsed).toBe(2);

    // 3. Mark both bookings as expired in the past
    const pastDate = new Date(Date.now() - 5 * 60 * 1000);
    await prisma.booking.updateMany({
      where: { id: { in: [booking1.booking.id, booking2.booking.id] } },
      data: { expiresAt: pastDate },
    });

    // 4. Run autoExpirePendingBookings
    const expireResult = await bookingsService.autoExpirePendingBookings();
    expect(expireResult.count).toBeGreaterThanOrEqual(2);

    // 5. Verify both bookings are now EXPIRED
    const expiredBookings = await prisma.booking.findMany({
      where: { id: { in: [booking1.booking.id, booking2.booking.id] } },
    });
    for (const b of expiredBookings) {
      expect(b.status).toBe('EXPIRED');
    }

    // 6. Verify coupon timesUsed was batch-decremented by 2 back to 0
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    expect(coupon!.timesUsed).toBe(0);

    // 7. Verify a new booking with this coupon can now be created
    const newBooking = await bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: new Date(Date.UTC(2036, 2, 10, 14, 0, 0)).toISOString(),
      checkOut: new Date(Date.UTC(2036, 2, 12, 10, 0, 0)).toISOString(),
      guests: 2,
      couponCode,
    });
    expect(newBooking.booking.couponCode).toBe(couponCode);
    expect(newBooking.booking.discountAmount).toBe(400);

    coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    expect(coupon!.timesUsed).toBe(1);
  });

  it('Host cancels a confirmed booking that used a coupon -> timesUsed decrements, refund status uses uppercase COMPLETED', async () => {
    const couponCode = 'HOSTCANCELTEST';

    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        usageLimit: 5,
        timesUsed: 0,
        validFrom: new Date(Date.now() - 1000 * 60),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isActive: true,
      },
    });

    const bookingRes = await bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: new Date(Date.UTC(2036, 5, 1, 14, 0, 0)).toISOString(),
      checkOut: new Date(Date.UTC(2036, 5, 4, 10, 0, 0)).toISOString(),
      guests: 2,
      couponCode,
    });

    let coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(coupon!.timesUsed).toBe(1);

    await prisma.booking.update({
      where: { id: bookingRes.booking.id },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
    });

    const prop = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    const cancelledBooking = await bookingsService.hostCancelBooking(
      prop!.hostId,
      bookingRes.booking.id,
      'Host maintenance issue',
    );

    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(coupon!.timesUsed).toBe(0);

    expect(cancelledBooking.status).toBe('CANCELLED');
    expect(cancelledBooking.refundStatus).toBe('FULL');

    const refund = await prisma.refund.findFirst({
      where: { bookingId: bookingRes.booking.id },
    });
    expect(refund).toBeDefined();
    expect(refund!.status).toBe('COMPLETED');
  });

  it('Admin cancels a confirmed booking that used a coupon -> timesUsed decrements, refund status uses uppercase PENDING', async () => {
    const couponCode = 'ADMINCANCELTEST';

    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        usageLimit: 5,
        timesUsed: 0,
        validFrom: new Date(Date.now() - 1000 * 60),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isActive: true,
      },
    });

    const bookingRes = await bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: new Date(Date.UTC(2036, 5, 10, 14, 0, 0)).toISOString(),
      checkOut: new Date(Date.UTC(2036, 5, 14, 10, 0, 0)).toISOString(),
      guests: 2,
      couponCode,
    });

    let coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(coupon!.timesUsed).toBe(1);

    await prisma.booking.update({
      where: { id: bookingRes.booking.id },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
    });

    const cancelledBooking = await bookingsService.cancelBooking(
      bookingRes.booking.id,
      { reason: 'Admin platform intervention' },
      adminId,
    );

    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(coupon!.timesUsed).toBe(0);

    expect(cancelledBooking.status).toBe('CANCELLED');
    expect(cancelledBooking.refundStatus).toBe('PENDING');
  });

  it('Guest cancels a confirmed booking that used a coupon -> refund created, but timesUsed does NOT change (stays consumed)', async () => {
    const couponCode = 'GUESTCANCELTEST';

    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        usageLimit: 5,
        timesUsed: 0,
        validFrom: new Date(Date.now() - 1000 * 60),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isActive: true,
      },
    });

    const bookingRes = await bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: new Date(Date.UTC(2036, 5, 20, 14, 0, 0)).toISOString(),
      checkOut: new Date(Date.UTC(2036, 5, 24, 10, 0, 0)).toISOString(),
      guests: 2,
      couponCode,
    });

    let coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(coupon!.timesUsed).toBe(1);

    await prisma.booking.update({
      where: { id: bookingRes.booking.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentId: 'pay_guest_mock_cancellation',
      },
    });

    const cancelResult = await bookingsService.cancelBookingByGuest(
      bookingRes.booking.id,
      { reason: 'Guest change of travel plans' },
      guestId,
    );

    // Assert coupon's timesUsed did NOT change (stays consumed = 1) to prevent book->discount->cancel->rebook farming loophole
    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(coupon!.timesUsed).toBe(1);

    expect(cancelResult.booking.status).toBe('CANCELLED');
    expect(cancelResult.booking.refundStatus).toBe('FULL');
    expect(cancelResult.refund).toBeDefined();
    expect(cancelResult.refund.status).toBe('COMPLETED');
  });

  it('Refund status casing is consistent across all three paths (assert exact string, not case-insensitive match)', async () => {
    // Query refunds for all three cancelled coupon bookings
    const hostBooking = await prisma.booking.findFirst({
      where: { couponCode: 'HOSTCANCELTEST' },
      include: { refunds: true },
    });
    const adminBooking = await prisma.booking.findFirst({
      where: { couponCode: 'ADMINCANCELTEST' },
      include: { refunds: true },
    });
    const guestBooking = await prisma.booking.findFirst({
      where: { couponCode: 'GUESTCANCELTEST' },
      include: { refunds: true },
    });

    expect(hostBooking).toBeDefined();
    expect(adminBooking).toBeDefined();
    expect(guestBooking).toBeDefined();

    // 1. Host Cancellation assertions
    expect(hostBooking!.status).toBe('CANCELLED');
    expect(hostBooking!.refundStatus).toBe('FULL');
    expect(hostBooking!.refunds.length).toBeGreaterThanOrEqual(1);
    expect(hostBooking!.refunds[0].status).toBe('COMPLETED');
    expect(hostBooking!.refunds[0].status).not.toBe('completed');
    expect(hostBooking!.refunds[0].status).not.toBe('Pending');

    // 2. Admin Cancellation assertions
    expect(adminBooking!.status).toBe('CANCELLED');
    expect(adminBooking!.refundStatus).toBe('PENDING');
    expect(adminBooking!.refundStatus).not.toBe('pending');

    // 3. Guest Cancellation assertions
    expect(guestBooking!.status).toBe('CANCELLED');
    expect(guestBooking!.refundStatus).toBe('FULL');
    expect(guestBooking!.refunds.length).toBeGreaterThanOrEqual(1);
    expect(guestBooking!.refunds[0].status).toBe('COMPLETED');
    expect(guestBooking!.refunds[0].status).not.toBe('completed');
  });
});
