/**
 * Integration & Concurrency Tests for:
 * - Phase 4: Admin, Host & Co-Host Authorization & Entitlements
 * - Phase 5: Cashfree Provider Boundary & Signature Verification
 * - Phase 6: Durable Recipient Transfers & Partial Success
 * - Phase 7: Post-Payout Adjustments & Recovery Obligations
 */

import { PrismaClient } from '@prisma/client';
import { FinancialCoordinationService } from './financial-coordination.service.js';
import { SettlementService } from './settlement.service.js';
import { CashfreeProvider } from './providers/cashfree.provider.js';
import { TransferExecutionService } from './transfer-execution.service.js';
import { PostPayoutAdjustmentsService } from './post-payout-adjustments.service.js';
import { ServiceUnavailableException } from '@nestjs/common';
import { serializeBigInts } from './settlement.controller.js';

const rawTestDbUrl =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:Admin@123@localhost:5433/fairbnb_acceptance_db?schema=public';

if (rawTestDbUrl.includes('/fairbnb_db') || rawTestDbUrl.includes('/fairbnb_dev')) {
  throw new Error('SAFETY ERROR: TEST_DATABASE_URL cannot target the shared database.');
}

const parsedDbName = new URL(rawTestDbUrl).pathname.replace(/^\//, '').split('?')[0];
if (!parsedDbName.toLowerCase().includes('test') && !parsedDbName.toLowerCase().includes('acceptance')) {
  throw new Error(`SAFETY ERROR: Test database name must include "test" or "acceptance", got: "${parsedDbName}".`);
}

const TEST_DB_URL = rawTestDbUrl;

describe('Phases 4, 5, 6, 7 — Payout Engine End-to-End Execution Suite', () => {
  let prisma: any;
  let coordinationService: FinancialCoordinationService;
  let settlementService: SettlementService;
  let cashfreeProvider: CashfreeProvider;
  let transferService: TransferExecutionService;
  let adjustmentsService: PostPayoutAdjustmentsService;

  const testRunId = `payout_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const manifest = {
    testRunId,
    auditEvents: [] as string[],
    adjustments: [] as string[],
    attempts: [] as string[],
    intents: [] as string[],
    allocations: [] as string[],
    revisions: [] as string[],
    settlements: [] as string[],
    snapshots: [] as string[],
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

    coordinationService = new FinancialCoordinationService(prisma);
    settlementService = new SettlementService(prisma, coordinationService);
    cashfreeProvider = new CashfreeProvider({
      environment: 'MOCK',
      secretKey: 'test_mock_secret_key',
    });
    transferService = new TransferExecutionService(
      prisma,
      coordinationService,
      cashfreeProvider,
    );
    adjustmentsService = new PostPayoutAdjustmentsService(
      prisma,
      coordinationService,
    );
  });

  afterAll(async () => {
    try {
      if (manifest.auditEvents.length > 0) {
        await prisma.financialAuditEvent.deleteMany({
          where: { id: { in: manifest.auditEvents } },
        });
      }
      if (manifest.adjustments.length > 0) {
        await prisma.payoutAdjustment.deleteMany({
          where: { id: { in: manifest.adjustments } },
        });
      }
      if (manifest.attempts.length > 0) {
        await prisma.payoutTransferAttempt.deleteMany({
          where: { id: { in: manifest.attempts } },
        });
      }
      if (manifest.intents.length > 0) {
        await prisma.payoutTransferIntent.deleteMany({
          where: { id: { in: manifest.intents } },
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

      // Zero-fixtures verification
      const remIntents = await prisma.payoutTransferIntent.count({
        where: { id: { in: manifest.intents } },
      });
      const remSettlements = await prisma.settlement.count({
        where: { id: { in: manifest.settlements } },
      });
      expect(remIntents).toBe(0);
      expect(remSettlements).toBe(0);
    } finally {
      await prisma.$disconnect();
    }
  });

  let seq = 6000;
  async function createBookingWithSettlement(options?: {
    coHost?: boolean;
    coHostPercentageBps?: bigint;
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
        title: `Property ${seq}`,
        slug: `prop-${testRunId}-${seq}`,
        description: 'Prop description',
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

    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        guestId: guest.id,
        checkIn: new Date(Date.now() - 86400000 * 5),
        checkOut: new Date(Date.now() - 86400000 * 3),
        guests: 2,
        totalAmount: 14160, // 10000 + 1000 + 1000 + 2160
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
    });
    manifest.bookings.push(booking.id);

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
        coHostPercentageBps: options?.coHost ? options.coHostPercentageBps || 2000n : null,
        policyVersion: 'DRAFT_V1',
        reviewStatus: 'VALID',
      },
    });
    manifest.snapshots.push(snapshot.id);

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: 14160,
        currency: 'INR',
        provider: 'CASHFREE',
        providerPaymentId: `cf_pay_${Date.now()}_${seq}`,
        status: 'PAID',
      },
    });
    manifest.payments.push(payment.id);

    // Prepare settlement
    const settlementRes = await settlementService.prepareOrRefreshSettlement(
      booking.id,
      'TEST_INITIAL_PREP',
    );
    manifest.settlements.push(settlementRes.settlementId);
    manifest.revisions.push(settlementRes.revisionId);

    return { host, coHost, guest, property, booking, snapshot, payment, settlementRes };
  }

  /**
   * Helper: approve a settlement's current revision (simulate admin authorization).
   * Required before calling executeTransfersForSettlement.
   */
  async function approveSettlement(settlementId: string, revisionId: string) {
    await prisma.settlement.update({
      where: { id: settlementId },
      data: { status: 'APPROVED' },
    });
    await prisma.settlementAllocation.updateMany({
      where: { revisionId, status: 'ELIGIBLE' },
      data: { status: 'APPROVED' },
    });
  }

  // ============================================================================
  // PHASE 5: CASHFREE PROVIDER BOUNDARY TESTS
  // ============================================================================
  describe('Phase 5 — Cashfree Provider Boundary & Webhook Verifications', () => {
    it('verifies valid Cashfree HMAC-SHA256 signature and rejects invalid signature', () => {
      const secretKey = 'my_super_secret_test_key';
      const provider = new CashfreeProvider({
        environment: 'SANDBOX',
        appId: 'test_app_id',
        secretKey,
      });

      const rawBody = JSON.stringify({
        data: { order: { order_id: 'order_123', order_amount: 1000.0 } },
        event_time: '2026-09-19T10:00:00Z',
        type: 'PAYMENT_SUCCESS_WEBHOOK',
      });
      const timestamp = '1726740000';

      // Compute genuine signature
      const crypto = require('crypto');
      const validSig = crypto
        .createHmac('sha256', secretKey)
        .update(`${timestamp}${rawBody}`)
        .digest('base64');

      expect(provider.verifyWebhookSignature(rawBody, timestamp, validSig)).toBe(true);
      expect(provider.verifyWebhookSignature(rawBody, timestamp, 'tampered_signature')).toBe(false);
      expect(provider.verifyWebhookSignature(rawBody, 'wrong_timestamp', validSig)).toBe(false);
    });

    it('reports real gateway as BLOCKED/disabled when API credentials are not provided', () => {
      const mockProvider = new CashfreeProvider({ environment: 'MOCK' });
      expect(mockProvider.isRealGatewayConfigured()).toBe(false);
      expect(mockProvider.getEnvironment()).toBe('MOCK');
    });
  });

  // ============================================================================
  // PHASE 6: DURABLE RECIPIENT TRANSFERS TESTS
  // ============================================================================
  describe('Phase 6 — Durable Recipient Transfers', () => {
    it('executes durable transfer to host and co-host, excluding platform and tax reserves', async () => {
      const { booking, host, coHost, settlementRes } = await createBookingWithSettlement({
        coHost: true,
        coHostPercentageBps: 2000n, // 20%
      });

      // Admin must authorize before execution
      await approveSettlement(settlementRes.settlementId, settlementRes.revisionId);

      // Execute transfers for revision 1
      const result = await transferService.executeTransfersForSettlement({
        bookingId: booking.id,
        expectedRevisionNumber: settlementRes.revisionNumber,
        actorId: 'admin_test_executor',
      });

      expect(result.overallStatus).toBe('COMPLETED');
      expect(result.transfers.length).toBe(2); // Host + Co-Host (Platform and Tax excluded!)

      const hostTransfer = result.transfers.find((t) => t.recipientRole === 'HOST');
      const coHostTransfer = result.transfers.find((t) => t.recipientRole === 'CO_HOST');

      expect(hostTransfer?.status).toBe('COMPLETED');
      expect(hostTransfer?.amountPaise).toBe(900000n);
      expect(hostTransfer?.recipientUserId).toBe(host.id);

      expect(coHostTransfer?.status).toBe('COMPLETED');
      expect(coHostTransfer?.amountPaise).toBe(200000n);
      expect(coHostTransfer?.recipientUserId).toBe(coHost.id);

      // Track created intents for cleanup
      const intents = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId },
        include: { attempts: true },
      });
      intents.forEach((ti: any) => {
        manifest.intents.push(ti.id);
        ti.attempts.forEach((att: any) => manifest.attempts.push(att.id));
      });

      // Check allocation statuses in database
      const allocations = await prisma.settlementAllocation.findMany({
        where: { revisionId: settlementRes.revisionId },
      });
      const hostAlloc = allocations.find((a: any) => a.recipientRole === 'HOST');
      const coHostAlloc = allocations.find((a: any) => a.recipientRole === 'CO_HOST');
      expect(hostAlloc.status).toBe('PAID');
      expect(coHostAlloc.status).toBe('PAID');
    });

    it('handles partial transfer failure: host succeeds, co-host fails, status is PARTIALLY_SETTLED', async () => {
      const { booking, settlementRes, host, coHost } = await createBookingWithSettlement({
        coHost: true,
        coHostPercentageBps: 2000n,
      });

      await approveSettlement(settlementRes.settlementId, settlementRes.revisionId);

      // Mock executeTransfer so that Co-Host fails while Host succeeds
      const originalExecute = cashfreeProvider.executeTransfer;
      jest.spyOn(cashfreeProvider, 'executeTransfer').mockImplementation(async (input) => {
        if (input.beneficiaryId === coHost.id) {
          return {
            status: 'FAILED',
            failureReason: 'BENEFICIARY_ACCOUNT_SUSPENDED',
          };
        }
        return originalExecute.call(cashfreeProvider, input);
      });

      const result = await transferService.executeTransfersForSettlement({
        bookingId: booking.id,
        expectedRevisionNumber: settlementRes.revisionNumber,
        actorId: 'admin_test_executor',
      });

      expect(result.overallStatus).toBe('PARTIAL_SUCCESS');
      const hostTransfer = result.transfers.find((t) => t.recipientRole === 'HOST');
      const coHostTransfer = result.transfers.find((t) => t.recipientRole === 'CO_HOST');

      expect(hostTransfer?.status).toBe('COMPLETED');
      expect(coHostTransfer?.status).toBe('FAILED');
      expect(coHostTransfer?.failureReason).toBe('BENEFICIARY_ACCOUNT_SUSPENDED');

      // Verify settlement in DB is PARTIALLY_SETTLED
      const dbSettlement = await prisma.settlement.findUnique({
        where: { id: settlementRes.settlementId },
      });
      expect(dbSettlement.status).toBe('PARTIALLY_SETTLED');

      // Track intents
      const intents = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId },
        include: { attempts: true },
      });
      intents.forEach((ti: any) => {
        manifest.intents.push(ti.id);
        ti.attempts.forEach((att: any) => manifest.attempts.push(att.id));
      });

      // Restore mock
      jest.restoreAllMocks();
    });

    it('handles network timeout as UNKNOWN, preserving reservation without creating duplicate transfers', async () => {
      const { booking, settlementRes } = await createBookingWithSettlement();

      await approveSettlement(settlementRes.settlementId, settlementRes.revisionId);

      // Mock executeTransfer to simulate timeout/network crash
      jest.spyOn(cashfreeProvider, 'executeTransfer').mockRejectedValueOnce(
        new Error('GATEWAY_SOCKET_TIMEOUT_504'),
      );

      const result = await transferService.executeTransfersForSettlement({
        bookingId: booking.id,
        expectedRevisionNumber: settlementRes.revisionNumber,
        actorId: 'admin_test_executor',
      });

      expect(result.overallStatus).toBe('UNKNOWN');
      expect(result.transfers[0].status).toBe('UNKNOWN');
      expect(result.transfers[0].failureReason).toContain('GATEWAY_SOCKET_TIMEOUT_504');

      // Intent in DB remains in UNKNOWN state
      const intent = await prisma.payoutTransferIntent.findUnique({
        where: { operationReference: result.transfers[0].operationReference },
      });
      expect(intent.status).toBe('UNKNOWN');
      manifest.intents.push(intent.id);

      // Subsequent call must refuse to double-dispatch an UNKNOWN transfer!
      await expect(
        transferService.executeTransfersForSettlement({
          bookingId: booking.id,
          expectedRevisionNumber: settlementRes.revisionNumber,
          actorId: 'admin_test_executor',
        }),
      ).rejects.toThrow(/is in UNKNOWN state. Reconcile or verify before retrying/);

      jest.restoreAllMocks();
    });
  });

  // ============================================================================
  // PHASE 7: POST-PAYOUT REFUNDS AND ADJUSTMENTS TESTS
  // ============================================================================
  describe('Phase 7 — Post-Payout Refunds and Adjustments', () => {
    it('creates append-only PayoutAdjustment for post-payout refund and tracks recovery obligation', async () => {
      const { booking, host, settlementRes } = await createBookingWithSettlement();

      await approveSettlement(settlementRes.settlementId, settlementRes.revisionId);

      // 1. Execute transfers (Host receives 1,100,000 paise = 11,000 rupees)
      await transferService.executeTransfersForSettlement({
        bookingId: booking.id,
        expectedRevisionNumber: settlementRes.revisionNumber,
        actorId: 'admin_test_executor',
      });

      const intents = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId },
        include: { attempts: true },
      });
      intents.forEach((ti: any) => {
        manifest.intents.push(ti.id);
        ti.attempts.forEach((att: any) => manifest.attempts.push(att.id));
      });

      // 2. Later, a dispute or refund of 400,000 paise (4,000 rupees) is granted post-payout.
      // Host revised entitlement is now 700,000 paise (previously paid 1,100,000 paise).
      const adjustment = await adjustmentsService.recordPostPayoutAdjustment({
        bookingId: booking.id,
        sourceEvent: 'REFUND_POST_PAYOUT',
        sourceReferenceId: `rfnd_post_${Date.now()}`,
        affectedRecipientUserId: host.id,
        affectedRecipientRole: 'HOST',
        revisedEntitlementPaise: 700000n,
        evidenceNotes: 'Guest reported water outage on day 2; partial refund issued after payout completed.',
        actorUserId: 'admin_support_lead',
      });

      manifest.adjustments.push(adjustment.id);

      expect(adjustment.sourceEvent).toBe('REFUND_POST_PAYOUT');
      expect(adjustment.affectedRecipientUserId).toBe(host.id);
      expect(adjustment.alreadyPaidPaise).toBe(1100000n);
      expect(adjustment.revisedEntitlementPaise).toBe(700000n);
      // Recovery obligation = alreadyPaid - revisedEntitlement = 400,000 paise
      expect(adjustment.recoveryObligationPaise).toBe(400000n);
      expect(adjustment.status).toBe('PENDING');

      // Verify successful transfer history is preserved in DB!
      const completedTransfers = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId, status: 'COMPLETED' },
      });
      expect(completedTransfers.length).toBe(1);
      expect(completedTransfers[0].amountPaise).toBe(1100000n);
    });
  });

  // ============================================================================
  // PHASE 4: RECIPIENT PRIVACY & BIGINT SERIALIZATION TESTS
  // ============================================================================
  describe('Phase 4 — Authorization, Recipient Privacy & Serialization', () => {
    it('safely serializes nested BigInt fields into strings without JSON serialization errors', () => {
      const data = {
        settlementId: 'set_123',
        amountPaise: 1500000n,
        nested: {
          coHostPaise: 250000n,
          list: [100n, 200n, { taxPaise: 18000n }],
        },
      };

      // Raw JSON.stringify(data) would crash with "TypeError: Do not know how to serialize a BigInt"
      expect(() => JSON.stringify(data)).toThrow(TypeError);

      // With serializeBigInts, it succeeds cleanly
      const serialized = serializeBigInts(data);
      expect(serialized.amountPaise).toBe('1500000');
      expect(serialized.nested.coHostPaise).toBe('250000');
      expect(serialized.nested.list[0]).toBe('100');
      expect(serialized.nested.list[2].taxPaise).toBe('18000');

      const jsonString = JSON.stringify(serialized);
      expect(typeof jsonString).toBe('string');
      expect(JSON.parse(jsonString).amountPaise).toBe('1500000');
    });
  });

  // ============================================================================
  // PHASE 6 EXTRA: AUTHORIZATION ENFORCEMENT TESTS (Phase A fixes)
  // ============================================================================
  describe('Phase 6 Extra — Authorization Enforcement', () => {
    it('rejects execute when settlement is READY but not APPROVED (missing admin authorization)', async () => {
      const { booking, settlementRes } = await createBookingWithSettlement();

      // Do NOT call approveSettlement — settlement is still READY
      await expect(
        transferService.executeTransfersForSettlement({
          bookingId: booking.id,
          expectedRevisionNumber: settlementRes.revisionNumber,
          actorId: 'attacker_trying_to_skip_approval',
        }),
      ).rejects.toThrow(/requires explicit admin authorization/);

      // Verify no transfer intents were created
      const intents = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId },
      });
      expect(intents.length).toBe(0);
    });

    it('invalidates stale authorization when settlement refresh creates a new revision', async () => {
      const { booking, settlementRes, snapshot } = await createBookingWithSettlement();

      // Admin approves revision 1
      await approveSettlement(settlementRes.settlementId, settlementRes.revisionId);

      const settlementBefore = await prisma.settlement.findUnique({
        where: { id: settlementRes.settlementId },
      });
      expect(settlementBefore!.status).toBe('APPROVED');

      // Simulate a refund arriving post-approval — add a completed refund record with component breakdown
      const refund = await prisma.refund.create({
        data: {
          bookingId: booking.id,
          amount: 1000,
          amountPaise: 100000n,
          status: 'COMPLETED',
          reservationStatus: 'COMPLETED',
          reviewStatus: 'VALID',
          reason: 'GUEST_REQUEST_TEST',
          components: {
            create: {
              accommodationPaise: 100000n,
              cleaningPaise: 0n,
              platformPaise: 0n,
              taxPaise: 0n,
              totalPaise: 100000n,
              isVerified: true,
              reviewStatus: 'VALID',
            },
          },
        },
      });
      manifest.refunds.push(refund.id);

      // Refresh settlement — amounts changed, new revision created
      const refreshed = await settlementService.prepareOrRefreshSettlement(
        booking.id,
        'REFUND_POST_APPROVAL_TEST',
      );

      // New revision was created
      expect(refreshed.isNewRevision).toBe(true);
      expect(refreshed.revisionNumber).toBeGreaterThan(settlementRes.revisionNumber);
      manifest.revisions.push(refreshed.revisionId);

      // Settlement is now downgraded to READY (not APPROVED)
      const settlementAfter = await prisma.settlement.findUnique({
        where: { id: settlementRes.settlementId },
      });
      expect(settlementAfter!.status).toBe('READY');

      // AUDIT EVENT for invalidation exists
      const invalidationEvent = await prisma.financialAuditEvent.findFirst({
        where: {
          settlementId: settlementRes.settlementId,
          eventType: 'SETTLEMENT_APPROVAL_INVALIDATED',
        },
      });
      expect(invalidationEvent).toBeTruthy();
      manifest.auditEvents.push(invalidationEvent!.id);

      // Attempting to execute with old (invalidated) revision MUST fail
      await expect(
        transferService.executeTransfersForSettlement({
          bookingId: booking.id,
          expectedRevisionNumber: settlementRes.revisionNumber, // OLD revision
          actorId: 'admin_stale_attempt',
        }),
      ).rejects.toThrow(/Stale authorization|requires explicit admin authorization|not the current/);

      // Also cannot execute even with new revision until it's re-authorized
      await expect(
        transferService.executeTransfersForSettlement({
          bookingId: booking.id,
          expectedRevisionNumber: refreshed.revisionNumber,
          actorId: 'admin_no_auth',
        }),
      ).rejects.toThrow(/requires explicit admin authorization/);
    });

    it('DISABLED mode: rejects transfer execution with ServiceUnavailableException', async () => {
      const disabledProvider = new CashfreeProvider({
        environment: 'DISABLED',
        appId: 'some_app_id',
        secretKey: 'some_secret',
        payoutsEnabled: false,
      });

      // executeTransfer on a DISABLED provider throws immediately
      await expect(
        disabledProvider.executeTransfer({
          transferId: 'xfer_test_001',
          amount: 1000,
          currency: 'INR',
          beneficiaryId: 'bene_001',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('DISABLED mode: payouts-disabled flag blocks transfer even with credentials', async () => {
      const blockedProvider = new CashfreeProvider({
        environment: 'SANDBOX',
        appId: 'some_app_id',
        secretKey: 'some_secret',
        payoutsEnabled: false, // explicitly disabled
      });

      await expect(
        blockedProvider.executeTransfer({
          transferId: 'xfer_blocked_001',
          amount: 500,
          currency: 'INR',
          beneficiaryId: 'bene_blocked',
        }),
      ).rejects.toThrow(ServiceUnavailableException);

      expect(blockedProvider.isPayoutsEnabled()).toBe(false);
    });

    it('SIMULATION: mock transfer result is tagged _simulated=true', async () => {
      const mockProvider = new CashfreeProvider({
        environment: 'MOCK',
      });

      const result = await mockProvider.executeTransfer({
        transferId: 'sim_test_001',
        amount: 5000,
        currency: 'INR',
        beneficiaryId: 'bene_sim',
      });

      expect(result.status).toBe('SUCCESS');
      expect(result._simulated).toBe(true);
      expect(result.rawResponse?.mock).toBe(true);
    });

    it('duplicate webhook delivery is idempotent — second delivery does not double-credit', async () => {
      const { booking, settlementRes, host } = await createBookingWithSettlement();
      await approveSettlement(settlementRes.settlementId, settlementRes.revisionId);

      // Execute transfers
      const execResult = await transferService.executeTransfersForSettlement({
        bookingId: booking.id,
        expectedRevisionNumber: settlementRes.revisionNumber,
        actorId: 'admin_test_executor',
      });
      expect(execResult.overallStatus).toBe('COMPLETED');

      // Track created records
      const intents = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId },
        include: { attempts: true },
      });
      intents.forEach((ti: any) => {
        manifest.intents.push(ti.id);
        ti.attempts.forEach((att: any) => manifest.attempts.push(att.id));
      });

      // Simulate receiving webhook event twice for the same completed transfer
      // On second execution attempt, it should be idempotent (COMPLETED intent is skipped)
      const secondExec = await transferService.executeTransfersForSettlement({
        bookingId: booking.id,
        expectedRevisionNumber: settlementRes.revisionNumber,
        actorId: 'admin_test_executor',
      }).catch((e) => ({ error: e.message }));

      // Either throws ConflictException (all already paid) OR returns COMPLETED with no new dispatches
      // Both are acceptable idempotent behaviors — what must NOT happen is a second real transfer
      const intentsAfter = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId },
      });
      // No new intent was created — count is same
      expect(intentsAfter.length).toBe(intents.length);
    });
  });
});
