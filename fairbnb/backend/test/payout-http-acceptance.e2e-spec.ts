import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { FinancialCoordinationService } from '../src/payouts/financial-coordination.service';
import { SettlementService } from '../src/payouts/settlement.service';

const rawTestDbUrl =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:Admin@123@localhost:5433/fairbnb_acceptance_db?schema=public';

if (rawTestDbUrl.includes('/fairbnb_db') || rawTestDbUrl.includes('/fairbnb_dev')) {
  throw new Error('SAFETY ERROR: Test suite cannot target the shared database.');
}

describe('Payout HTTP Route Acceptance & Security Suite (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let coordinationService: FinancialCoordinationService;
  let settlementService: SettlementService;

  let adminToken: string;
  let hostAToken: string;
  let hostBToken: string;
  let guestToken: string;

  let adminUser: any;
  let hostAUser: any;
  let hostBUser: any;
  let guestUser: any;

  const testRunTag = `http_acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const manifest = {
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
    process.env.DATABASE_URL = rawTestDbUrl;
    process.env.CASHFREE_ENV = 'MOCK';
    process.env.CASHFREE_PAYOUTS_ENABLED = 'true';
    process.env.CASHFREE_SECRET_KEY = 'test_webhook_acceptance_secret_123';

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
    coordinationService = app.get(FinancialCoordinationService);
    settlementService = app.get(SettlementService);

    // Setup Test Users with standard password
    const hash = await bcrypt.hash('AcceptancePass123!', 10);

    adminUser = await prisma.user.create({
      data: {
        name: 'Acceptance Admin',
        email: `${testRunTag}_admin@fairbnb.test`,
        phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: hash,
        role: UserRole.ADMIN,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    });
    manifest.users.push(adminUser.id);

    hostAUser = await prisma.user.create({
      data: {
        name: 'Host Alpha',
        email: `${testRunTag}_host_a@fairbnb.test`,
        phone: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: hash,
        role: UserRole.HOST,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    });
    manifest.users.push(hostAUser.id);

    hostBUser = await prisma.user.create({
      data: {
        name: 'Host Beta',
        email: `${testRunTag}_host_b@fairbnb.test`,
        phone: `+9196${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: hash,
        role: UserRole.HOST,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    });
    manifest.users.push(hostBUser.id);

    guestUser = await prisma.user.create({
      data: {
        name: 'Guest Tester',
        email: `${testRunTag}_guest@fairbnb.test`,
        phone: `+9195${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: hash,
        role: UserRole.USER,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    });
    manifest.users.push(guestUser.id);

    // Authenticate all users via real /auth/login HTTP route
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: 'AcceptancePass123!' })
      .expect(200);
    adminToken = adminRes.body.accessToken;

    const hostARes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: hostAUser.email, password: 'AcceptancePass123!' })
      .expect(200);
    hostAToken = hostARes.body.accessToken;

    const hostBRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: hostBUser.email, password: 'AcceptancePass123!' })
      .expect(200);
    hostBToken = hostBRes.body.accessToken;

    const guestRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: guestUser.email, password: 'AcceptancePass123!' })
      .expect(200);
    guestToken = guestRes.body.accessToken;
  });

  afterAll(async () => {
    // Delete in reverse foreign key order
    try {
      if (manifest.auditEvents.length > 0) {
        await prisma.financialAuditEvent.deleteMany({ where: { id: { in: manifest.auditEvents } } });
      }
      if (manifest.adjustments.length > 0 || manifest.settlements.length > 0) {
        await prisma.payoutAdjustment.deleteMany({
          where: {
            OR: [
              { id: { in: manifest.adjustments } },
              { settlementId: { in: manifest.settlements } },
            ],
          },
        });
      }
      if (manifest.attempts.length > 0) {
        await prisma.payoutTransferAttempt.deleteMany({ where: { id: { in: manifest.attempts } } });
      }
      if (manifest.intents.length > 0) {
        await prisma.payoutTransferIntent.deleteMany({ where: { id: { in: manifest.intents } } });
      }
      if (manifest.allocations.length > 0) {
        await prisma.settlementAllocation.deleteMany({ where: { id: { in: manifest.allocations } } });
      }
      if (manifest.revisions.length > 0) {
        await prisma.settlementRevision.deleteMany({ where: { id: { in: manifest.revisions } } });
      }
      if (manifest.settlements.length > 0) {
        await prisma.settlement.deleteMany({ where: { id: { in: manifest.settlements } } });
      }
      if (manifest.snapshots.length > 0) {
        await prisma.bookingFinanceSnapshot.deleteMany({ where: { id: { in: manifest.snapshots } } });
      }
      if (manifest.refundComponents.length > 0) {
        await prisma.refundComponent.deleteMany({ where: { id: { in: manifest.refundComponents } } });
      }
      if (manifest.refunds.length > 0) {
        await prisma.refund.deleteMany({ where: { id: { in: manifest.refunds } } });
      }
      if (manifest.payments.length > 0) {
        await prisma.payment.deleteMany({ where: { id: { in: manifest.payments } } });
      }
      if (manifest.bookings.length > 0) {
        await prisma.booking.deleteMany({ where: { id: { in: manifest.bookings } } });
      }
      if (manifest.properties.length > 0) {
        await prisma.property.deleteMany({ where: { id: { in: manifest.properties } } });
      }
      if (manifest.users.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: manifest.users } } });
      }
    } finally {
      await prisma.$disconnect();
      await app.close();
    }
  });

  let counter = 1;
  async function createTestBooking(hostUserRecord: any, options?: { coHostUserRecord?: any }) {
    counter++;
    const prop = await prisma.property.create({
      data: {
        title: `Property ${counter} - ${testRunTag}`,
        description: 'Acceptance test listing',
        slug: `prop-${counter}-${testRunTag}`,
        category: 'Villa',
        propertyType: 'Entire Place',
        listingPurpose: 'Rent',
        city: 'Goa',
        state: 'Goa',
        country: 'India',
        maxGuests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        basePrice: 10000,
        instantBook: true,
        totalStock: 1,
        minNights: 1,
        cancellationPolicy: 'FLEXIBLE',
        images: [],
        gallery: [],
        listingExtras: {},
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        hostId: hostUserRecord.id,
      },
    });
    manifest.properties.push(prop.id);

    const booking = await prisma.booking.create({
      data: {
        propertyId: prop.id,
        guestId: guestUser.id,
        checkIn: new Date(Date.now() - 3 * 86400000),
        checkOut: new Date(Date.now() - 1 * 86400000), // Past checkOut -> stay completed
        totalAmount: 10000,
        baseAmount: 9000,
        cleaningFee: 500,
        serviceFee: 500,
        taxAmount: 0,
        guests: 2,
        status: 'COMPLETED',
      },
    });
    manifest.bookings.push(booking.id);

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: 10000,
        status: 'COMPLETED',
        provider: 'CASHFREE',
        providerPaymentId: `tx_acc_${booking.id.slice(-6)}`,
      },
    });
    manifest.payments.push(payment.id);

    // Initial snapshot & settlement
    const snapshot = await prisma.bookingFinanceSnapshot.create({
      data: {
        bookingId: booking.id,
        hostUserId: hostUserRecord.id,
        propertyId: prop.id,
        currency: 'INR',
        basePaise: 900000n,
        cleaningPaise: 50000n,
        serviceFeePaise: 50000n,
        taxPaise: 0n,
        discountPaise: 0n,
        guestTotalPaise: 1000000n,
        discountFunding: 'NONE',
        coHostAgreementStatus: options?.coHostUserRecord ? 'AGREED' : 'NONE',
        coHostRecipientUserId: options?.coHostUserRecord ? options.coHostUserRecord.id : null,
        coHostRuleType: options?.coHostUserRecord ? 'PERCENTAGE' : null,
        coHostPercentageBps: options?.coHostUserRecord ? 2000n : null,
        policyVersion: 'DRAFT_V1',
        reviewStatus: 'VALID',
      },
    });
    manifest.snapshots.push(snapshot.id);

    const settlementRes = await settlementService.prepareOrRefreshSettlement(
      booking.id,
      'ACCEPTANCE_TEST_PREP',
    );
    manifest.settlements.push(settlementRes.settlementId);
    manifest.revisions.push(settlementRes.revisionId);

    const createdAllocations = await prisma.settlementAllocation.findMany({
      where: { revisionId: settlementRes.revisionId },
    });
    createdAllocations.forEach((a) => manifest.allocations.push(a.id));

    return { prop, booking, payment, snapshot, settlementRes };
  }

  // =========================================================================
  // Requirement 1: No approval: no new intent and no provider call
  // =========================================================================
  describe('1. No approval: no new intent and no provider call', () => {
    it('POST /admin/settlements/:bookingId/execute is rejected with 409 when settlement is unapproved', async () => {
      const { booking, settlementRes } = await createTestBooking(hostAUser);

      // Verify settlement is not APPROVED
      const currentSettlement = await prisma.settlement.findUnique({
        where: { id: settlementRes.settlementId },
      });
      expect(currentSettlement?.status).not.toBe('APPROVED');

      // Attempt execution without prior approval
      const res = await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(409);

      expect(res.body.message).toMatch(/cannot be executed|unapproved|requires.*authorization/i);

      // Verify zero transfer intents exist for this settlement
      const intentCount = await prisma.payoutTransferIntent.count({
        where: { settlementId: settlementRes.settlementId },
      });
      expect(intentCount).toBe(0);
    });
  });

  // =========================================================================
  // Requirement 2: Stale approval after refund: execution rejected
  // =========================================================================
  describe('2. Stale approval after refund: execution rejected', () => {
    it('POST /admin/settlements/:bookingId/execute is rejected with 409 when approval is stale', async () => {
      const { booking, settlementRes } = await createTestBooking(hostAUser);

      // Approve revision 1 via HTTP
      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/authorize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      // Verify approved
      const approvedSettlement = await prisma.settlement.findUnique({
        where: { id: settlementRes.settlementId },
      });
      expect(approvedSettlement?.status).toBe('APPROVED');

      // Guest gets a refund, triggering a new financial revision (revision 2)
      const refund = await prisma.refund.create({
        data: {
          bookingId: booking.id,
          amount: 2000,
          amountPaise: 200000n,
          status: 'COMPLETED',
          reservationStatus: 'COMPLETED',
          reviewStatus: 'VALID',
          reason: 'Guest refund',
          components: {
            create: {
              accommodationPaise: 200000n,
              cleaningPaise: 0n,
              platformPaise: 0n,
              taxPaise: 0n,
              totalPaise: 200000n,
              isVerified: true,
              reviewStatus: 'VALID',
            },
          },
        },
      });
      manifest.refunds.push(refund.id);

      // Process refund through settlement refresh
      const refreshed = await settlementService.prepareOrRefreshSettlement(
        booking.id,
        'REFUND_ACCEPTANCE_TEST',
      );
      manifest.revisions.push(refreshed.revisionId);

      // Check that revision increased
      expect(refreshed.revisionNumber).toBeGreaterThan(1);

      // Attempt execution on stale approval (requesting old revision 1)
      const execRes = await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(409);

      expect(execRes.body.message).toMatch(/stale|cannot be executed|unapproved|requires.*authorization/i);
    });
  });

  // =========================================================================
  // Requirement 3: Partial success: approved retry pays only the unpaid recipient
  // =========================================================================
  describe('3. Partial success: approved retry pays only the unpaid recipient', () => {
    it('executing retry on partially-settled allocation only creates intent for unpaid recipient', async () => {
      // Create booking with both Host A and Host B as Co-Host
      const { booking, settlementRes } = await createTestBooking(hostAUser, {
        coHostUserRecord: hostBUser,
      });

      const allocs = await prisma.settlementAllocation.findMany({
        where: { revisionId: settlementRes.revisionId },
      });
      allocs.forEach((a) => {
        if (!manifest.allocations.includes(a.id)) manifest.allocations.push(a.id);
      });
      expect(allocs.length).toBe(4); // HOST, CO_HOST, PLATFORM, TAX_AUTHORITY

      // Approve the settlement
      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/authorize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      // Execute transfers
      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      const firstIntents = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId },
      });
      firstIntents.forEach((ti) => manifest.intents.push(ti.id));
      expect(firstIntents.length).toBe(2);

      // Simulate partial failure: Mark Co-Host's intent as FAILED and allocation as ELIGIBLE (unpaid)
      const hostBIntent = firstIntents.find((ti) => ti.recipientUserId === hostBUser.id)!;
      const coHostAlloc = allocs.find((a) => a.recipientUserId === hostBUser.id)!;

      await prisma.payoutTransferIntent.update({
        where: { id: hostBIntent.id },
        data: { status: 'FAILED' },
      });
      await prisma.settlementAllocation.update({
        where: { id: coHostAlloc.id },
        data: { status: 'ELIGIBLE' },
      });
      await prisma.settlement.update({
        where: { id: settlementRes.settlementId },
        data: { status: 'PARTIALLY_SETTLED' },
      });

      // Execute retry (PARTIALLY_SETTLED permits retry of eligible allocations)
      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      // Check all intents for Host A vs Host B
      const allIntentsHostA = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId, recipientUserId: hostAUser.id },
      });
      const allIntentsHostB = await prisma.payoutTransferIntent.findMany({
        where: { settlementId: settlementRes.settlementId, recipientUserId: hostBUser.id },
      });

      allIntentsHostB.forEach((ti) => {
        if (!manifest.intents.includes(ti.id)) manifest.intents.push(ti.id);
      });

      // Host A was already paid: MUST STILL HAVE ONLY 1 INTENT and 1 ATTEMPT (No double-payment!)
      expect(allIntentsHostA.length).toBe(1);
      expect(['SUCCESS', 'COMPLETED']).toContain(allIntentsHostA[0].status);
      const hostAAttempts = await prisma.payoutTransferAttempt.findMany({
        where: { transferIntentId: allIntentsHostA[0].id },
      });
      expect(hostAAttempts.length).toBe(1);

      // Host B was retried: intent updated to COMPLETED with 2 attempts (failed first, succeeded on retry)!
      expect(allIntentsHostB.length).toBe(1);
      expect(['SUCCESS', 'COMPLETED']).toContain(allIntentsHostB[0].status);
      const hostBAttempts = await prisma.payoutTransferAttempt.findMany({
        where: { transferIntentId: allIntentsHostB[0].id },
      });
      expect(hostBAttempts.length).toBe(2);
    });
  });

  // =========================================================================
  // Requirement 4: UNKNOWN: reconciliation required before another transfer
  // =========================================================================
  describe('4. UNKNOWN: reconciliation required before another transfer', () => {
    it('blocks transfer execution when an UNKNOWN intent exists until reconciled', async () => {
      const { booking, settlementRes } = await createTestBooking(hostAUser);

      // Authorize
      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/authorize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      // Create an intent in UNKNOWN status
      const unknownIntent = await prisma.payoutTransferIntent.create({
        data: {
          settlementId: settlementRes.settlementId,
          recipientUserId: hostAUser.id,
          allocationKey: 'HOST_DEFAULT',
          operationReference: `cf_op_unknown_${Date.now()}`,
          amountPaise: 800000n,
          provider: 'MOCK_PROVIDER',
          status: 'UNKNOWN',
        },
      });
      manifest.intents.push(unknownIntent.id);

      // Attempt execute: MUST be rejected with 409 requiring reconciliation
      const blockedRes = await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(409);

      expect(blockedRes.body.message).toMatch(/unknown|reconcil/i);

      // Reconcile the uncertain transfer via POST /admin/settlements/:bookingId/reconcile
      const reconRes = await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/reconcile`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ transferIntentId: unknownIntent.id })
        .expect(201);

      expect(['SUCCESS', 'COMPLETED']).toContain(reconRes.body.status);

      // Verify intent is now terminal SUCCESS/COMPLETED in database
      const reconciledIntent = await prisma.payoutTransferIntent.findUnique({
        where: { id: unknownIntent.id },
      });
      expect(['SUCCESS', 'COMPLETED']).toContain(reconciledIntent?.status);
    });
  });

  // =========================================================================
  // Requirement 5: Cross-recipient and non-admin access denied
  // =========================================================================
  describe('5. Cross-recipient and non-admin access denied', () => {
    it('rejects non-admin from accessing admin settlements list (403)', async () => {
      await request(app.getHttpServer())
        .get('/admin/settlements')
        .set('Authorization', `Bearer ${hostAToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/admin/settlements')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('rejects non-admin from approving or executing settlements (403)', async () => {
      const { booking, settlementRes } = await createTestBooking(hostAUser);

      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/authorize`)
        .set('Authorization', `Bearer ${hostAToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(403);

      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/execute`)
        .set('Authorization', `Bearer ${hostAToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(403);
    });

    it('prevents Host A from viewing Host B booking payout details (Cross-recipient 403)', async () => {
      const { booking: bookingB } = await createTestBooking(hostBUser);

      // Host B can view their own booking payout details
      const hostBRes = await request(app.getHttpServer())
        .get(`/payouts/me/bookings/${bookingB.id}`)
        .set('Authorization', `Bearer ${hostBToken}`)
        .expect(200);

      expect(hostBRes.body.bookingId).toBe(bookingB.id);
      expect(hostBRes.body.myAllocation).toBeDefined();

      // Host A attempts to view Host B's booking payout details -> MUST return 403 Forbidden!
      await request(app.getHttpServer())
        .get(`/payouts/me/bookings/${bookingB.id}`)
        .set('Authorization', `Bearer ${hostAToken}`)
        .expect(403);

      // Guest attempts to view Host B's booking payout details -> MUST return 403 Forbidden!
      await request(app.getHttpServer())
        .get(`/payouts/me/bookings/${bookingB.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });
  });

  // =========================================================================
  // Requirement 6: Valid, invalid and duplicate webhook processing
  // =========================================================================
  describe('6. Valid, invalid and duplicate webhook processing', () => {
    it('rejects webhooks with missing or tampered signatures (400 Bad Request)', async () => {
      // 1. Tampered signature in body
      const tamperedPayload = {
        event: 'TRANSFER_SUCCESS',
        transferId: 'tx_fake_001',
        referenceId: 'cf_ref_fake_001',
        signature: 'invalid_tampered_signature_base64==',
      };

      await request(app.getHttpServer())
        .post('/payouts/webhook')
        .send(tamperedPayload)
        .expect(400);

      // 2. Missing signature parameter in body
      const missingSigPayload = {
        event: 'TRANSFER_SUCCESS',
        transferId: 'tx_fake_001',
        referenceId: 'cf_ref_fake_001',
      };

      await request(app.getHttpServer())
        .post('/payouts/webhook')
        .send(missingSigPayload)
        .expect(400);
    });

    it('enforces transfer confirmation semantics: acknowledged=0 does not complete intent, subsequent acknowledgement completes it exactly once', async () => {
      const { booking, settlementRes } = await createTestBooking(hostAUser);

      // Authorize & Execute to generate a transfer intent
      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/authorize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      const intent = await prisma.payoutTransferIntent.findFirst({
        where: { settlementId: settlementRes.settlementId },
      });
      expect(intent).toBeDefined();
      manifest.intents.push(intent!.id);

      // Simulate in-flight transfer state before webhook arrival
      await prisma.payoutTransferIntent.update({
        where: { id: intent!.id },
        data: { status: 'SUBMITTED' },
      });
      const preSettlement = await prisma.settlement.findUnique({
        where: { id: settlementRes.settlementId },
        include: { revisions: { include: { allocations: true } } },
      });
      const preHostAlloc = preSettlement!.revisions[0]!.allocations.find(
        (a) => a.recipientUserId === hostAUser.id,
      );
      expect(preHostAlloc).toBeDefined();
      await prisma.settlementAllocation.update({
        where: { id: preHostAlloc!.id },
        data: { status: 'PROCESSING' },
      });

      // Independent signature helper (NOT using production helper)
      const secret = process.env.CASHFREE_SECRET_KEY!;
      const computeSig = (obj: Record<string, any>) => {
        const sortedKeys = Object.keys(obj).filter((k) => k !== 'signature').sort();
        let postData = '';
        for (const k of sortedKeys) {
          const val = obj[k];
          if (val !== null && val !== undefined) postData += String(val);
        }
        return crypto.createHmac('sha256', secret).update(postData).digest('base64');
      };

      // STEP A: Webhook TRANSFER_SUCCESS with acknowledged = 0
      // Remitter account debited, but beneficiary bank credit NOT yet confirmed!
      const ack0Payload: any = {
        event: 'TRANSFER_SUCCESS',
        transferId: intent!.operationReference,
        referenceId: `cf_ref_ack0_${Date.now()}`,
        acknowledged: 0,
        eventTime: '2026-09-19 12:00:00',
        utr: 'UTR_ACK_0_TEST',
      };
      ack0Payload.signature = computeSig(ack0Payload);

      const ack0Res = await request(app.getHttpServer())
        .post('/payouts/webhook')
        .send(ack0Payload)
        .expect(200);
      expect(ack0Res.body.success).toBe(true);

      // Verify intent is NOT COMPLETED and allocation is NOT PAID!
      const intentAfterAck0 = await prisma.payoutTransferIntent.findUnique({
        where: { id: intent!.id },
      });
      expect(intentAfterAck0?.status).not.toBe('COMPLETED');
      expect(['SUBMITTED', 'RESERVED', 'PROCESSING']).toContain(intentAfterAck0?.status);

      const settlementAfterAck0 = await prisma.settlement.findUnique({
        where: { id: settlementRes.settlementId },
        include: { revisions: { include: { allocations: true } } },
      });
      const allocAfterAck0 = settlementAfterAck0?.revisions[0]?.allocations.find(
        (a) => a.recipientUserId === hostAUser.id,
      );
      expect(allocAfterAck0?.status).toBe('PROCESSING'); // NOT PAID!

      // STEP B: Subsequent Webhook TRANSFER_ACKNOWLEDGED
      // Beneficiary bank confirms deposit of funds!
      const ack1Payload: any = {
        event: 'TRANSFER_ACKNOWLEDGED',
        transferId: intent!.operationReference,
        referenceId: ack0Payload.referenceId,
        acknowledged: 1,
      };
      ack1Payload.signature = computeSig(ack1Payload);

      const ack1Res = await request(app.getHttpServer())
        .post('/payouts/webhook')
        .send(ack1Payload)
        .expect(200);
      expect(ack1Res.body.success).toBe(true);

      // Verify intent is now COMPLETED and allocation is PAID exactly once
      const intentAfterAck1 = await prisma.payoutTransferIntent.findUnique({
        where: { id: intent!.id },
      });
      expect(intentAfterAck1?.status).toBe('COMPLETED');

      const settlementAfterAck1 = await prisma.settlement.findUnique({
        where: { id: settlementRes.settlementId },
        include: { revisions: { include: { allocations: true } } },
      });
      const allocAfterAck1 = settlementAfterAck1?.revisions[0]?.allocations.find(
        (a) => a.recipientUserId === hostAUser.id,
      );
      expect(allocAfterAck1?.status).toBe('PAID');

      // STEP C: Duplicate Delivery of TRANSFER_ACKNOWLEDGED
      // Must be idempotent (returns 200 OK without error or double state modification)
      const duplicateRes = await request(app.getHttpServer())
        .post('/payouts/webhook')
        .send(ack1Payload)
        .expect(200);
      expect(duplicateRes.body.success).toBe(true);

      const finalIntent = await prisma.payoutTransferIntent.findUnique({
        where: { id: intent!.id },
      });
      expect(finalIntent?.status).toBe('COMPLETED');
    });

    it('processes TRANSFER_REVERSED webhook by recording FAILED status and post-payout reversal adjustment', async () => {
      const { booking, settlementRes } = await createTestBooking(hostAUser);

      // Authorize & Execute
      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/authorize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/admin/settlements/${booking.id}/execute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionNumber: settlementRes.revisionNumber })
        .expect(201);

      const intent = await prisma.payoutTransferIntent.findFirst({
        where: { settlementId: settlementRes.settlementId },
      });
      expect(intent).toBeDefined();
      manifest.intents.push(intent!.id);

      const secret = process.env.CASHFREE_SECRET_KEY!;
      const computeSig = (obj: Record<string, any>) => {
        const sortedKeys = Object.keys(obj).filter((k) => k !== 'signature').sort();
        let postData = '';
        for (const k of sortedKeys) {
          const val = obj[k];
          if (val !== null && val !== undefined) postData += String(val);
        }
        return crypto.createHmac('sha256', secret).update(postData).digest('base64');
      };

      // Send TRANSFER_REVERSED
      const reversedPayload: any = {
        event: 'TRANSFER_REVERSED',
        transferId: intent!.operationReference,
        referenceId: `cf_ref_rev_${Date.now()}`,
        reason: 'Beneficiary account frozen or closed',
        eventTime: '2026-09-19 12:45:00',
      };
      reversedPayload.signature = computeSig(reversedPayload);

      const revRes = await request(app.getHttpServer())
        .post('/payouts/webhook')
        .send(reversedPayload)
        .expect(200);
      expect(revRes.body.success).toBe(true);

      // Verify intent is FAILED and allocation is REVERSED
      const reversedIntent = await prisma.payoutTransferIntent.findUnique({
        where: { id: intent!.id },
      });
      expect(reversedIntent?.status).toBe('FAILED');

      // Verify post-payout adjustment was recorded
      const adjustments = await prisma.payoutAdjustment.findMany({
        where: { settlementId: settlementRes.settlementId },
      });
      expect(adjustments.length).toBeGreaterThan(0);
      expect(adjustments[0].sourceEvent).toBe('REVERSAL');
      manifest.adjustments.push(...adjustments.map((a) => a.id));
    });
  });
});
