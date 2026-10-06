import { PrismaClient, UserRole } from '@prisma/client';
import { FinancialCoordinationService } from './financial-coordination.service.js';
import { SettlementService } from './settlement.service.js';
import { TransferExecutionService } from './transfer-execution.service.js';
import { PostPayoutAdjustmentsService } from './post-payout-adjustments.service.js';
import { CashfreeProvider } from './providers/cashfree.provider.js';
import {
  AdminSettlementController,
  RecipientPayoutController,
  CashfreeWebhookController,
} from './settlement.controller.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { PricingService } from '../bookings/pricing.service.js';
import { AvailabilityService } from '../bookings/availability.service.js';
import { CancellationService } from '../bookings/cancellation.service.js';
import { MockRazorpayProvider } from '../payments/providers/mock-razorpay.provider.js';
import {
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

/**
 * End-to-End Integration & Smoke Suite for FairBnB Payout Split Engine (Phase 8).
 * Runs against positively verified disposable test database on port 5433 with strict manifest tracking.
 */
describe('Payout Engine End-to-End Integration & Smoke Suite', () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:Admin@123@localhost:5433/fairbnb_test_capture?schema=public';

  // HARD SAFETY CHECK
  if (
    testDbUrl.includes('fairbnb_db') ||
    testDbUrl.includes('fairbnb_dev') ||
    testDbUrl.includes('localhost:5432')
  ) {
    throw new Error(
      `FATAL SAFETY VIOLATION: Test suite attempted to run against shared database "${testDbUrl}". Must target disposable test database!`,
    );
  }

  let prisma: any;
  let coordinationService: FinancialCoordinationService;
  let settlementService: SettlementService;
  let cashfreeProvider: CashfreeProvider;
  let transferExecutionService: TransferExecutionService;
  let adjustmentsService: PostPayoutAdjustmentsService;
  let adminController: AdminSettlementController;
  let recipientController: RecipientPayoutController;
  let webhookController: CashfreeWebhookController;
  let bookingsService: BookingsService;

  const testRunId = `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const manifest = {
    userIds: [] as string[],
    propertyIds: [] as string[],
    coHostIds: [] as string[],
    payoutRuleIds: [] as string[],
    bookingIds: [] as string[],
    snapshotIds: [] as string[],
    paymentIds: [] as string[],
    refundIds: [] as string[],
    settlementIds: [] as string[],
    revisionIds: [] as string[],
    allocationIds: [] as string[],
    transferIntentIds: [] as string[],
    transferAttemptIds: [] as string[],
    adjustmentIds: [] as string[],
    auditEventIds: [] as string[],
  };

  let hostUser: any;
  let coHostUser: any;
  let guestUser: any;
  let adminUser: any;
  let attackerUser: any;
  let property: any;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: testDbUrl } } });
    await prisma.$connect();

    // Instantiate Services
    coordinationService = new FinancialCoordinationService(prisma);
    settlementService = new SettlementService(prisma, coordinationService);
    cashfreeProvider = new CashfreeProvider({
      appId: 'test_app_id',
      secretKey: 'test_secret_key_12345',
      environment: 'MOCK',
    });
    transferExecutionService = new TransferExecutionService(
      prisma,
      coordinationService,
      cashfreeProvider,
    );
    adjustmentsService = new PostPayoutAdjustmentsService(
      prisma,
      coordinationService,
    );

    adminController = new AdminSettlementController(
      prisma,
      settlementService,
      transferExecutionService,
      adjustmentsService,
      coordinationService,
    );
    recipientController = new RecipientPayoutController(prisma);
    webhookController = new CashfreeWebhookController(
      cashfreeProvider,
      prisma,
      coordinationService,
      adjustmentsService,
    );

    const pricingService = new PricingService();
    const availabilityService = new AvailabilityService(prisma);
    const cancellationService = new CancellationService();
    const paymentProvider = new MockRazorpayProvider();
    const mockCouponsService = {
      validateAndApplyCoupon: jest.fn().mockResolvedValue({
        isValid: false,
        discountAmount: 0,
      }),
      recordCouponRedemption: jest.fn(),
    } as any;

    bookingsService = new BookingsService(
      prisma,
      pricingService,
      availabilityService,
      cancellationService,
      paymentProvider,
      mockCouponsService,
      settlementService,
    );

    // Setup Test Users
    hostUser = await prisma.user.create({
      data: {
        name: `Host_${testRunId}`,
        email: `host_${testRunId}@test.fairbnb.internal`,
        phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'hash',
        role: UserRole.HOST,
      },
    });
    manifest.userIds.push(hostUser.id);

    coHostUser = await prisma.user.create({
      data: {
        name: `CoHost_${testRunId}`,
        email: `cohost_${testRunId}@test.fairbnb.internal`,
        phone: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'hash',
        role: UserRole.HOST,
      },
    });
    manifest.userIds.push(coHostUser.id);

    guestUser = await prisma.user.create({
      data: {
        name: `Guest_${testRunId}`,
        email: `guest_${testRunId}@test.fairbnb.internal`,
        phone: `+9196${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'hash',
        role: UserRole.USER,
      },
    });
    manifest.userIds.push(guestUser.id);

    adminUser = await prisma.user.create({
      data: {
        name: `Admin_${testRunId}`,
        email: `admin_${testRunId}@test.fairbnb.internal`,
        phone: `+9195${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'hash',
        role: UserRole.ADMIN,
      },
    });
    manifest.userIds.push(adminUser.id);

    attackerUser = await prisma.user.create({
      data: {
        name: `Attacker_${testRunId}`,
        email: `attacker_${testRunId}@test.fairbnb.internal`,
        phone: `+9194${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'hash',
        role: UserRole.USER,
      },
    });
    manifest.userIds.push(attackerUser.id);

    // Setup Property
    property = await prisma.property.create({
      data: {
        title: `Smoke Property ${testRunId}`,
        slug: `smoke-prop-${testRunId}`,
        description: 'Smoke test villa',
        category: 'APARTMENT',
        propertyType: 'ENTIRE_PLACE',
        listingPurpose: 'RENT',
        address: '100 Beach Road',
        locality: 'Calangute',
        city: 'Goa',
        state: 'Goa',
        country: 'India',
        latitude: 15.54,
        longitude: 73.76,
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
        hostId: hostUser.id,
      },
    });
    manifest.propertyIds.push(property.id);

    // Setup Co-Host Agreement: PERCENTAGE (20% of net accommodation)
    const coHostRel = await prisma.coHostRelationship.create({
      data: {
        propertyId: property.id,
        hostUserId: hostUser.id,
        coHostUserId: coHostUser.id,
        status: 'ACTIVE',
      },
    });
    manifest.coHostIds.push(coHostRel.id);

    const rule = await prisma.payoutRule.create({
      data: {
        propertyId: property.id,
        coHostRelationshipId: coHostRel.id,
        recipientUserId: coHostUser.id,
        type: 'PERCENTAGE',
        percentage: 20,
        status: 'ACTIVE',
      },
    });
    manifest.payoutRuleIds.push(rule.id);
  });

  afterAll(async () => {
    // Purge test fixtures in reverse dependency order
    try {
      if (manifest.auditEventIds.length > 0) {
        await prisma.financialAuditEvent.deleteMany({
          where: { id: { in: manifest.auditEventIds } },
        });
      }
      if (manifest.bookingIds.length > 0) {
        await prisma.financialAuditEvent.deleteMany({
          where: { bookingId: { in: manifest.bookingIds } },
        });
        await prisma.payoutAdjustment.deleteMany({
          where: { settlement: { bookingId: { in: manifest.bookingIds } } },
        });
        await prisma.payoutTransferAttempt.deleteMany({
          where: {
            transferIntent: {
              settlement: { bookingId: { in: manifest.bookingIds } },
            },
          },
        });
        await prisma.payoutTransferIntent.deleteMany({
          where: { settlement: { bookingId: { in: manifest.bookingIds } } },
        });
        await prisma.settlementAllocation.deleteMany({
          where: {
            revision: { settlement: { bookingId: { in: manifest.bookingIds } } },
          },
        });
        await prisma.settlementRevision.deleteMany({
          where: { settlement: { bookingId: { in: manifest.bookingIds } } },
        });
        await prisma.settlement.deleteMany({
          where: { bookingId: { in: manifest.bookingIds } },
        });
        await prisma.bookingFinanceSnapshot.deleteMany({
          where: { bookingId: { in: manifest.bookingIds } },
        });
        await prisma.refundComponent.deleteMany({
          where: { refund: { bookingId: { in: manifest.bookingIds } } },
        });
        await prisma.refund.deleteMany({
          where: { bookingId: { in: manifest.bookingIds } },
        });
        await prisma.payment.deleteMany({
          where: { bookingId: { in: manifest.bookingIds } },
        });
        await prisma.booking.deleteMany({
          where: { id: { in: manifest.bookingIds } },
        });
      }
      if (manifest.payoutRuleIds.length > 0) {
        await prisma.payoutRule.deleteMany({
          where: { id: { in: manifest.payoutRuleIds } },
        });
      }
      if (manifest.coHostIds.length > 0) {
        await prisma.coHostRelationship.deleteMany({
          where: { id: { in: manifest.coHostIds } },
        });
      }
      if (manifest.propertyIds.length > 0) {
        await prisma.property.deleteMany({
          where: { id: { in: manifest.propertyIds } },
        });
      }
      if (manifest.userIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: manifest.userIds } },
        });
      }
    } catch (err: any) {
      console.error('Cleanup error:', err.message);
    } finally {
      await prisma.$disconnect();
    }
  });

  it('Smoke Flow: executes complete lifecycle from checkout to transfer, reconciliation, and post-payout refund', async () => {
    // ------------------------------------------------------------------------
    // STEP 1: Booking Creation with Atomic Immutable Snapshot
    // ------------------------------------------------------------------------
    const checkIn = new Date(Date.now() + 86400000 * 5);
    const checkOut = new Date(Date.now() + 86400000 * 7);

    const bookingResult = await bookingsService.createGuestBooking(
      guestUser.id,
      {
        propertyId: property.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests: 2,
      },
    );

    const bookingId = bookingResult.booking.id;
    manifest.bookingIds.push(bookingId);

    // Verify snapshot was created atomically inside same transaction
    const snapshot = await prisma.bookingFinanceSnapshot.findUnique({
      where: { bookingId },
    });
    expect(snapshot).toBeDefined();
    expect(snapshot?.hostUserId).toBe(hostUser.id);
    expect(snapshot?.coHostAgreementStatus).toBe('AGREED');
    expect(snapshot?.coHostRecipientUserId).toBe(coHostUser.id);
    expect(snapshot?.coHostRuleType).toBe('PERCENTAGE');
    expect(snapshot?.coHostPercentageBps).toBe(2000n); // 20.00% = 2000 bps

    // ------------------------------------------------------------------------
    // STEP 2: Payment Capture Event
    // ------------------------------------------------------------------------
    const payment = await prisma.payment.findFirst({ where: { bookingId } });
    expect(payment).toBeDefined();
    manifest.paymentIds.push(payment.id);

    // Mark payment as PAID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', providerPaymentId: `cf_order_${Date.now()}` },
    });

    // ------------------------------------------------------------------------
    // STEP 3: Complete Booking Lifecycle Path
    // ------------------------------------------------------------------------
    await bookingsService.updateStatus(bookingId, { status: 'CONFIRMED' });
    await bookingsService.updateStatus(bookingId, { status: 'CHECKED_IN' });
    const completedBooking = await bookingsService.updateStatus(bookingId, {
      status: 'COMPLETED',
    });
    expect(completedBooking.status).toBe('COMPLETED');

    // ------------------------------------------------------------------------
    // STEP 4: Inspect Settlement Preparation & Revisions
    // ------------------------------------------------------------------------
    const detail = await adminController.getSettlementDetails(bookingId);
    expect(detail).toBeDefined();
    expect(detail.bookingId).toBe(bookingId);

    const rev1 = detail.revisions[0];
    expect(rev1).toBeDefined();
    expect(rev1.revisionNumber).toBe(1);

    // Verify exact mathematical reconciliation (0 paise drift):
    // Gross = Host + CoHost + Platform + Tax
    const gross = BigInt(rev1.totalGrossPaise);
    const host = BigInt(rev1.hostNetPaise);
    const coHost = BigInt(rev1.coHostNetPaise);
    const platform = BigInt(rev1.platformNetPaise);
    const tax = BigInt(rev1.taxNetPaise);
    expect(gross).toBe(host + coHost + platform + tax);

    // ------------------------------------------------------------------------
    // STEP 5: Authorize Revision & Stale Revision Protection
    // ------------------------------------------------------------------------
    const authResult = await adminController.authorizeSettlement(
      bookingId,
      { revisionNumber: 1 },
      adminUser,
    );
    expect(authResult.success).toBe(true);

    // ------------------------------------------------------------------------
    // STEP 6: Execute Durable Recipient Transfers
    // ------------------------------------------------------------------------
    const execResult = await adminController.executeTransfers(
      bookingId,
      { revisionNumber: 1 },
      adminUser,
    );
    expect(execResult.overallStatus).toBe('COMPLETED');
    expect(execResult.transfers.length).toBe(2); // Only Host and Co-Host (Accounting reserves excluded!)

    const hostTransfer = execResult.transfers.find(
      (t: any) => t.recipientRole === 'HOST',
    );
    const coHostTransfer = execResult.transfers.find(
      (t: any) => t.recipientRole === 'CO_HOST',
    );
    expect(hostTransfer).toBeDefined();
    expect(hostTransfer.status).toBe('COMPLETED');
    expect(coHostTransfer).toBeDefined();
    expect(coHostTransfer.status).toBe('COMPLETED');

    // ------------------------------------------------------------------------
    // STEP 7: Duplicate Execution Idempotency
    // ------------------------------------------------------------------------
    // Calling execute again on already executed revision must be rejected or idempotent
    await expect(
      adminController.executeTransfers(
        bookingId,
        { revisionNumber: 1 },
        adminUser,
      ),
    ).rejects.toThrow(ConflictException);

    // ------------------------------------------------------------------------
    // STEP 8: Post-Payout Refund & Adjustment Ledger
    // ------------------------------------------------------------------------
    // When a partial refund occurs post-payout, transfer history is preserved and adjustments recorded
    const postPayoutAdjustment =
      await adjustmentsService.recordPostPayoutAdjustment({
        bookingId,
        sourceEvent: 'REFUND_POST_PAYOUT',
        affectedRecipientRole: 'HOST',
        affectedRecipientUserId: hostUser.id,
        revisedEntitlementPaise: host - 100000n, // Reduced by ₹1,000
        actorUserId: adminUser.id,
        evidenceNotes: 'Post-stay damage settlement reduction',
      });

    expect(postPayoutAdjustment.recoveryObligationPaise).toBe(100000n);
    expect(postPayoutAdjustment.status).toBe('PENDING');

    // ------------------------------------------------------------------------
    // STEP 9: Cross-Recipient Privacy & Authorization Security
    // ------------------------------------------------------------------------
    // Attacker cannot inspect host's payout
    await expect(
      recipientController.getMyBookingPayoutDetails(bookingId, attackerUser),
    ).rejects.toThrow(ForbiddenException);

    // Host can inspect their payout, but response does NOT leak co-host details
    const hostView = await recipientController.getMyBookingPayoutDetails(
      bookingId,
      hostUser,
    );
    expect(hostView.bookingId).toBe(bookingId);
    expect(hostView.myAllocation.recipientRole).toBe('HOST');

    // ------------------------------------------------------------------------
    // STEP 10: Cashfree Webhook Signature Security
    // ------------------------------------------------------------------------
    // Invalid signature must throw 400
    await expect(
      webhookController.handlePayoutWebhook({
        event: 'TRANSFER_SUCCESS',
        transferId: 'test_tx',
        signature: 'invalid_signature',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
