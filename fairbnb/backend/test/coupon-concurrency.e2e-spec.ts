import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { BookingsService } from '../src/bookings/bookings.service.js';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

type BookingResult = {
  booking: {
    id: string;
    discountAmount: number;
    couponCode: string | null;
  };
};

describe('Coupon Concurrency and Atomic Redemption Test', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let bookingsService: BookingsService;

  let guestId: string;
  let hostId: string;
  let propertyId: string;
  let createdTestProperty = false;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    bookingsService = moduleRef.get(BookingsService);

    // Clean up test data
    await prisma.booking.deleteMany({
      where: { couponCode: { in: ['LIMIT5TEST', 'LIMIT5SAMEDATES'] } },
    });
    await prisma.coupon.deleteMany({
      where: { code: { in: ['LIMIT5TEST', 'LIMIT5SAMEDATES'] } },
    });

    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['coupon_guest@fairbnb.test', 'coupon_host@fairbnb.test'],
        },
      },
    });
    if (testUsers.length > 0) {
      const uIds = testUsers.map((u) => u.id);
      await prisma.property.deleteMany({ where: { hostId: { in: uIds } } });
      await prisma.user.deleteMany({ where: { id: { in: uIds } } });
    }

    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const host = await prisma.user.create({
      data: {
        name: 'Coupon Test Host',
        email: 'coupon_host@fairbnb.test',
        phone: '9998887771',
        passwordHash,
        role: 'HOST',
        isActive: true,
      },
    });
    hostId = host.id;

    const guest = await prisma.user.create({
      data: {
        name: 'Coupon Test Guest',
        email: 'coupon_guest@fairbnb.test',
        phone: '9998887772',
        passwordHash,
        role: 'USER',
        isActive: true,
      },
    });
    guestId = guest.id;

    let property = await prisma.property.findFirst({
      where: { status: 'PUBLISHED', verificationStatus: 'APPROVED' },
    });

    if (!property) {
      property = await prisma.property.create({
        data: {
          title: 'Coupon Concurrency Test Villa',
          description: 'Test Property for Coupon Concurrency',
          slug: 'coupon-test-villa-' + Date.now(),
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
    // Cleanup
    await prisma.booking.deleteMany({
      where: { couponCode: { in: ['LIMIT5TEST', 'LIMIT5SAMEDATES'] } },
    });
    await prisma.coupon.deleteMany({
      where: { code: { in: ['LIMIT5TEST', 'LIMIT5SAMEDATES'] } },
    });
    if (createdTestProperty && propertyId) {
      await prisma.property.deleteMany({ where: { id: propertyId } });
    }
    if (guestId || hostId) {
      await prisma.user.deleteMany({
        where: { id: { in: [guestId, hostId].filter(Boolean) } },
      });
    }
    await moduleRef.close();
  });

  it('Scenario 1: 20 concurrent bookings on available dates - exactly 5 succeed and 15 fail with usage limit reached', async () => {
    // 1. Create a coupon with usageLimit: 5
    const couponCode = 'LIMIT5TEST';
    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'FLAT',
        discountValue: 500,
        minOrderAmount: 1000,
        usageLimit: 5,
        timesUsed: 0,
        validFrom: new Date(Date.now() - 1000 * 60),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isActive: true,
      },
    });

    // 2. Prepare 20 requests with 20 distinct non-overlapping dates so availability check passes
    const requests = Array.from({ length: 20 }, (_, i) => {
      const start = new Date(Date.UTC(2030, 0, 1 + i * 3, 14, 0, 0));
      const end = new Date(Date.UTC(2030, 0, 1 + i * 3 + 2, 10, 0, 0));
      const checkIn = start.toISOString();
      const checkOut = end.toISOString();

      return bookingsService.createGuestBooking(guestId, {
        propertyId,
        checkIn,
        checkOut,
        guests: 2,
        couponCode,
      });
    });

    // 3. Fire all 20 requests concurrently via Promise.allSettled
    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled',
    );
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    console.log(
      `Concurrent results: ${fulfilled.length} fulfilled, ${rejected.length} rejected`,
    );

    // Verify exactly 5 succeeded
    expect(fulfilled.length).toBe(5);
    expect(rejected.length).toBe(15);

    // Verify all 5 fulfilled bookings received the discount
    for (const res of fulfilled) {
      const val = res.value as unknown as BookingResult;
      expect(val.booking.discountAmount).toBe(500);
      expect(val.booking.couponCode).toBe(couponCode);
    }

    // Verify all 15 rejected requests failed with coupon usage limit error
    for (const rej of rejected) {
      const err = rej.reason as Error;
      expect(err.message).toMatch(
        /Coupon usage limit reached|Coupon code usage limit exceeded/,
      );
    }

    // Verify coupon timesUsed is exactly 5 and never exceeded usageLimit
    const updatedCoupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(updatedCoupon).toBeDefined();
    expect(updatedCoupon!.timesUsed).toBe(5);
    expect(updatedCoupon!.timesUsed).toBeLessThanOrEqual(
      updatedCoupon!.usageLimit,
    );
  });

  it('Scenario 2: 20 concurrent bookings on the EXACT same dates - exactly 5 succeed and timesUsed never exceeds usageLimit', async () => {
    const couponCode = 'LIMIT5SAMEDATES';
    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxDiscountAmount: 1000,
        minOrderAmount: 1000,
        usageLimit: 5,
        timesUsed: 0,
        validFrom: new Date(Date.now() - 1000 * 60),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isActive: true,
      },
    });

    const checkIn = new Date('2031-05-10T14:00:00.000Z').toISOString();
    const checkOut = new Date('2031-05-15T10:00:00.000Z').toISOString();

    const requests = Array.from({ length: 20 }, () =>
      bookingsService.createGuestBooking(guestId, {
        propertyId,
        checkIn,
        checkOut,
        guests: 2,
        couponCode,
      }),
    );

    const results = await Promise.allSettled(requests);

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled',
    );
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    console.log(
      `Same-dates results: ${fulfilled.length} fulfilled, ${rejected.length} rejected`,
    );

    // Exactly 5 succeed with the discount
    expect(fulfilled.length).toBe(5);
    expect(rejected.length).toBe(15);

    for (const res of fulfilled) {
      const val = res.value as unknown as BookingResult;
      expect(val.booking.discountAmount).toBeGreaterThan(0);
      expect(val.booking.couponCode).toBe(couponCode);
    }

    // Rejections must be availability conflicts or coupon usage limit reached
    for (const rej of rejected) {
      const err = rej.reason as Error;
      expect(
        err.message.includes('PROPERTY_ALREADY_BOOKED') ||
          err.message.includes('available') ||
          err.message.includes('Coupon usage limit reached') ||
          err.message.includes('Coupon code usage limit exceeded'),
      ).toBe(true);
    }

    // timesUsed must never exceed usageLimit
    const updatedCoupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(updatedCoupon!.timesUsed).toBe(5);
    expect(updatedCoupon!.timesUsed).toBeLessThanOrEqual(
      updatedCoupon!.usageLimit,
    );
  });

  it('Scenario 3: Exactly 1 slot left on coupon, fire two createGuestBooking calls concurrently - exactly ONE succeeds and the other gets ConflictException', async () => {
    const couponCode = 'LIMIT1TEST_' + Date.now();
    await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'FLAT',
        discountValue: 200,
        minOrderAmount: 500,
        usageLimit: 1,
        timesUsed: 0,
        validFrom: new Date(Date.now() - 1000 * 60),
        validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isActive: true,
      },
    });

    const call1 = bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: '2032-06-01T14:00:00.000Z',
      checkOut: '2032-06-03T10:00:00.000Z',
      guests: 2,
      couponCode,
    });

    const call2 = bookingsService.createGuestBooking(guestId, {
      propertyId,
      checkIn: '2032-06-05T14:00:00.000Z',
      checkOut: '2032-06-07T10:00:00.000Z',
      guests: 2,
      couponCode,
    });

    const results = await Promise.allSettled([call1, call2]);

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled',
    );
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const rejectedReason = rejected[0].reason as ConflictException;
    expect(rejectedReason.getStatus()).toBe(409);
    expect(rejectedReason.message).toMatch(/usage limit/i);

    const couponInDb = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(couponInDb?.timesUsed).toBe(1);

    await prisma.booking.deleteMany({ where: { couponCode } });
    await prisma.coupon.delete({ where: { code: couponCode } });
  });
});
