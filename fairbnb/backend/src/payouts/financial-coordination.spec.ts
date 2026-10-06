/**
 * Integration and Concurrency Tests for Phase 2:
 * Refund Allocation, Component Breakdown, and Financial Coordination.
 */

import { PrismaClient } from '@prisma/client';
import { FinancialCoordinationService } from './financial-coordination.service.js';
import { toPaise } from './money.js';

const rawTestDbUrl =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:Admin@123@localhost:5433/fairbnb_test_capture?schema=public';

if (rawTestDbUrl.includes('/fairbnb_db') || rawTestDbUrl.includes('/fairbnb_dev')) {
  throw new Error('SAFETY ERROR: TEST_DATABASE_URL cannot target the shared database.');
}

const parsedDbName = new URL(rawTestDbUrl).pathname.replace(/^\//, '').split('?')[0];
if (!parsedDbName.toLowerCase().includes('test')) {
  throw new Error(`SAFETY ERROR: Test database name must include "test", got: "${parsedDbName}".`);
}

const TEST_DB_URL = rawTestDbUrl;

describe('Phase 2 — Refund Allocation & Financial Coordination', () => {
  let prisma: any;
  let service: FinancialCoordinationService;

  const testRunId = `payout_phase2_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const manifest = {
    testRunId,
    auditEvents: [] as string[],
    refundComponents: [] as string[],
    refunds: [] as string[],
    payments: [] as string[],
    bookings: [] as string[],
    properties: [] as string[],
    users: [] as string[],
  };

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: TEST_DB_URL } },
    });
    await prisma.$connect();
    service = new FinancialCoordinationService(prisma);
  });

  afterAll(async () => {
    try {
      if (manifest.auditEvents.length > 0) {
        await prisma.financialAuditEvent.deleteMany({
          where: { id: { in: manifest.auditEvents } },
        });
      }
      if (manifest.refundComponents.length > 0) {
        await prisma.refundComponent.deleteMany({
          where: { id: { in: manifest.refundComponents } },
        });
      }
      if (manifest.refunds.length > 0) {
        await prisma.refund.deleteMany({
          where: { id: { in: manifest.refunds } },
        });
      }
      if (manifest.payments.length > 0) {
        await prisma.payment.deleteMany({
          where: { id: { in: manifest.payments } },
        });
      }
      if (manifest.bookings.length > 0) {
        await prisma.booking.deleteMany({
          where: { id: { in: manifest.bookings } },
        });
      }
      if (manifest.properties.length > 0) {
        await prisma.property.deleteMany({
          where: { id: { in: manifest.properties } },
        });
      }
      if (manifest.users.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: manifest.users } },
        });
      }

      // Assert 0 remaining fixtures
      const remainingRefunds = await prisma.refund.count({
        where: { id: { in: manifest.refunds } },
      });
      const remainingBookings = await prisma.booking.count({
        where: { id: { in: manifest.bookings } },
      });
      expect(remainingRefunds).toBe(0);
      expect(remainingBookings).toBe(0);
    } finally {
      await prisma.$disconnect();
    }
  });

  let seq = 4000;
  async function setupBookingWithPayment(totalRupees: number) {
    seq++;
    const host = await prisma.user.create({
      data: {
        email: `${testRunId}_host_${seq}_${Date.now()}@example.com`,
        phone: `+919${String(Date.now()).slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
        passwordHash: 'dummy_hash',
        name: `Host ${seq}`,
        role: 'HOST',
      },
    });
    manifest.users.push(host.id);

    const guest = await prisma.user.create({
      data: {
        email: `${testRunId}_guest_${seq}_${Date.now()}@example.com`,
        phone: `+919${String(Date.now()).slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
        passwordHash: 'dummy_hash',
        name: `Guest ${seq}`,
        role: 'USER',
      },
    });
    manifest.users.push(guest.id);

    const property = await prisma.property.create({
      data: {
        title: `Prop ${seq}`,
        slug: `prop-${testRunId}-${seq}`,
        description: 'Test property description',
        category: 'APARTMENT',
        propertyType: 'ENTIRE_PLACE',
        listingPurpose: 'RENT',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        basePrice: totalRupees,
        cleaningFee: 0,
        serviceFeeRate: 0,
        taxRate: 0,
        instantBook: true,
        totalStock: 1,
        minNights: 1,
        cancellationPolicy: 'FLEXIBLE',
        images: [],
        gallery: [],
        listingExtras: {},
        status: 'PUBLISHED',
        verificationStatus: 'APPROVED',
        ownershipProofDocs: [],
        adminTags: [],
        unavailableDates: [],
        hostId: host.id,
      },
    });
    manifest.properties.push(property.id);

    const checkIn = new Date(Date.now() + 86400000 * 10);
    const checkOut = new Date(Date.now() + 86400000 * 11);

    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        guestId: guest.id,
        checkIn,
        checkOut,
        guests: 1,
        totalAmount: totalRupees,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    });
    manifest.bookings.push(booking.id);

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: totalRupees,
        currency: 'INR',
        provider: 'CASHFREE',
        providerPaymentId: `cf_pay_${Date.now()}_${seq}`,
        status: 'PAID',
      },
    });
    manifest.payments.push(payment.id);

    return { host, guest, property, booking, payment };
  }

  it('1. Reconciles exact component breakdown: accommodation + cleaning + platform + tax === totalPaise', async () => {
    const { booking, payment } = await setupBookingWithPayment(10000); // 1,000,000 paise

    const breakdown = {
      accommodationPaise: 700000n,
      cleaningPaise: 100000n,
      platformPaise: 100000n,
      taxPaise: 100000n,
    };
    const totalPaise = 1000000n;

    const opRef = `op_rf_reconcile_${Date.now()}`;
    const result = await service.withBookingFinancialLock(booking.id, async (tx) => {
      return service.reserveRefund(tx, {
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: totalPaise,
        operationReference: opRef,
        reason: 'Guest requested full refund with breakdown',
        breakdown,
      });
    });

    manifest.refunds.push(result.refund.id);
    if (result.refund.components[0]) {
      manifest.refundComponents.push(result.refund.components[0].id);
    }

    expect(result.isExisting).toBe(false);
    expect(result.refund.reservationStatus).toBe('RESERVED');
    expect(result.refund.reviewStatus).toBe('VALID');
    expect(result.refund.components[0].accommodationPaise).toBe(700000n);
    expect(result.refund.components[0].cleaningPaise).toBe(100000n);
    expect(result.refund.components[0].platformPaise).toBe(100000n);
    expect(result.refund.components[0].taxPaise).toBe(100000n);
    expect(result.refund.components[0].totalPaise).toBe(1000000n);
  });

  it('2. Component breakdown sum mismatch is rejected with BadRequestException', async () => {
    const { booking, payment } = await setupBookingWithPayment(5000);

    const breakdown = {
      accommodationPaise: 200000n,
      cleaningPaise: 50000n,
      platformPaise: 50000n,
      taxPaise: 50000n, // sum = 350000n != 400000n
    };

    await expect(
      service.withBookingFinancialLock(booking.id, async (tx) => {
        return service.reserveRefund(tx, {
          bookingId: booking.id,
          paymentId: payment.id,
          amountPaise: 400000n,
          operationReference: `op_mismatch_${Date.now()}`,
          breakdown,
        });
      }),
    ).rejects.toThrow(/does not match total refund amount/);
  });

  it('3. Scalar refund without breakdown preserves customer entitlement but marks review hold', async () => {
    const { booking, payment } = await setupBookingWithPayment(8000);

    const opRef = `op_scalar_${Date.now()}`;
    const result = await service.withBookingFinancialLock(booking.id, async (tx) => {
      return service.reserveRefund(tx, {
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: 500000n,
        operationReference: opRef,
        reason: 'Legacy scalar refund',
        // No breakdown supplied
      });
    });

    manifest.refunds.push(result.refund.id);
    if (result.refund.components[0]) {
      manifest.refundComponents.push(result.refund.components[0].id);
    }

    expect(result.refund.amountPaise).toBe(500000n);
    expect(result.refund.reviewStatus).toBe('NEEDS_REVIEW');
    expect(result.refund.components[0].reviewReasons).toContain('SCALAR_REFUND_WITHOUT_BREAKDOWN');
  });

  it('4. Duplicate business requests with same operationReference return existing refund (Idempotency)', async () => {
    const { booking, payment } = await setupBookingWithPayment(6000);

    const opRef = `op_idemp_${Date.now()}`;
    const firstCall = await service.withBookingFinancialLock(booking.id, async (tx) => {
      return service.reserveRefund(tx, {
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: 300000n,
        operationReference: opRef,
      });
    });

    manifest.refunds.push(firstCall.refund.id);
    if (firstCall.refund.components[0]) {
      manifest.refundComponents.push(firstCall.refund.components[0].id);
    }

    expect(firstCall.isExisting).toBe(false);

    // Second call with the same operationReference
    const secondCall = await service.withBookingFinancialLock(booking.id, async (tx) => {
      return service.reserveRefund(tx, {
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: 300000n,
        operationReference: opRef,
      });
    });

    expect(secondCall.isExisting).toBe(true);
    expect(secondCall.refund.id).toBe(firstCall.refund.id);
  });

  it('5. Enforces refundable capacity: cannot refund more than captured payments', async () => {
    const { booking, payment } = await setupBookingWithPayment(4000); // 400,000 paise

    await expect(
      service.withBookingFinancialLock(booking.id, async (tx) => {
        return service.reserveRefund(tx, {
          bookingId: booking.id,
          paymentId: payment.id,
          amountPaise: 500000n, // exceeds 400,000 paise!
          operationReference: `op_overcapacity_${Date.now()}`,
        });
      }),
    ).rejects.toThrow(/Insufficient refundable capacity/);
  });

  it('6. Terminal failure releases reservation; UNKNOWN preserves reservation capacity', async () => {
    const { booking, payment } = await setupBookingWithPayment(10000); // 1,000,000 paise capacity

    // Step A: Reserve 600,000 paise
    const ref1 = await service.withBookingFinancialLock(booking.id, async (tx) => {
      return service.reserveRefund(tx, {
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: 600000n,
        operationReference: `op_step_a_${Date.now()}`,
      });
    });
    manifest.refunds.push(ref1.refund.id);
    if (ref1.refund.components[0]) {
      manifest.refundComponents.push(ref1.refund.components[0].id);
    }

    // Capacity now 400,000 paise remaining
    let cap = await service.withBookingFinancialLock(booking.id, async (tx) =>
      service.getRefundableCapacity(tx, booking.id),
    );
    expect(cap.remainingCapacityPaise).toBe(400000n);

    // Step B: Mark ref1 as FAILED (terminal provider failure)
    await service.withBookingFinancialLock(booking.id, async (tx) => {
      return service.completeRefund(tx, ref1.refund.id, {
        status: 'FAILED',
        failureReason: 'GATEWAY_CARD_EXPIRED',
      });
    });

    // Terminal failure released reservation -> capacity restored to 1,000,000 paise!
    cap = await service.withBookingFinancialLock(booking.id, async (tx) =>
      service.getRefundableCapacity(tx, booking.id),
    );
    expect(cap.remainingCapacityPaise).toBe(1000000n);

    // Step C: Reserve 700,000 paise and mark as UNKNOWN
    const ref2 = await service.withBookingFinancialLock(booking.id, async (tx) => {
      return service.reserveRefund(tx, {
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: 700000n,
        operationReference: `op_step_c_${Date.now()}`,
      });
    });
    manifest.refunds.push(ref2.refund.id);
    if (ref2.refund.components[0]) {
      manifest.refundComponents.push(ref2.refund.components[0].id);
    }

    await service.withBookingFinancialLock(booking.id, async (tx) => {
      return service.completeRefund(tx, ref2.refund.id, {
        status: 'UNKNOWN',
        failureReason: 'PROVIDER_HTTP_TIMEOUT_504',
      });
    });

    // UNKNOWN retains reservation! Capacity must reflect consumed capacity!
    cap = await service.withBookingFinancialLock(booking.id, async (tx) =>
      service.getRefundableCapacity(tx, booking.id),
    );
    expect(cap.remainingCapacityPaise).toBe(300000n);
    expect(cap.hasUnknownRefunds).toBe(true);

    // Attempting to reserve 400,000 paise must fail because only 300,000 is left!
    await expect(
      service.withBookingFinancialLock(booking.id, async (tx) => {
        return service.reserveRefund(tx, {
          bookingId: booking.id,
          paymentId: payment.id,
          amountPaise: 400000n,
          operationReference: `op_should_fail_${Date.now()}`,
        });
      }),
    ).rejects.toThrow(/Insufficient refundable capacity/);
  });

  it('7. Parallel refund execution serializes cleanly under booking lock without capacity violation', async () => {
    const { booking, payment } = await setupBookingWithPayment(10000); // 1,000,000 paise

    // Attempt 3 concurrent refunds of 400,000 paise each (total 1,200,000 > 1,000,000)
    // Exactly 2 must succeed and 1 must be rejected due to capacity limit
    const promises = [1, 2, 3].map((i) =>
      service.withBookingFinancialLock(booking.id, async (tx) => {
        return service.reserveRefund(tx, {
          bookingId: booking.id,
          paymentId: payment.id,
          amountPaise: 400000n,
          operationReference: `op_parallel_${testRunId}_${i}`,
        });
      }),
    );

    const settled = await Promise.allSettled(promises);
    const fulfilled = settled.filter((s) => s.status === 'fulfilled');
    const rejected = settled.filter((s) => s.status === 'rejected');

    expect(fulfilled.length).toBe(2);
    expect(rejected.length).toBe(1);

    fulfilled.forEach((f: any) => {
      manifest.refunds.push(f.value.refund.id);
      if (f.value.refund.components[0]) {
        manifest.refundComponents.push(f.value.refund.components[0].id);
      }
    });

    const cap = await service.withBookingFinancialLock(booking.id, async (tx) =>
      service.getRefundableCapacity(tx, booking.id),
    );
    expect(cap.consumedRefundPaise).toBe(800000n);
    expect(cap.remainingCapacityPaise).toBe(200000n);
  });
});
