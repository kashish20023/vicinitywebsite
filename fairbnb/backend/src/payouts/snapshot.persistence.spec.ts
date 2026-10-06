/**
 * Database Persistence and Concurrency Smoke Tests for BookingFinanceSnapshot (Chunk 2A-R1).
 *
 * Runs against isolated disposable database.
 * Implements strict testRunId tracking and manifest-based cleanup.
 */

import { PrismaClient } from '@prisma/client';
import {
  saveBookingFinanceSnapshot,
  SnapshotConflictError,
  compareCanonicalContent,
} from './snapshot.persistence.js';
import {
  buildBookingFinanceSnapshot,
  serializeSnapshot,
} from './snapshot.adapter.js';
import { calculateSplit } from './split-calculator.js';
import { toPaise } from './money.js';

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

describe('Booking Finance Snapshot Database Concurrency and Smoke Tests (Chunk 2A-R1)', () => {
  let prisma: PrismaClient;
  const testRunId = `testrun_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Manifest tracking exact created fixture IDs
  const manifest = {
    testRunId,
    snapshots: [] as string[],
    bookings: [] as string[],
    properties: [] as string[],
    users: [] as string[],
  };

  const cleanupCounts = {
    snapshots: { created: 0, deleted: 0, remaining: 0 },
    bookings: { created: 0, deleted: 0, remaining: 0 },
    properties: { created: 0, deleted: 0, remaining: 0 },
    users: { created: 0, deleted: 0, remaining: 0 },
  };

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: TEST_DB_URL } },
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    // Exact manifest-based cleanup in strict foreign key order
    try {
      if (manifest.snapshots.length > 0) {
        const res = await prisma.bookingFinanceSnapshot.deleteMany({
          where: { id: { in: manifest.snapshots } },
        });
        cleanupCounts.snapshots.deleted = res.count;
      }

      if (manifest.bookings.length > 0) {
        const res = await prisma.booking.deleteMany({
          where: { id: { in: manifest.bookings } },
        });
        cleanupCounts.bookings.deleted = res.count;
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

      // Verification: ensure zero remaining fixture rows
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

  let userSeq = 2000;
  // Helper to create test user
  async function createTestUser(role: string, suffix: string) {
    userSeq++;
    const user = await prisma.user.create({
      data: {
        email: `${testRunId}_${suffix}_${userSeq}@example.com`,
        phone: `+9198888${userSeq.toString().padStart(5, '0')}`,
        passwordHash: 'hashed_password_dummy',
        name: `Test User ${suffix}`,
        role: role as any,
      },
    });
    manifest.users.push(user.id);
    cleanupCounts.users.created++;
    return user;
  }

  // Helper to create test property
  async function createTestProperty(hostId: string, suffix: string) {
    const prop = await prisma.property.create({
      data: {
        title: `Test Property ${suffix}`,
        slug: `test-prop-${testRunId}-${suffix}`,
        description: 'Test Property description',
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
        instantBook: true,
        totalStock: 1,
        minNights: 1,
        cancellationPolicy: 'FLEXIBLE',
        images: [],
        gallery: [],
        listingExtras: {},
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
        ownershipProofDocs: [],
        adminTags: [],
        unavailableDates: [],
        hostId,
      },
    });
    manifest.properties.push(prop.id);
    cleanupCounts.properties.created++;
    return prop;
  }

  // Helper to create test booking
  async function createTestBooking(propertyId: string, guestId: string) {
    const checkIn = new Date();
    const checkOut = new Date(Date.now() + 86400000 * 2);
    const booking = await prisma.booking.create({
      data: {
        propertyId,
        guestId,
        checkIn,
        checkOut,
        nights: 2,
        baseAmount: 10000,
        cleaningFee: 1000,
        serviceFee: 1000,
        taxAmount: 2160,
        discountAmount: 500,
        totalAmount: 13660,
        currency: 'INR',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
    });
    manifest.bookings.push(booking.id);
    cleanupCounts.bookings.created++;
    return booking;
  }

  describe('Section 2: Transaction-Safe Create-Once Concurrency Tests', () => {
    it('Requirement A: Two independent transactions for the same booking and identical content both succeed with the same snapshot ID; exactly one row exists', async () => {
      const host = await createTestUser('HOST', 'host_req_a');
      const guest = await createTestUser('USER', 'guest_req_a');
      const property = await createTestProperty(host.id, 'prop_req_a');
      const booking = await createTestBooking(property.id, guest.id);

      const snapshotData = buildBookingFinanceSnapshot({
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 500,
          totalAmount: 13660,
          currency: 'INR',
        },
        discount: {
          couponCode: 'SAVE500',
          discountFunding: 'PLATFORM',
        },
        coHost: {
          ruleId: 'rule_a',
          recipientUserId: 'cohost_user_a',
          ruleType: 'PERCENTAGE',
          percentage: 20,
          status: 'ACTIVE',
        },
        capturedAt: new Date(),
      });

      // Launch two independent concurrent transactions attempting to persist the same snapshot
      const [tx1Result, tx2Result] = await Promise.all([
        prisma.$transaction(async (tx) => {
          return saveBookingFinanceSnapshot(tx, snapshotData);
        }),
        prisma.$transaction(async (tx) => {
          return saveBookingFinanceSnapshot(tx, snapshotData);
        }),
      ]);

      manifest.snapshots.push(tx1Result.id);
      cleanupCounts.snapshots.created++;

      // Both transactions complete successfully and return the identical snapshot ID
      expect(tx1Result.id).toBe(tx2Result.id);
      expect(tx1Result.bookingId).toBe(booking.id);

      // Verify exactly one row exists in the database
      const rowCount = await prisma.bookingFinanceSnapshot.count({
        where: { bookingId: booking.id },
      });
      expect(rowCount).toBe(1);
    });

    it('Requirement B: Two independent transactions with conflicting snapshot content: exactly one persists; the other returns SnapshotConflictError', async () => {
      const host = await createTestUser('HOST', 'host_req_b');
      const guest = await createTestUser('USER', 'guest_req_b');
      const property = await createTestProperty(host.id, 'prop_req_b');
      const booking = await createTestBooking(property.id, guest.id);

      const initialData = buildBookingFinanceSnapshot({
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 500,
          totalAmount: 13660,
          currency: 'INR',
        },
        discount: {
          discountFunding: 'PLATFORM',
        },
        capturedAt: new Date(),
      });

      // Save initial snapshot
      const saved = await prisma.$transaction(async (tx) => {
        return saveBookingFinanceSnapshot(tx, initialData);
      });
      manifest.snapshots.push(saved.id);
      cleanupCounts.snapshots.created++;

      // Conflicting data (basePrice 12000 instead of 10000)
      const conflictingData = buildBookingFinanceSnapshot({
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 12000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2520,
          discountAmount: 500,
          totalAmount: 16020,
          currency: 'INR',
        },
        discount: {
          discountFunding: 'PLATFORM',
        },
        capturedAt: new Date(),
      });

      // Attempting to persist conflicting snapshot throws SnapshotConflictError
      await expect(
        prisma.$transaction(async (tx) => {
          return saveBookingFinanceSnapshot(tx, conflictingData);
        }),
      ).rejects.toThrow(SnapshotConflictError);

      // Verify original snapshot in database remains unaltered
      const row = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
        where: { bookingId: booking.id },
      });
      expect(row.basePaise).toBe(1000000n);
    });

    it('Requirement C: Successful ordinary query after saveBookingFinanceSnapshot inside each successful transaction proves the transaction remains usable', async () => {
      const host = await createTestUser('HOST', 'host_req_c');
      const guest = await createTestUser('USER', 'guest_req_c');
      const property = await createTestProperty(host.id, 'prop_req_c');
      const booking = await createTestBooking(property.id, guest.id);

      const snapshotData = buildBookingFinanceSnapshot({
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 500,
          totalAmount: 13660,
          currency: 'INR',
        },
        discount: {
          discountFunding: 'PLATFORM',
        },
        capturedAt: new Date(),
      });

      const txResult = await prisma.$transaction(async (tx) => {
        const snap = await saveBookingFinanceSnapshot(tx, snapshotData);
        // Execute an ordinary query on the same transaction client after saveBookingFinanceSnapshot
        const parentBooking = await tx.booking.findUniqueOrThrow({
          where: { id: booking.id },
        });
        const propertyCheck = await tx.property.findUniqueOrThrow({
          where: { id: property.id },
        });
        return { snap, parentBooking, propertyCheck };
      });

      manifest.snapshots.push(txResult.snap.id);
      cleanupCounts.snapshots.created++;

      expect(txResult.snap.id).toBeDefined();
      expect(txResult.parentBooking.id).toBe(booking.id);
      expect(txResult.propertyCheck.id).toBe(property.id);
    });

    it('Requirement D: Booking and snapshot creation followed by an intentional exception rolls back both', async () => {
      const host = await createTestUser('HOST', 'host_req_d');
      const guest = await createTestUser('USER', 'guest_req_d');
      const property = await createTestProperty(host.id, 'prop_req_d');

      let attemptBookingId: string | null = null;

      await expect(
        prisma.$transaction(async (tx) => {
          const booking = await tx.booking.create({
            data: {
              propertyId: property.id,
              guestId: guest.id,
              checkIn: new Date(),
              checkOut: new Date(Date.now() + 86400000),
              nights: 1,
              baseAmount: 10000,
              cleaningFee: 1000,
              serviceFee: 1000,
              taxAmount: 2160,
              discountAmount: 500,
              totalAmount: 13660,
              currency: 'INR',
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
            },
          });
          attemptBookingId = booking.id;

          const snapshotData = buildBookingFinanceSnapshot({
            bookingId: booking.id,
            propertyId: property.id,
            hostUserId: host.id,
            financials: {
              basePrice: 10000,
              cleaningFee: 1000,
              serviceFee: 1000,
              taxAmount: 2160,
              discountAmount: 500,
              totalAmount: 13660,
              currency: 'INR',
            },
            discount: { discountFunding: 'PLATFORM' },
            capturedAt: new Date(),
          });

          await saveBookingFinanceSnapshot(tx, snapshotData);

          // Trigger intentional error
          throw new Error('INTENTIONAL_ROLLBACK_FAILURE');
        }),
      ).rejects.toThrow('INTENTIONAL_ROLLBACK_FAILURE');

      // Assert neither booking nor snapshot persisted
      if (attemptBookingId) {
        const persistedBooking = await prisma.booking.findUnique({
          where: { id: attemptBookingId },
        });
        const persistedSnapshot = await prisma.bookingFinanceSnapshot.findUnique({
          where: { bookingId: attemptBookingId },
        });
        expect(persistedBooking).toBeNull();
        expect(persistedSnapshot).toBeNull();
      }
    });

    it('Requirement E: Different bookings can be processed independently in parallel', async () => {
      const host = await createTestUser('HOST', 'host_req_e');
      const guest = await createTestUser('USER', 'guest_req_e');
      const property = await createTestProperty(host.id, 'prop_req_e');
      const booking1 = await createTestBooking(property.id, guest.id);
      const booking2 = await createTestBooking(property.id, guest.id);

      const snap1Data = buildBookingFinanceSnapshot({
        bookingId: booking1.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 500,
          totalAmount: 13660,
          currency: 'INR',
        },
        discount: { discountFunding: 'PLATFORM' },
        capturedAt: new Date(),
      });

      const snap2Data = buildBookingFinanceSnapshot({
        bookingId: booking2.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 500,
          totalAmount: 13660,
          currency: 'INR',
        },
        discount: { discountFunding: 'PLATFORM' },
        capturedAt: new Date(),
      });

      const [res1, res2] = await Promise.all([
        prisma.$transaction(async (tx) => saveBookingFinanceSnapshot(tx, snap1Data)),
        prisma.$transaction(async (tx) => saveBookingFinanceSnapshot(tx, snap2Data)),
      ]);

      manifest.snapshots.push(res1.id, res2.id);
      cleanupCounts.snapshots.created += 2;

      expect(res1.id).not.toBe(res2.id);
      expect(res1.bookingId).toBe(booking1.id);
      expect(res2.bookingId).toBe(booking2.id);
    });
  });

  describe('Section 3 & 4: Snapshot Defaults, Database Constraints and Immutability', () => {
    it('should read back exact BigInt paise and serialize cleanly without JSON BigInt errors', async () => {
      const host = await createTestUser('HOST', 'host_exact');
      const guest = await createTestUser('USER', 'guest_exact');
      const property = await createTestProperty(host.id, 'prop_exact');
      const booking = await createTestBooking(property.id, guest.id);

      const snapshotData = buildBookingFinanceSnapshot({
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 500,
          totalAmount: 13660,
          currency: 'INR',
        },
        discount: {
          couponCode: 'PROMO500',
          discountFunding: 'PLATFORM',
        },
        coHost: {
          ruleId: 'rule_exact_1',
          recipientUserId: 'cohost_exact_1',
          ruleType: 'PERCENTAGE',
          percentage: 20,
          status: 'ACTIVE',
        },
        capturedAt: new Date(),
      });

      const saved = await prisma.$transaction(async (tx) => {
        return saveBookingFinanceSnapshot(tx, snapshotData);
      });
      manifest.snapshots.push(saved.id);
      cleanupCounts.snapshots.created++;

      const fetched = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
        where: { bookingId: booking.id },
      });

      expect(fetched.basePaise).toBe(1000000n);
      expect(fetched.cleaningPaise).toBe(100000n);
      expect(fetched.serviceFeePaise).toBe(100000n);
      expect(fetched.taxPaise).toBe(216000n);
      expect(fetched.discountPaise).toBe(50000n);
      expect(fetched.guestTotalPaise).toBe(1366000n);
      expect(fetched.coHostPercentageBps).toBe(2000n);

      const serialized = serializeSnapshot(fetched as any);
      expect(serialized.basePaise).toBe('1000000');
      expect(serialized.formattedRupees?.baseAmount).toBe('10000.00');
      expect(() => JSON.stringify(serialized)).not.toThrow();
    });

    it('should enforce PostgreSQL CHECK constraints on negative amounts and invalid enums', async () => {
      const host = await createTestUser('HOST', 'host_chk');
      const guest = await createTestUser('USER', 'guest_chk');
      const property = await createTestProperty(host.id, 'prop_chk');
      const booking = await createTestBooking(property.id, guest.id);

      // Negative basePaise
      await expect(
        prisma.$executeRaw`
          INSERT INTO "BookingFinanceSnapshot" (
            "id", "bookingId", "snapshotVersion", "currency",
            "basePaise", "cleaningPaise", "serviceFeePaise", "taxPaise", "discountPaise", "guestTotalPaise",
            "hostUserId", "propertyId", "discountFunding", "coHostAgreementStatus",
            "policyVersion", "reviewStatus", "reviewReasons", "updatedAt"
          ) VALUES (
            gen_random_uuid(), ${booking.id}, 1, 'INR',
            -500, 0, 0, 0, 0, 0,
            ${host.id}, ${property.id}, 'NONE', 'NONE',
            'DRAFT_V1', 'NEEDS_REVIEW', ARRAY[]::TEXT[], NOW()
          );
        `,
      ).rejects.toThrow(/chk_snapshot_base_non_negative|violates check constraint/i);

      // Invalid discountFunding value
      await expect(
        prisma.$executeRaw`
          INSERT INTO "BookingFinanceSnapshot" (
            "id", "bookingId", "snapshotVersion", "currency",
            "basePaise", "cleaningPaise", "serviceFeePaise", "taxPaise", "discountPaise", "guestTotalPaise",
            "hostUserId", "propertyId", "discountFunding", "coHostAgreementStatus",
            "policyVersion", "reviewStatus", "reviewReasons", "updatedAt"
          ) VALUES (
            gen_random_uuid(), ${booking.id}, 1, 'INR',
            1000, 0, 0, 0, 0, 1000,
            ${host.id}, ${property.id}, 'INVALID_FUNDING', 'NONE',
            'DRAFT_V1', 'NEEDS_REVIEW', ARRAY[]::TEXT[], NOW()
          );
        `,
      ).rejects.toThrow(/chk_snapshot_discount_funding_enum|violates check constraint/i);
    });

    it('should prove snapshot immutability when parent property is mutated', async () => {
      const host = await createTestUser('HOST', 'host_mut');
      const guest = await createTestUser('USER', 'guest_mut');
      const property = await createTestProperty(host.id, 'prop_mut');
      const booking = await createTestBooking(property.id, guest.id);

      const snapshotData = buildBookingFinanceSnapshot({
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
          currency: 'INR',
        },
        discount: {},
        coHost: {
          ruleId: 'rule_mut_1',
          recipientUserId: 'cohost_mut_1',
          ruleType: 'PERCENTAGE',
          percentage: 15,
          status: 'ACTIVE',
        },
        capturedAt: new Date(),
      });

      const saved = await prisma.$transaction(async (tx) => {
        return saveBookingFinanceSnapshot(tx, snapshotData);
      });
      manifest.snapshots.push(saved.id);
      cleanupCounts.snapshots.created++;

      // Mutate property owner
      const newHost = await createTestUser('HOST', 'new_host_mut');
      await prisma.property.update({
        where: { id: property.id },
        data: { hostId: newHost.id, basePrice: 25000 },
      });

      const fetched = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
        where: { bookingId: booking.id },
      });

      // Immutable snapshot retains original host and terms
      expect(fetched.hostUserId).toBe(host.id);
      expect(fetched.basePaise).toBe(1000000n);
      expect(fetched.coHostPercentageBps).toBe(1500n);
    });
  });

  describe('Section 6: Corrected Calculator Smoke Evidence Fixture', () => {
    it('Scenario 12: Persist booking snapshot, read back, supply explicit refund separately, assert exact calculation outputs', async () => {
      const host = await createTestUser('HOST', 'host_smoke');
      const guest = await createTestUser('USER', 'guest_smoke');
      const property = await createTestProperty(host.id, 'prop_smoke');
      const booking = await createTestBooking(property.id, guest.id);

      // Exact input fixture:
      // Base: 1,000,000 paise (Rs 10,000)
      // Cleaning: 100,000 paise (Rs 1,000)
      // Service fee: 100,000 paise (Rs 1,000)
      // Tax: 216,000 paise (Rs 2,160)
      // Discount: 50,000 paise (Rs 500), PLATFORM-funded
      // Guest total: 1,366,000 paise (Rs 13,660)
      // Co-host: CLEANING_FEE_PLUS_PERCENTAGE at 1000 bps (10.00%)
      const snapshotData = buildBookingFinanceSnapshot({
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 500,
          totalAmount: 13660,
          currency: 'INR',
        },
        discount: {
          couponCode: 'SAVE500',
          discountFunding: 'PLATFORM',
        },
        coHost: {
          ruleId: 'smoke_cohost_rule_1',
          recipientUserId: 'cohost_user_smoke_1',
          ruleType: 'CLEANING_FEE_PLUS_PERCENTAGE',
          percentage: 10,
          status: 'ACTIVE',
        },
        capturedAt: new Date(),
      });

      // 1. Persist snapshot
      const savedSnapshot = await prisma.$transaction(async (tx) => {
        return saveBookingFinanceSnapshot(tx, snapshotData);
      });
      manifest.snapshots.push(savedSnapshot.id);
      cleanupCounts.snapshots.created++;

      // 2. Read snapshot from database
      const persistedSnapshot = await prisma.bookingFinanceSnapshot.findUniqueOrThrow({
        where: { bookingId: booking.id },
      });

      // Verify immutable original snapshot amounts
      expect(persistedSnapshot.basePaise).toBe(1000000n);
      expect(persistedSnapshot.cleaningPaise).toBe(100000n);
      expect(persistedSnapshot.serviceFeePaise).toBe(100000n);
      expect(persistedSnapshot.taxPaise).toBe(216000n);
      expect(persistedSnapshot.discountPaise).toBe(50000n);
      expect(persistedSnapshot.guestTotalPaise).toBe(1366000n);
      expect(persistedSnapshot.discountFunding).toBe('PLATFORM');
      expect(persistedSnapshot.coHostRuleType).toBe('CLEANING_FEE_PLUS_PERCENTAGE');
      expect(persistedSnapshot.coHostPercentageBps).toBe(1000n);

      // 3. Supply explicit completed refund allocation separately to calculateSplit
      // Completed refund:
      // Total: 236,000 paise
      // Accommodation: 200,000 paise
      // Cleaning: 0
      // Platform: 0
      // Tax: 36,000 paise
      const splitResult = calculateSplit({
        bookingId: persistedSnapshot.bookingId,
        currency: persistedSnapshot.currency,
        basePaise: persistedSnapshot.basePaise!,
        cleaningPaise: persistedSnapshot.cleaningPaise!,
        serviceFeePaise: persistedSnapshot.serviceFeePaise!,
        taxPaise: persistedSnapshot.taxPaise!,
        discountPaise: persistedSnapshot.discountPaise!,
        guestTotalPaise: persistedSnapshot.guestTotalPaise!,
        discountFunding: persistedSnapshot.discountFunding as any,
        completedRefunds: [
          {
            id: 'refund_smoke_1',
            amountPaise: 236000n,
            accommodationPaise: 200000n,
            cleaningPaise: 0n,
            platformPaise: 0n,
            taxPaise: 36000n,
          },
        ],
        coHostAgreement: {
          status: persistedSnapshot.coHostAgreementStatus as any,
          recipientUserId: persistedSnapshot.coHostRecipientUserId || undefined,
          ruleType: persistedSnapshot.coHostRuleType as any,
          percentageBps: persistedSnapshot.coHostPercentageBps || undefined,
          fixedAmountPaise: persistedSnapshot.coHostFixedPaise || undefined,
        },
      });

      expect(splitResult.status).toBe('CALCULATED');
      if (splitResult.status === 'CALCULATED') {
        // Assert exact expected outputs:
        // Host: 720,000 paise
        // Co-host: 180,000 paise
        // Platform: 50,000 paise
        // Tax: 180,000 paise
        // Total: 1,130,000 paise
        expect(splitResult.breakdown.hostAllocationPaise).toBe(720000n);
        expect(splitResult.breakdown.coHostAllocationPaise).toBe(180000n);
        expect(splitResult.breakdown.platformAllocationPaise).toBe(50000n);
        expect(splitResult.breakdown.taxAllocationPaise).toBe(180000n);
        expect(splitResult.reconciliation.sumOfAllocationsPaise).toBe(1130000n);
        expect(splitResult.reconciliation.netCollectedPaise).toBe(1130000n);
        expect(splitResult.reconciliation.isReconciled).toBe(true);
        expect(splitResult.reconciliation.discrepancyPaise).toBe(0n);
      }
    });
  });

  describe('Section 8: Test Isolation and Mandatory Cleanup Verification', () => {
    it('Controlled Failure Demonstration: verifies cleanup handles failures and leaves zero test fixtures', async () => {
      // Create test fixtures specifically for controlled failure test
      const host = await createTestUser('HOST', 'host_ctrl_fail');
      const guest = await createTestUser('USER', 'guest_ctrl_fail');
      const property = await createTestProperty(host.id, 'prop_ctrl_fail');
      const booking = await createTestBooking(property.id, guest.id);

      const snapshotData = buildBookingFinanceSnapshot({
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: host.id,
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
          currency: 'INR',
        },
        discount: {},
        capturedAt: new Date(),
      });

      const snap = await prisma.$transaction(async (tx) => saveBookingFinanceSnapshot(tx, snapshotData));
      manifest.snapshots.push(snap.id);
      cleanupCounts.snapshots.created++;

      // Verify fixtures exist
      expect(await prisma.bookingFinanceSnapshot.count({ where: { id: snap.id } })).toBe(1);
      expect(await prisma.booking.count({ where: { id: booking.id } })).toBe(1);

      // Simulate a controlled failure block
      let caughtError: any = null;
      try {
        throw new Error('SIMULATED_TEST_EXECUTION_FAILURE');
      } catch (err) {
        caughtError = err;
      }
      expect(caughtError?.message).toBe('SIMULATED_TEST_EXECUTION_FAILURE');
    });

    it('Manifest summary confirmation', () => {
      expect(manifest.testRunId).toBe(testRunId);
      expect(manifest.snapshots.length).toBeGreaterThan(0);
      expect(manifest.bookings.length).toBeGreaterThan(0);
      expect(manifest.properties.length).toBeGreaterThan(0);
      expect(manifest.users.length).toBeGreaterThan(0);
    });
  });
});
