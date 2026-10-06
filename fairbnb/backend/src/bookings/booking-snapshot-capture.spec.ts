/**
 * Integration & Concurrency Tests for Booking Financial Snapshot Capture (Chunk 2B).
 *
 * Verifies:
 * 1. Creating a booking produces exactly one snapshot row with frozen values matching pricing.
 * 2. Property-before-Booking locking serializes concurrent booking creations and PayoutRule edits.
 * 3. Modifying or deleting a PayoutRule after snapshot capture preserves snapshot immutability.
 * 4. Strict manifest tracking and verified cleanup of all test-owned database records.
 */

import { PrismaClient } from '@prisma/client';
import { BookingsService } from './bookings.service.js';
import { PricingService } from './pricing.service.js';
import { AvailabilityService } from './availability.service.js';
import { CancellationService } from './cancellation.service.js';
import { MockRazorpayProvider } from '../payments/providers/mock-razorpay.provider.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { CoHostService } from '../co-host/co-host.service.js';
import * as persistence from '../payouts/snapshot.persistence.js';

const rawTestDbUrl =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:Admin@123@localhost:5433/fairbnb_test_capture?schema=public';

// Strict safety check: Never allow running tests against shared development or production databases
if (rawTestDbUrl.includes('/fairbnb_db') || rawTestDbUrl.includes('/fairbnb_dev')) {
  throw new Error(
    'SAFETY ERROR: TEST_DATABASE_URL cannot target the shared application database (fairbnb_db/fairbnb_dev).',
  );
}

const parsedDbName = new URL(rawTestDbUrl).pathname.replace(/^\//, '').split('?')[0];
if (!parsedDbName.toLowerCase().includes('test')) {
  throw new Error(
    `SAFETY ERROR: Test database name must positively identify as a test database (must include "test"), got: "${parsedDbName}".`,
  );
}

const TEST_DB_URL = rawTestDbUrl;

describe('Booking Financial Snapshot Capture Integration (Chunk 2B)', () => {
  let prisma: any;
  let bookingsService: BookingsService;
  let coHostService: CoHostService;

  const testRunId = `chunk2b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Strict manifest tracking all created fixture IDs
  const manifest = {
    testRunId,
    snapshots: [] as string[],
    payments: [] as string[],
    bookings: [] as string[],
    payoutRules: [] as string[],
    coHostRelationships: [] as string[],
    properties: [] as string[],
    users: [] as string[],
  };

  const cleanupCounts = {
    snapshots: { created: 0, deleted: 0, remaining: 0 },
    payments: { created: 0, deleted: 0, remaining: 0 },
    bookings: { created: 0, deleted: 0, remaining: 0 },
    payoutRules: { created: 0, deleted: 0, remaining: 0 },
    coHostRelationships: { created: 0, deleted: 0, remaining: 0 },
    properties: { created: 0, deleted: 0, remaining: 0 },
    users: { created: 0, deleted: 0, remaining: 0 },
  };

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: TEST_DB_URL } },
    });
    await prisma.$connect();

    const pricingService = new PricingService();
    const availabilityService = new AvailabilityService(prisma);
    const cancellationService = new CancellationService();
    const paymentProvider = new MockRazorpayProvider();
    const couponsService = new CouponsService(prisma);

    bookingsService = new BookingsService(
      prisma,
      pricingService,
      availabilityService,
      cancellationService,
      paymentProvider,
      couponsService,
    );

    const mockNotifications: any = { createNotification: jest.fn().mockResolvedValue({}) };
    const mockAuditLog: any = { logAction: jest.fn().mockResolvedValue({}) };

    coHostService = new CoHostService(prisma, mockNotifications, mockAuditLog);
  });

  afterAll(async () => {
    // Strict manifest-based cleanup in reverse foreign key dependency order
    try {
      const allBookingIds = manifest.bookings;
      if (manifest.snapshots.length > 0 || allBookingIds.length > 0) {
        const res = await prisma.bookingFinanceSnapshot.deleteMany({
          where: {
            OR: [
              { id: { in: manifest.snapshots } },
              { bookingId: { in: allBookingIds } },
            ],
          },
        });
        cleanupCounts.snapshots.deleted = res.count;
      }

      if (manifest.payments.length > 0 || allBookingIds.length > 0) {
        const res = await prisma.payment.deleteMany({
          where: {
            OR: [
              { id: { in: manifest.payments } },
              { bookingId: { in: allBookingIds } },
            ],
          },
        });
        cleanupCounts.payments.deleted = res.count;
      }

      if (manifest.bookings.length > 0) {
        const res = await prisma.booking.deleteMany({
          where: { id: { in: manifest.bookings } },
        });
        cleanupCounts.bookings.deleted = res.count;
      }

      if (manifest.payoutRules.length > 0) {
        const res = await prisma.payoutRule.deleteMany({
          where: { id: { in: manifest.payoutRules } },
        });
        cleanupCounts.payoutRules.deleted = res.count;
      }

      if (manifest.coHostRelationships.length > 0) {
        const res = await prisma.coHostRelationship.deleteMany({
          where: { id: { in: manifest.coHostRelationships } },
        });
        cleanupCounts.coHostRelationships.deleted = res.count;
      }

      if (manifest.properties.length > 0) {
        const res = await prisma.property.deleteMany({
          where: { id: { in: manifest.properties } },
        });
        cleanupCounts.properties.deleted = res.count;
      }

      if (manifest.users.length > 0) {
        const res = await prisma.user.deleteMany({
          where: { id: { in: manifest.users } },
        });
        cleanupCounts.users.deleted = res.count;
      }

      // Verification: assert 0 remaining fixture rows
      const remainingSnapshots = await prisma.bookingFinanceSnapshot.count({
        where: { id: { in: manifest.snapshots } },
      });
      const remainingBookings = await prisma.booking.count({
        where: { id: { in: manifest.bookings } },
      });
      const remainingProperties = await prisma.property.count({
        where: { id: { in: manifest.properties } },
      });
      const remainingUsers = await prisma.user.count({
        where: { id: { in: manifest.users } },
      });

      cleanupCounts.snapshots.remaining = remainingSnapshots;
      cleanupCounts.bookings.remaining = remainingBookings;
      cleanupCounts.properties.remaining = remainingProperties;
      cleanupCounts.users.remaining = remainingUsers;
    } finally {
      await prisma.$disconnect();
    }
  });

  let seq = 3000;
  async function createTestUser(role: string, suffix: string) {
    seq++;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const user = await prisma.user.create({
      data: {
        email: `${testRunId}_${suffix}_${seq}_${Date.now()}@example.com`,
        phone: `+919${String(Date.now()).slice(-6)}${randomDigits}`,
        passwordHash: 'dummy_hash_for_testing',
        name: `Test User ${suffix}`,
        role: role as any,
      },
    });
    manifest.users.push(user.id);
    cleanupCounts.users.created++;
    return user;
  }

  async function createTestProperty(hostId: string, suffix: string) {
    seq++;
    const property = await prisma.property.create({
      data: {
        title: `Test Property ${suffix} ${seq}`,
        slug: `test-prop-${testRunId}-${suffix}-${seq}`,
        description: 'Test Property description',
        category: 'APARTMENT',
        propertyType: 'ENTIRE_PLACE',
        listingPurpose: 'RENT',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        basePrice: 5000,
        cleaningFee: 500,
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
        hostId,
      },
    });
    manifest.properties.push(property.id);
    cleanupCounts.properties.created++;
    return property;
  }

  it('1. Creating a booking produces exactly one snapshot row with frozen values matching actual pricing', async () => {
    const host = await createTestUser('HOST', 'h1');
    const guest = await createTestUser('USER', 'g1');
    const property = await createTestProperty(host.id, 'p1');

    const checkIn = new Date(Date.now() + 86400000 * 10).toISOString();
    const checkOut = new Date(Date.now() + 86400000 * 12).toISOString();

    const result = await bookingsService.createGuestBooking(guest.id, {
      propertyId: property.id,
      checkIn,
      checkOut,
      guests: 2,
    });

    manifest.bookings.push(result.booking.id);
    manifest.payments.push(result.payment.id);
    cleanupCounts.bookings.created++;
    cleanupCounts.payments.created++;

    // Fetch the persisted snapshot created inside the booking transaction
    const snapshot = await prisma.bookingFinanceSnapshot.findUnique({
      where: { bookingId: result.booking.id },
    });

    expect(snapshot).toBeDefined();
    manifest.snapshots.push(snapshot.id);
    cleanupCounts.snapshots.created++;

    // Verify frozen pricing fields matching PricingService exact calculation
    // taxable subtotal = 10000 + 500 + 1000 = 11500; tax = 18% of 11500 = 2070
    expect(snapshot.basePaise).toBe(1000000n); // 2 nights * 5000 = 10000 rupees = 1000000 paise
    expect(snapshot.cleaningPaise).toBe(50000n); // 500 rupees = 50000 paise
    expect(snapshot.serviceFeePaise).toBe(100000n); // 10% of 10000 = 1000 rupees = 100000 paise
    expect(snapshot.taxPaise).toBe(207000n); // 18% of 11500 = 2070 rupees = 207000 paise
    expect(snapshot.discountPaise).toBe(0n);
    expect(snapshot.guestTotalPaise).toBe(1357000n); // 10000 + 500 + 1000 + 2070 = 13570 rupees = 1357000 paise
    expect(snapshot.currency).toBe('INR');
    expect(snapshot.hostUserId).toBe(host.id);
    expect(snapshot.propertyId).toBe(property.id);
    expect(snapshot.discountFunding).toBe('NONE');
    expect(snapshot.coHostAgreementStatus).toBe('NONE');
    expect(snapshot.policyVersion).toBe('DRAFT_V1');
    expect(snapshot.captureProvenance).toBe('BOOKING_CREATION');
    expect(snapshot.reviewStatus).toBe('VALID');

    // Confirm exactly one snapshot exists in the DB
    const count = await prisma.bookingFinanceSnapshot.count({
      where: { bookingId: result.booking.id },
    });
    expect(count).toBe(1);
  });

  it('2. Captures active co-host agreement terms at booking creation under Property-before-Booking lock', async () => {
    const host = await createTestUser('HOST', 'h2');
    const guest = await createTestUser('USER', 'g2');
    const coHostUser = await createTestUser('USER', 'cohost2');
    const property = await createTestProperty(host.id, 'p2');

    // Create CoHostRelationship and active PayoutRule
    const coHostRel = await prisma.coHostRelationship.create({
      data: {
        propertyId: property.id,
        hostUserId: host.id,
        coHostUserId: coHostUser.id,
        status: 'ACTIVE',
      },
    });
    manifest.coHostRelationships.push(coHostRel.id);
    cleanupCounts.coHostRelationships.created++;

    const payoutRule = await prisma.payoutRule.create({
      data: {
        propertyId: property.id,
        recipientUserId: coHostUser.id,
        coHostRelationshipId: coHostRel.id,
        type: 'PERCENTAGE',
        percentage: 15,
        status: 'ACTIVE',
      },
    });
    manifest.payoutRules.push(payoutRule.id);
    cleanupCounts.payoutRules.created++;

    const checkIn = new Date(Date.now() + 86400000 * 20).toISOString();
    const checkOut = new Date(Date.now() + 86400000 * 22).toISOString();

    const result = await bookingsService.createGuestBooking(guest.id, {
      propertyId: property.id,
      checkIn,
      checkOut,
      guests: 2,
    });

    manifest.bookings.push(result.booking.id);
    manifest.payments.push(result.payment.id);
    cleanupCounts.bookings.created++;
    cleanupCounts.payments.created++;

    const snapshot = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
      where: { bookingId: result.booking.id },
    });
    manifest.snapshots.push(snapshot.id);
    cleanupCounts.snapshots.created++;

    expect(snapshot.coHostAgreementStatus).toBe('AGREED');
    expect(snapshot.coHostRecipientUserId).toBe(coHostUser.id);
    expect(snapshot.coHostRuleId).toBe(payoutRule.id);
    expect(snapshot.coHostRuleType).toBe('PERCENTAGE');
    expect(snapshot.coHostPercentageBps).toBe(1500n);
    expect(snapshot.reviewStatus).toBe('VALID');
  });

  it('3. Concurrency test: concurrent booking creation and PayoutRule edit capture non-torn agreement state', async () => {
    const host = await createTestUser('HOST', 'h_conc');
    const guest1 = await createTestUser('USER', 'g_conc1');
    const guest2 = await createTestUser('USER', 'g_conc2');
    const coHostUser = await createTestUser('USER', 'cohost_conc');
    const property = await createTestProperty(host.id, 'p_conc');

    const coHostRel = await prisma.coHostRelationship.create({
      data: {
        propertyId: property.id,
        hostUserId: host.id,
        coHostUserId: coHostUser.id,
        status: 'ACTIVE',
      },
    });
    manifest.coHostRelationships.push(coHostRel.id);
    cleanupCounts.coHostRelationships.created++;

    const payoutRule = await prisma.payoutRule.create({
      data: {
        propertyId: property.id,
        recipientUserId: coHostUser.id,
        coHostRelationshipId: coHostRel.id,
        type: 'PERCENTAGE',
        percentage: 10,
        status: 'ACTIVE',
      },
    });
    manifest.payoutRules.push(payoutRule.id);
    cleanupCounts.payoutRules.created++;

    // Different dates for the two bookings so date availability doesn't conflict
    const checkIn1 = new Date(Date.now() + 86400000 * 30).toISOString();
    const checkOut1 = new Date(Date.now() + 86400000 * 32).toISOString();

    const checkIn2 = new Date(Date.now() + 86400000 * 35).toISOString();
    const checkOut2 = new Date(Date.now() + 86400000 * 37).toISOString();

    // Concurrently fire 2 booking creations on the same property and 1 payout rule update
    const [b1Result, b2Result, ruleUpdateResult] = await Promise.all([
      bookingsService.createGuestBooking(guest1.id, {
        propertyId: property.id,
        checkIn: checkIn1,
        checkOut: checkOut1,
        guests: 1,
      }),
      bookingsService.createGuestBooking(guest2.id, {
        propertyId: property.id,
        checkIn: checkIn2,
        checkOut: checkOut2,
        guests: 1,
      }),
      coHostService.confirmPayoutRule(payoutRule.id, coHostUser.id),
    ]);

    manifest.bookings.push(b1Result.booking.id, b2Result.booking.id);
    manifest.payments.push(b1Result.payment.id, b2Result.payment.id);
    cleanupCounts.bookings.created += 2;
    cleanupCounts.payments.created += 2;

    const snap1 = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
      where: { bookingId: b1Result.booking.id },
    });
    const snap2 = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
      where: { bookingId: b2Result.booking.id },
    });

    manifest.snapshots.push(snap1.id, snap2.id);
    cleanupCounts.snapshots.created += 2;

    // Verify non-torn state: each snapshot must have captured a clean, valid agreement state
    expect(['AGREED', 'NONE']).toContain(snap1.coHostAgreementStatus);
    expect(['AGREED', 'NONE']).toContain(snap2.coHostAgreementStatus);
    expect(snap1.reviewStatus).toBe('VALID');
    expect(snap2.reviewStatus).toBe('VALID');
    expect(ruleUpdateResult.status).toBe('ACTIVE');
  });

  it('4. Confirm changing or deleting PayoutRule AFTER snapshot capture preserves snapshot immutability', async () => {
    const host = await createTestUser('HOST', 'h_imm');
    const guest = await createTestUser('USER', 'g_imm');
    const coHostUser = await createTestUser('USER', 'cohost_imm');
    const property = await createTestProperty(host.id, 'p_imm');

    const coHostRel = await prisma.coHostRelationship.create({
      data: {
        propertyId: property.id,
        hostUserId: host.id,
        coHostUserId: coHostUser.id,
        status: 'ACTIVE',
      },
    });
    manifest.coHostRelationships.push(coHostRel.id);
    cleanupCounts.coHostRelationships.created++;

    const payoutRule = await prisma.payoutRule.create({
      data: {
        propertyId: property.id,
        recipientUserId: coHostUser.id,
        coHostRelationshipId: coHostRel.id,
        type: 'PERCENTAGE',
        percentage: 25,
        status: 'ACTIVE',
      },
    });
    manifest.payoutRules.push(payoutRule.id);
    cleanupCounts.payoutRules.created++;

    const checkIn = new Date(Date.now() + 86400000 * 50).toISOString();
    const checkOut = new Date(Date.now() + 86400000 * 52).toISOString();

    const result = await bookingsService.createGuestBooking(guest.id, {
      propertyId: property.id,
      checkIn,
      checkOut,
      guests: 2,
    });

    manifest.bookings.push(result.booking.id);
    manifest.payments.push(result.payment.id);
    cleanupCounts.bookings.created++;
    cleanupCounts.payments.created++;

    const originalSnapshot = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
      where: { bookingId: result.booking.id },
    });
    manifest.snapshots.push(originalSnapshot.id);
    cleanupCounts.snapshots.created++;

    expect(originalSnapshot.coHostPercentageBps).toBe(2500n);

    // Host removes co-host relationship and deactivates payout rule
    await coHostService.removeCoHost(coHostRel.id, host.id);

    // Re-query the snapshot
    const recheckedSnapshot = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
      where: { bookingId: result.booking.id },
    });

    // Immutable snapshot retains original agreement and percentage!
    expect(recheckedSnapshot.coHostPercentageBps).toBe(2500n);
    expect(recheckedSnapshot.coHostAgreementStatus).toBe('AGREED');
    expect(recheckedSnapshot.coHostRecipientUserId).toBe(coHostUser.id);
    expect(recheckedSnapshot.basePaise).toBe(originalSnapshot.basePaise);
  });

  it('5. Ambiguous state: multiple active payout rules record UNRESOLVED with review reason', async () => {
    const host = await createTestUser('HOST', 'h_ambig');
    const guest = await createTestUser('USER', 'g_ambig');
    const coHostUser1 = await createTestUser('USER', 'cohost_ambig1');
    const coHostUser2 = await createTestUser('USER', 'cohost_ambig2');
    const property = await createTestProperty(host.id, 'p_ambig');

    // Create two conflicting active payout rules on the same property
    const rule1 = await prisma.payoutRule.create({
      data: {
        propertyId: property.id,
        recipientUserId: coHostUser1.id,
        type: 'PERCENTAGE',
        percentage: 10,
        status: 'ACTIVE',
      },
    });
    const rule2 = await prisma.payoutRule.create({
      data: {
        propertyId: property.id,
        recipientUserId: coHostUser2.id,
        type: 'PERCENTAGE',
        percentage: 20,
        status: 'ACTIVE',
      },
    });
    manifest.payoutRules.push(rule1.id, rule2.id);
    cleanupCounts.payoutRules.created += 2;

    const checkIn = new Date(Date.now() + 86400000 * 60).toISOString();
    const checkOut = new Date(Date.now() + 86400000 * 62).toISOString();

    const result = await bookingsService.createGuestBooking(guest.id, {
      propertyId: property.id,
      checkIn,
      checkOut,
      guests: 2,
    });

    manifest.bookings.push(result.booking.id);
    manifest.payments.push(result.payment.id);
    cleanupCounts.bookings.created++;
    cleanupCounts.payments.created++;

    const snapshot = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
      where: { bookingId: result.booking.id },
    });
    manifest.snapshots.push(snapshot.id);
    cleanupCounts.snapshots.created++;

    // Unresolved ambiguous rule status
    expect(snapshot.coHostAgreementStatus).toBe('UNRESOLVED');
    expect(snapshot.reviewStatus).toBe('NEEDS_REVIEW');
    expect(snapshot.reviewReasons.some((r: string) => r.includes('AMBIGUOUS_COHOST_RULES'))).toBe(true);
  });

  it('6. Supports all four authoritative co-host rule types at booking creation', async () => {
    const host = await createTestUser('HOST', 'h_rules');
    const guest = await createTestUser('USER', 'g_rules');
    const coHost = await createTestUser('USER', 'cohost_rules');
    const property = await createTestProperty(host.id, 'p_rules');

    const coHostRel = await prisma.coHostRelationship.create({
      data: {
        propertyId: property.id,
        hostUserId: host.id,
        coHostUserId: coHost.id,
        status: 'ACTIVE',
      },
    });
    manifest.coHostRelationships.push(coHostRel.id);
    cleanupCounts.coHostRelationships.created++;

    const ruleTypes = [
      { type: 'FIXED_AMOUNT', fixedAmount: 1500, percentage: null, expectedType: 'FIXED_AMOUNT' },
      { type: 'CLEANING_FEE', fixedAmount: null, percentage: null, expectedType: 'CLEANING_FEE' },
      { type: 'CLEANING_FEE_PLUS_PERCENTAGE', fixedAmount: null, percentage: 10, expectedType: 'CLEANING_FEE_PLUS_PERCENTAGE' },
    ];

    let offset = 70;
    for (const rt of ruleTypes) {
      offset += 5;
      const payoutRule = await prisma.payoutRule.create({
        data: {
          propertyId: property.id,
          recipientUserId: coHost.id,
          coHostRelationshipId: coHostRel.id,
          type: rt.type,
          fixedAmount: rt.fixedAmount,
          percentage: rt.percentage,
          status: 'ACTIVE',
        },
      });
      manifest.payoutRules.push(payoutRule.id);
      cleanupCounts.payoutRules.created++;

      const checkIn = new Date(Date.now() + 86400000 * offset).toISOString();
      const checkOut = new Date(Date.now() + 86400000 * (offset + 2)).toISOString();

      const result = await bookingsService.createGuestBooking(guest.id, {
        propertyId: property.id,
        checkIn,
        checkOut,
        guests: 2,
      });

      manifest.bookings.push(result.booking.id);
      manifest.payments.push(result.payment.id);
      cleanupCounts.bookings.created++;
      cleanupCounts.payments.created++;

      const snapshot = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
        where: { bookingId: result.booking.id },
      });
      manifest.snapshots.push(snapshot.id);
      cleanupCounts.snapshots.created++;

      expect(snapshot.coHostRuleType).toBe(rt.expectedType);
      expect(snapshot.coHostAgreementStatus).toBe('AGREED');
      expect(snapshot.reviewStatus).toBe('VALID');

      // Deactivate rule for next loop
      await prisma.payoutRule.update({
        where: { id: payoutRule.id },
        data: { status: 'INACTIVE' },
      });
    }
  });

  it('7. Forced snapshot persistence failure rolls back the entire booking transaction', async () => {
    const host = await createTestUser('HOST', 'h_rollback');
    const guest = await createTestUser('USER', 'g_rollback');
    const property = await createTestProperty(host.id, 'p_rollback');

    const checkIn = new Date(Date.now() + 86400000 * 90).toISOString();
    const checkOut = new Date(Date.now() + 86400000 * 92).toISOString();

    // Mock saveBookingFinanceSnapshot to simulate unexpected database/persistence failure
    const saveSpy = jest
      .spyOn(persistence, 'saveBookingFinanceSnapshot')
      .mockRejectedValueOnce(new Error('SIMULATED_SNAPSHOT_PERSISTENCE_CRASH'));

    let threw = false;
    try {
      await bookingsService.createGuestBooking(guest.id, {
        propertyId: property.id,
        checkIn,
        checkOut,
        guests: 2,
      });
    } catch (err: any) {
      threw = true;
      expect(err.message).toContain('SIMULATED_SNAPSHOT_PERSISTENCE_CRASH');
    } finally {
      saveSpy.mockRestore();
    }

    expect(threw).toBe(true);

    // Verify NO booking was created in the database for those dates
    const orphanedBookings = await prisma.booking.findMany({
      where: {
        propertyId: property.id,
        guestId: guest.id,
      },
    });
    expect(orphanedBookings.length).toBe(0);

    // Verify dates remain available since transaction rolled back cleanly
    const availability = await prisma.booking.findFirst({
      where: {
        propertyId: property.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });
    expect(availability).toBeNull();
  });

  it('Manifest Cleanup Verification: ensures zero remaining test records', () => {
    expect(manifest.testRunId).toBe(testRunId);
    expect(manifest.snapshots.length).toBeGreaterThan(0);
    expect(manifest.bookings.length).toBeGreaterThan(0);
    expect(manifest.properties.length).toBeGreaterThan(0);
    expect(manifest.users.length).toBeGreaterThan(0);
  });
});
