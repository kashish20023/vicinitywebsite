/**
 * Integration and Concurrency Tests for Phase 3:
 * Dedicated Settlement Service, Revisions, Allocations, and Eligibility Lifecycle.
 */

import { PrismaClient } from '@prisma/client';
import { FinancialCoordinationService } from './financial-coordination.service.js';
import { SettlementService } from './settlement.service.js';
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

describe('Phase 3 — Settlement Service & Lifecycle Integration', () => {
  let prisma: any;
  let coordinationService: FinancialCoordinationService;
  let settlementService: SettlementService;

  const testRunId = `payout_phase3_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const manifest = {
    testRunId,
    auditEvents: [] as string[],
    allocations: [] as string[],
    revisions: [] as string[],
    settlements: [] as string[],
    snapshots: [] as string[],
    refundComponents: [] as string[],
    refunds: [] as string[],
    payments: [] as string[],
    disputes: [] as string[],
    bookings: [] as string[],
    properties: [] as string[],
    users: [] as string[],
  };

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: TEST_DB_URL } },
    });
    await prisma.$connect();
    coordinationService = new FinancialCoordinationService(prisma);
    settlementService = new SettlementService(prisma, coordinationService);
  });

  afterAll(async () => {
    try {
      if (manifest.auditEvents.length > 0) {
        await prisma.financialAuditEvent.deleteMany({
          where: { id: { in: manifest.auditEvents } },
        });
      }
      if (manifest.allocations.length > 0) {
        await prisma.settlementAllocation.deleteMany({
          where: { id: { in: manifest.allocations } },
        });
      }
      if (manifest.revisions.length > 0) {
        await prisma.settlementRevision.deleteMany({
          where: { id: { in: manifest.revisions } },
        });
      }
      if (manifest.settlements.length > 0) {
        await prisma.settlement.deleteMany({
          where: { id: { in: manifest.settlements } },
        });
      }
      if (manifest.snapshots.length > 0) {
        await prisma.bookingFinanceSnapshot.deleteMany({
          where: { id: { in: manifest.snapshots } },
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
      if (manifest.disputes.length > 0) {
        await prisma.dispute.deleteMany({
          where: { id: { in: manifest.disputes } },
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

      // Assert 0 remaining records
      const remainingSettlements = await prisma.settlement.count({
        where: { id: { in: manifest.settlements } },
      });
      const remainingBookings = await prisma.booking.count({
        where: { id: { in: manifest.bookings } },
      });
      expect(remainingSettlements).toBe(0);
      expect(remainingBookings).toBe(0);
    } finally {
      await prisma.$disconnect();
    }
  });

  let seq = 5000;
  async function createCompleteBookingFixture(options?: {
    bookingStatus?: string;
    reviewStatus?: string;
    coHost?: boolean;
    partialCapture?: boolean;
  }) {
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

    let coHost: any = null;
    if (options?.coHost) {
      coHost = await prisma.user.create({
        data: {
          email: `${testRunId}_cohost_${seq}_${Date.now()}@example.com`,
          phone: `+919${String(Date.now()).slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
          passwordHash: 'dummy_hash',
          name: `CoHost ${seq}`,
          role: 'USER',
        },
      });
      manifest.users.push(coHost.id);
    }

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
        title: `Settlement Prop ${seq}`,
        slug: `set-prop-${testRunId}-${seq}`,
        description: 'Settlement test prop',
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
        basePrice: 10000,
        cleaningFee: 1000,
        serviceFeeRate: 0.10,
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
        ownershipProofDocs: [],
        adminTags: [],
        unavailableDates: [],
        hostId: host.id,
      },
    });
    manifest.properties.push(property.id);

    const bookingStatus = options?.bookingStatus || 'COMPLETED';
    const totalAmountRupees = 14160; // 10000 base + 1000 clean + 1000 fee = 12000 subtotal; 18% tax = 2160; total = 14160

    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        guestId: guest.id,
        checkIn: new Date(Date.now() - 86400000 * 5),
        checkOut: new Date(Date.now() - 86400000 * 3),
        guests: 2,
        totalAmount: totalAmountRupees,
        status: bookingStatus,
        paymentStatus: 'PAID',
      },
    });
    manifest.bookings.push(booking.id);

    // Snapshot creation
    const snapshot = await prisma.bookingFinanceSnapshot.create({
      data: {
        bookingId: booking.id,
        hostUserId: host.id,
        propertyId: property.id,
        currency: 'INR',
        basePaise: 1000000n,
        cleaningPaise: 100000n,
        serviceFeePaise: 100000n,
        taxPaise: 216000n,
        discountPaise: 0n,
        guestTotalPaise: 1416000n,
        discountFunding: 'NONE',
        coHostAgreementStatus: options?.coHost ? 'AGREED' : 'NONE',
        coHostRecipientUserId: coHost ? coHost.id : null,
        coHostRuleType: options?.coHost ? 'PERCENTAGE' : null,
        coHostPercentageBps: options?.coHost ? 2000n : null, // 20%
        policyVersion: 'DRAFT_V1',
        reviewStatus: options?.reviewStatus || 'VALID',
      },
    });
    manifest.snapshots.push(snapshot.id);

    // Payment creation
    const paymentAmount = options?.partialCapture ? 10000 : totalAmountRupees;
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: paymentAmount,
        currency: 'INR',
        provider: 'CASHFREE',
        providerPaymentId: `cf_pay_set_${Date.now()}_${seq}`,
        status: 'PAID',
      },
    });
    manifest.payments.push(payment.id);

    return { host, coHost, guest, property, booking, snapshot, payment };
  }

  it('1. Prepares READY settlement for completed booking with verified capture and clean snapshot', async () => {
    const { booking, host } = await createCompleteBookingFixture();

    const result = await settlementService.prepareOrRefreshSettlement(
      booking.id,
      'BOOKING_COMPLETION',
    );

    manifest.settlements.push(result.settlementId);
    manifest.revisions.push(result.revisionId);

    expect(result.status).toBe('READY');
    expect(result.holdReasons.length).toBe(0);
    expect(result.revisionNumber).toBe(1);
    expect(result.isNewRevision).toBe(true);

    // 10000 base + 1000 clean = 11000 rupees = 1,100,000 paise for host
    expect(result.hostNetPaise).toBe(1100000n);
    expect(result.coHostNetPaise).toBe(0n);
    expect(result.platformNetPaise).toBe(100000n);
    expect(result.taxNetPaise).toBe(216000n);
    expect(result.totalGrossPaise).toBe(1416000n);

    // Allocations check
    const hostAlloc = result.allocations.find((a) => a.recipientRole === 'HOST');
    expect(hostAlloc).toBeDefined();
    expect(hostAlloc?.status).toBe('ELIGIBLE');
    expect(hostAlloc?.netEntitledPaise).toBe(1100000n);
    expect(hostAlloc?.allocationKey).toBe(`HOST:${host.id}`);
  });

  it('2. Co-host percentage agreement calculates deterministic split and creates co-host allocation', async () => {
    const { booking, host, coHost } = await createCompleteBookingFixture({ coHost: true });

    const result = await settlementService.prepareOrRefreshSettlement(
      booking.id,
      'BOOKING_COMPLETION',
    );

    manifest.settlements.push(result.settlementId);
    manifest.revisions.push(result.revisionId);

    expect(result.status).toBe('READY');
    // Co-host 20% of base (10,000): 2000 rupees = 200,000 paise
    // Host receives (10000 - 2000) base + 1000 clean = 9000 rupees = 900,000 paise
    expect(result.coHostNetPaise).toBe(200000n);
    expect(result.hostNetPaise).toBe(900000n);

    const coHostAlloc = result.allocations.find((a) => a.recipientRole === 'CO_HOST');
    expect(coHostAlloc).toBeDefined();
    expect(coHostAlloc?.status).toBe('ELIGIBLE');
    expect(coHostAlloc?.netEntitledPaise).toBe(200000n);
    expect(coHostAlloc?.recipientUserId).toBe(coHost.id);
  });

  it('3. Booking in CONFIRMED/active state holds settlement with BOOKING_NOT_COMPLETED reason', async () => {
    const { booking } = await createCompleteBookingFixture({ bookingStatus: 'CONFIRMED' });

    const result = await settlementService.prepareOrRefreshSettlement(booking.id);

    manifest.settlements.push(result.settlementId);
    manifest.revisions.push(result.revisionId);

    expect(result.status).toBe('HELD');
    expect(result.holdReasons).toContain('BOOKING_NOT_COMPLETED');

    // Allocation statuses reflect HELD
    const hostAlloc = result.allocations.find((a) => a.recipientRole === 'HOST');
    expect(hostAlloc?.status).toBe('HELD');
    // But proposed amounts are retained and NOT zeroed out!
    expect(result.hostNetPaise).toBe(1100000n);
  });

  it('4. Incomplete snapshot review status holds settlement with SNAPSHOT_NEEDS_REVIEW reason', async () => {
    const { booking } = await createCompleteBookingFixture({ reviewStatus: 'NEEDS_REVIEW' });

    const result = await settlementService.prepareOrRefreshSettlement(booking.id);

    manifest.settlements.push(result.settlementId);
    manifest.revisions.push(result.revisionId);

    expect(result.status).toBe('HELD');
    expect(result.holdReasons).toContain('SNAPSHOT_NEEDS_REVIEW');
  });

  it('5. Partial capture holds settlement with CAPTURE_AMOUNT_MISMATCH reason', async () => {
    const { booking } = await createCompleteBookingFixture({ partialCapture: true });

    const result = await settlementService.prepareOrRefreshSettlement(booking.id);

    manifest.settlements.push(result.settlementId);
    manifest.revisions.push(result.revisionId);

    expect(result.status).toBe('HELD');
    expect(result.holdReasons).toContain('CAPTURE_AMOUNT_MISMATCH');
  });

  it('6. In-flight refund or active dispute places actionable holds on settlement', async () => {
    const { booking, payment } = await createCompleteBookingFixture();

    // Create an in-flight reserved refund
    const refundRes = await coordinationService.withBookingFinancialLock(booking.id, async (tx) => {
      return coordinationService.reserveRefund(tx, {
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: 200000n,
        operationReference: `op_inflight_${Date.now()}`,
      });
    });
    manifest.refunds.push(refundRes.refund.id);

    // Create an open dispute
    const dispute = await prisma.dispute.create({
      data: {
        bookingId: booking.id,
        raisedById: booking.guestId,
        reason: 'Cleanliness issue',
        status: 'OPEN',
      },
    });
    manifest.disputes.push(dispute.id);

    const result = await settlementService.prepareOrRefreshSettlement(booking.id);

    manifest.settlements.push(result.settlementId);
    manifest.revisions.push(result.revisionId);

    expect(result.status).toBe('HELD');
    expect(result.holdReasons).toContain('IN_FLIGHT_REFUND_HOLD');
    expect(result.holdReasons).toContain('ACTIVE_DISPUTE_HOLD');
  });

  it('7. Idempotent repeated execution returns existing revision without creating spurious duplicates', async () => {
    const { booking } = await createCompleteBookingFixture();

    const call1 = await settlementService.prepareOrRefreshSettlement(booking.id);
    manifest.settlements.push(call1.settlementId);
    manifest.revisions.push(call1.revisionId);

    const call2 = await settlementService.prepareOrRefreshSettlement(booking.id);

    expect(call2.isNewRevision).toBe(false);
    expect(call2.revisionId).toBe(call1.revisionId);
    expect(call2.revisionNumber).toBe(call1.revisionNumber);

    const revisionCount = await prisma.settlementRevision.count({
      where: { settlementId: call1.settlementId },
    });
    expect(revisionCount).toBe(1);
  });

  it('8. Changed refund creates revision N+1 before execution, while preserving audit trail', async () => {
    const { booking, payment } = await createCompleteBookingFixture();

    // Initial settlement revision 1
    const call1 = await settlementService.prepareOrRefreshSettlement(booking.id);
    manifest.settlements.push(call1.settlementId);
    manifest.revisions.push(call1.revisionId);
    expect(call1.revisionNumber).toBe(1);

    // Process a completed refund of 300,000 paise (3000 rupees) with component breakdown
    const refundOp = `op_rev_test_${Date.now()}`;
    const refundRecord = await coordinationService.withBookingFinancialLock(booking.id, async (tx) => {
      const res = await coordinationService.reserveRefund(tx, {
        bookingId: booking.id,
        paymentId: payment.id,
        amountPaise: 300000n,
        operationReference: refundOp,
        breakdown: {
          accommodationPaise: 300000n,
          cleaningPaise: 0n,
          platformPaise: 0n,
          taxPaise: 0n,
        },
      });
      return coordinationService.completeRefund(tx, res.refund.id, {
        status: 'COMPLETED',
        providerRefundId: 'rf_cf_mock_comp',
      });
    });
    manifest.refunds.push(refundRecord.id);

    // Refresh settlement after completed refund
    const call2 = await settlementService.prepareOrRefreshSettlement(
      booking.id,
      'REFUND_COMPLETED_RECALCULATION',
    );
    manifest.revisions.push(call2.revisionId);

    expect(call2.isNewRevision).toBe(true);
    expect(call2.revisionNumber).toBe(2);
    expect(call2.totalRefundedPaise).toBe(300000n);
    // Host was 1,100,000; refunded 300,000 -> 800,000 net paise
    expect(call2.hostNetPaise).toBe(800000n);

    // Both revision 1 and revision 2 exist in database
    const revisionCount = await prisma.settlementRevision.count({
      where: { settlementId: call1.settlementId },
    });
    expect(revisionCount).toBe(2);
  });

  it('9. Bounded recovery mechanism finds and processes missed settlements without disbursing money', async () => {
    const { booking } = await createCompleteBookingFixture();

    // No settlement called yet for this booking
    const initialSettlement = await prisma.settlement.findUnique({
      where: { bookingId: booking.id },
    });
    expect(initialSettlement).toBeNull();

    // Trigger recovery
    const recoveredCount = await settlementService.recoverPendingSettlements(10);
    expect(recoveredCount).toBeGreaterThanOrEqual(1);

    const createdSettlement = await prisma.settlement.findUnique({
      where: { bookingId: booking.id },
      include: { revisions: true },
    });
    expect(createdSettlement).toBeDefined();
    if (createdSettlement) {
      manifest.settlements.push(createdSettlement.id);
      manifest.revisions.push(createdSettlement.revisions[0]?.id);
    }
  });
});
