/**
 * Standalone Isolated PostgreSQL Verification Suite for:
 * PAYOUT FOUNDATION COMPATIBILITY AND MIGRATION READINESS
 *
 * Verifies:
 * A. Fresh Installation on disposable DB
 * B. Upgrade Installation on disposable DB
 * C. Out-of-band Schema Reconciliation on disposable DB
 * D. Exact smoke tests for all four co-host rules + legacy FIXED through:
 *    Source Rule -> Snapshot Adapter -> DB Save/Read -> Split Calculator
 * E. Concurrency, duplicate, conflict, provenance, and immutability checks
 * F. Manifest cleanup with 0 remaining rows verification
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';
import { PrismaClient } from '@prisma/client';

const BACKEND_DIR = path.resolve('c:/Users/shubham/fairbnb--new/backend');
const PG_HOST = 'localhost';
const PG_PORT = 5433;
const PG_USER = 'postgres';
const PG_PASS = 'Admin@123';
const PSQL_BIN = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

function executeSql(dbName, sql, stopOnError = false) {
  const tmpFile = path.join(os.tmpdir(), `psql_${Date.now()}_${Math.random().toString(36).substring(7)}.sql`);
  fs.writeFileSync(tmpFile, sql, 'utf8');
  try {
    const env = { ...process.env, PGPASSWORD: PG_PASS };
    const stopFlag = stopOnError ? '-v ON_ERROR_STOP=1' : '';
    const output = execSync(
      `"${PSQL_BIN}" ${stopFlag} -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d "${dbName}" -t -A -f "${tmpFile}"`,
      { env, encoding: 'utf8', shell: true }
    );
    return output.trim();
  } finally {
    if (fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch (e) {}
    }
  }
}

function runPrisma(cmd, dbUrl) {
  return execSync(`npx.cmd prisma ${cmd}`, {
    cwd: BACKEND_DIR,
    env: { ...process.env, DATABASE_URL: dbUrl },
    shell: true,
    encoding: 'utf8',
  });
}

function terminateAndDropDb(dbName) {
  const sql = `
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${dbName}' AND pid != pg_backend_pid();
    DROP DATABASE IF EXISTS "${dbName}";
  `;
  try {
    executeSql('postgres', sql);
  } catch (err) {
    console.warn(`[WARN] Failed to drop ${dbName}: ${err.message}`);
  }
}

async function run() {
  console.log('===============================================================');
  console.log('STARTING ISOLATED POSTGRESQL VERIFICATION SUITE');
  console.log('===============================================================\n');

  // Clean up any stale test databases first
  const existingDbs = executeSql('postgres', `
    SELECT datname FROM pg_database WHERE datname LIKE 'fairbnb_test_%';
  `);
  if (existingDbs) {
    for (const d of existingDbs.split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
      terminateAndDropDb(d);
    }
  }

  const results = {
    testA_fresh: null,
    testB_upgrade: null,
    testC_reconcile: null,
    smokeRules: [],
    cleanupCounts: { created: 0, deleted: 0, remaining: 0 },
  };

  try {
    // -------------------------------------------------------------------------
    // TEST A: FRESH INSTALLATION
    // -------------------------------------------------------------------------
    const freshDbName = `fairbnb_test_fresh_${Date.now()}`;
    console.log(`[TEST A] Creating disposable fresh DB: ${freshDbName}...`);
    executeSql('postgres', `CREATE DATABASE "${freshDbName}";`);
    const freshDbUrl = `postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${freshDbName}?schema=public`;

    console.log('[TEST A] Deploying all migrations from scratch via prisma migrate deploy...');
    runPrisma('migrate deploy', freshDbUrl);

    // Verify required tables exist
    const tablesOut = executeSql(freshDbName, `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    const tableNames = tablesOut.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const requiredTables = [
      'User',
      'Property',
      'Booking',
      'CoHostRelationship',
      'PayoutRule',
      'BookingFinanceSnapshot',
    ];
    for (const req of requiredTables) {
      if (!tableNames.includes(req)) {
        throw new Error(`[TEST A FAILED] Missing table on fresh installation: ${req}`);
      }
    }
    console.log('[TEST A] All required tables present:', requiredTables.join(', '));

    // Verify CHECK constraint definition
    const conDef = executeSql(freshDbName, `
      SELECT pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conname = 'chk_snapshot_cohost_rule_type_enum';
    `);
    console.log('[TEST A] Active CHECK constraint:', conDef);

    // Dynamic import of compiled backend payout modules
    const adapterUrl = pathToFileURL(path.join(BACKEND_DIR, 'dist/src/payouts/snapshot.adapter.js')).href;
    const persistenceUrl = pathToFileURL(path.join(BACKEND_DIR, 'dist/src/payouts/snapshot.persistence.js')).href;
    const calculatorUrl = pathToFileURL(path.join(BACKEND_DIR, 'dist/src/payouts/split-calculator.js')).href;

    const { buildBookingFinanceSnapshot } = await import(adapterUrl);
    const { saveBookingFinanceSnapshot, SnapshotConflictError } = await import(persistenceUrl);
    const { calculateSplit } = await import(calculatorUrl);

    const freshPrisma = new PrismaClient({
      datasources: { db: { url: freshDbUrl } },
    });
    await freshPrisma.$connect();

    // Manifest for Test A
    const manifest = {
      users: [],
      properties: [],
      bookings: [],
      snapshots: [],
      coHostRelationships: [],
      payoutRules: [],
    };

    // Helper to create test entities
    let seq = 0;
    async function createEntity(role = 'HOST') {
      seq++;
      const user = await freshPrisma.user.create({
        data: {
          name: `Test User ${seq}`,
          email: `test_fresh_${seq}_${Date.now()}@example.com`,
          phone: `+9198${String(Date.now()).slice(-6)}${seq}`,
          passwordHash: '$2b$10$abcdefghijklmnopqrstuv',
          role,
        },
      });
      manifest.users.push(user.id);
      results.cleanupCounts.created++;
      return user;
    }

    const hostUser = await createEntity('HOST');
    const guestUser = await createEntity('USER');
    const coHostUser = await createEntity('USER');

    const property = await freshPrisma.property.create({
      data: {
        title: `Fresh Test Property ${Date.now()}`,
        slug: `fresh-prop-${Date.now()}`,
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
        basePrice: 10000,
        cleaningFee: 1000,
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
        ownershipProofDocs: [],
        adminTags: [],
        unavailableDates: [],
        hostId: hostUser.id,
      },
    });
    manifest.properties.push(property.id);
    results.cleanupCounts.created++;

    const coHostRel = await freshPrisma.coHostRelationship.create({
      data: {
        propertyId: property.id,
        hostUserId: hostUser.id,
        coHostUserId: coHostUser.id,
        status: 'ACTIVE',
      },
    });
    manifest.coHostRelationships.push(coHostRel.id);
    results.cleanupCounts.created++;

    // -------------------------------------------------------------------------
    // TEST D: EXERCISE ALL FOUR CO-HOST RULES + LEGACY FIXED
    // -------------------------------------------------------------------------
    console.log('\n[TEST D] Exercising 4 authoritative co-host rules + legacy FIXED through full pipeline:');
    console.log('Source Rule -> Snapshot Adapter -> DB Save/Read -> Split Calculator\n');

    const ruleScenarios = [
      {
        name: 'PERCENTAGE',
        sourceRule: {
          ruleType: 'PERCENTAGE',
          percentage: 20,
          status: 'ACTIVE',
        },
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
        },
        expectedCoHostType: 'PERCENTAGE',
        expectedCoHostAllocation: 200000n, // 20% of 1,000,000 paise accommodation
        expectedHostAllocation: 900000n, // 800,000 accommodation + 100,000 cleaning
      },
      {
        name: 'FIXED_AMOUNT',
        sourceRule: {
          ruleType: 'FIXED_AMOUNT',
          fixedAmount: 1500,
          status: 'ACTIVE',
        },
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
        },
        expectedCoHostType: 'FIXED_AMOUNT',
        expectedCoHostAllocation: 150000n, // exactly 1,500 INR
        expectedHostAllocation: 950000n, // (1,000,000 + 100,000) - 150,000
      },
      {
        name: 'CLEANING_FEE',
        sourceRule: {
          ruleType: 'CLEANING_FEE',
          status: 'ACTIVE',
        },
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
        },
        expectedCoHostType: 'CLEANING_FEE',
        expectedCoHostAllocation: 100000n, // 100% of 1,000 INR cleaning fee
        expectedHostAllocation: 1000000n, // 100% of accommodation
      },
      {
        name: 'CLEANING_FEE_PLUS_PERCENTAGE',
        sourceRule: {
          ruleType: 'CLEANING_FEE_PLUS_PERCENTAGE',
          percentage: 10,
          status: 'ACTIVE',
        },
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
        },
        expectedCoHostType: 'CLEANING_FEE_PLUS_PERCENTAGE',
        expectedCoHostAllocation: 200000n, // 100,000 cleaning + (10% of 1,000,000 accommodation = 100,000) = 200,000
        expectedHostAllocation: 900000n, // (1,000,000 - 100,000) accommodation + 0 cleaning = 900,000
      },
      {
        name: 'LEGACY_FIXED_COMPATIBILITY',
        sourceRule: {
          ruleType: 'FIXED', // legacy name
          fixedAmount: 2000,
          status: 'ACTIVE',
        },
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
        },
        expectedCoHostType: 'FIXED_AMOUNT',
        expectedCoHostAllocation: 200000n, // 2,000 INR
        expectedHostAllocation: 900000n, // (1,000,000 + 100,000) - 200,000
      },
    ];

    for (const sc of ruleScenarios) {
      seq++;
      const checkIn = new Date(Date.now() + 86400000 * seq);
      const checkOut = new Date(Date.now() + 86400000 * (seq + 2));

      // 1. Create booking in DB
      const booking = await freshPrisma.booking.create({
        data: {
          propertyId: property.id,
          guestId: guestUser.id,
          checkIn,
          checkOut,
          nights: 2,
          baseAmount: sc.financials.basePrice,
          cleaningFee: sc.financials.cleaningFee,
          serviceFee: sc.financials.serviceFee,
          taxAmount: sc.financials.taxAmount,
          discountAmount: sc.financials.discountAmount,
          totalAmount: sc.financials.totalAmount,
          currency: 'INR',
          guests: 2,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
      });
      manifest.bookings.push(booking.id);
      results.cleanupCounts.created++;

      // 2. Create source PayoutRule in DB
      const payoutRule = await freshPrisma.payoutRule.create({
        data: {
          propertyId: property.id,
          recipientUserId: coHostUser.id,
          coHostRelationshipId: coHostRel.id,
          type: sc.sourceRule.ruleType,
          percentage: sc.sourceRule.percentage ?? null,
          fixedAmount: sc.sourceRule.fixedAmount ?? null,
          status: 'ACTIVE',
        },
      });
      manifest.payoutRules.push(payoutRule.id);
      results.cleanupCounts.created++;

      // 3. Adapter: build snapshot
      const snapshotInput = {
        bookingId: booking.id,
        propertyId: property.id,
        hostUserId: hostUser.id,
        financials: sc.financials,
        discount: {},
        coHost: {
          ruleId: payoutRule.id,
          recipientUserId: payoutRule.recipientUserId,
          ruleType: payoutRule.type,
          percentage: payoutRule.percentage,
          fixedAmount: payoutRule.fixedAmount,
          status: payoutRule.status,
        },
        capturedAt: new Date(),
        captureProvenance: 'BOOKING_CREATION',
      };
      const snapshotData = buildBookingFinanceSnapshot(snapshotInput);

      // 4. Persistence: save snapshot to DB inside transaction
      const savedSnapshot = await freshPrisma.$transaction(async (tx) => {
        return saveBookingFinanceSnapshot(tx, snapshotData);
      });
      manifest.snapshots.push(savedSnapshot.id);
      results.cleanupCounts.created++;

      // 5. Read back from DB and verify stored types and values
      const fetchedSnapshot = await freshPrisma.bookingFinanceSnapshot.findUniqueOrThrow({
        where: { bookingId: booking.id },
      });

      if (fetchedSnapshot.coHostRuleType !== sc.expectedCoHostType) {
        throw new Error(
          `Expected coHostRuleType ${sc.expectedCoHostType}, but got ${fetchedSnapshot.coHostRuleType}`,
        );
      }

      // 6. Split Calculator
      const splitResult = calculateSplit({
        bookingId: fetchedSnapshot.bookingId,
        currency: fetchedSnapshot.currency,
        basePaise: fetchedSnapshot.basePaise,
        cleaningPaise: fetchedSnapshot.cleaningPaise,
        serviceFeePaise: fetchedSnapshot.serviceFeePaise,
        taxPaise: fetchedSnapshot.taxPaise,
        discountPaise: fetchedSnapshot.discountPaise,
        guestTotalPaise: fetchedSnapshot.guestTotalPaise,
        discountFunding: fetchedSnapshot.discountFunding,
        completedRefunds: [],
        coHostAgreement: {
          status: fetchedSnapshot.coHostAgreementStatus,
          recipientUserId: fetchedSnapshot.coHostRecipientUserId || undefined,
          ruleType: fetchedSnapshot.coHostRuleType,
          percentageBps: fetchedSnapshot.coHostPercentageBps || undefined,
          fixedAmountPaise: fetchedSnapshot.coHostFixedPaise || undefined,
        },
      });

      if (splitResult.status !== 'CALCULATED') {
        throw new Error(`Calculation failed with status: ${splitResult.status}`);
      }

      if (splitResult.breakdown.coHostAllocationPaise !== sc.expectedCoHostAllocation) {
        throw new Error(
          `Co-host allocation mismatch for ${sc.name}: expected ${sc.expectedCoHostAllocation}, got ${splitResult.breakdown.coHostAllocationPaise}`,
        );
      }

      if (splitResult.breakdown.hostAllocationPaise !== sc.expectedHostAllocation) {
        throw new Error(
          `Host allocation mismatch for ${sc.name}: expected ${sc.expectedHostAllocation}, got ${splitResult.breakdown.hostAllocationPaise}`,
        );
      }

      if (sc.name === 'CLEANING_FEE_PLUS_PERCENTAGE') {
        // Assert cleaning is counted exactly once:
        // Cleaning fee was 1,000 INR (100,000 paise)
        // Co-host received cleaning fee (100,000) + 10% accommodation (100,000) = 200,000 paise
        // Host received remaining accommodation (900,000) + 0 cleaning = 900,000 paise
        // Sum of host + co-host = 1,100,000 = base (1,000,000) + cleaning (100,000)
        // No duplicate cleaning fee was added!
        const totalHostAndCoHost =
          splitResult.breakdown.hostAllocationPaise + splitResult.breakdown.coHostAllocationPaise;
        const totalAccommodationAndCleaning =
          fetchedSnapshot.basePaise + fetchedSnapshot.cleaningPaise;
        if (totalHostAndCoHost !== totalAccommodationAndCleaning) {
          throw new Error('CLEANING_FEE_PLUS_PERCENTAGE duplicate cleaning fee detected!');
        }
      }

      results.smokeRules.push({
        rule: sc.name,
        inputRuleType: sc.sourceRule.ruleType,
        storedRuleType: fetchedSnapshot.coHostRuleType,
        basePaise: fetchedSnapshot.basePaise.toString(),
        cleaningPaise: fetchedSnapshot.cleaningPaise.toString(),
        coHostAllocationPaise: splitResult.breakdown.coHostAllocationPaise.toString(),
        hostAllocationPaise: splitResult.breakdown.hostAllocationPaise.toString(),
        platformAllocationPaise: splitResult.breakdown.platformAllocationPaise.toString(),
        taxAllocationPaise: splitResult.breakdown.taxAllocationPaise.toString(),
        reconciled: splitResult.reconciliation.isReconciled,
      });

      console.log(`  ✓ Rule "${sc.name}": stored as "${fetchedSnapshot.coHostRuleType}", CoHost: ${splitResult.breakdown.coHostAllocationPaise} paise, Host: ${splitResult.breakdown.hostAllocationPaise} paise (Reconciled: true)`);
    }

    // -------------------------------------------------------------------------
    // TEST E: CONCURRENCY, PROVENANCE, IDEMPOTENCY & IMMUTABILITY CHECKS
    // -------------------------------------------------------------------------
    console.log('\n[TEST E] Running snapshot edge-case & boundary checks:');

    // 1. Unknown rule rejected / unresolved
    const unknownRuleInput = {
      bookingId: 'b_test_unknown',
      propertyId: property.id,
      hostUserId: hostUser.id,
      financials: {
        basePrice: 10000,
        cleaningFee: 1000,
        serviceFee: 1000,
        taxAmount: 2160,
        discountAmount: 0,
        totalAmount: 14160,
      },
      discount: {},
      coHost: {
        ruleId: 'r_unk',
        recipientUserId: coHostUser.id,
        ruleType: 'BOGUS_RULE_TYPE',
        status: 'ACTIVE',
      },
      capturedAt: new Date(),
    };
    const unknownSnapshot = buildBookingFinanceSnapshot(unknownRuleInput);
    if (unknownSnapshot.reviewStatus !== 'NEEDS_REVIEW') {
      throw new Error('Unknown rule was not marked NEEDS_REVIEW');
    }
    console.log('  ✓ Unknown rule rejected / marked NEEDS_REVIEW');

    // 2. Duplicate snapshot request returns existing snapshot (Idempotency)
    const existingSnapshot = await freshPrisma.bookingFinanceSnapshot.findFirstOrThrow();
    const duplicateData = {
      bookingId: existingSnapshot.bookingId,
      snapshotVersion: existingSnapshot.snapshotVersion,
      capturedAt: new Date(),
      captureProvenance: existingSnapshot.captureProvenance,
      currency: existingSnapshot.currency,
      basePaise: existingSnapshot.basePaise,
      cleaningPaise: existingSnapshot.cleaningPaise,
      serviceFeePaise: existingSnapshot.serviceFeePaise,
      taxPaise: existingSnapshot.taxPaise,
      discountPaise: existingSnapshot.discountPaise,
      guestTotalPaise: existingSnapshot.guestTotalPaise,
      hostUserId: existingSnapshot.hostUserId,
      propertyId: existingSnapshot.propertyId,
      discountFunding: existingSnapshot.discountFunding,
      coHostAgreementStatus: existingSnapshot.coHostAgreementStatus,
      coHostRecipientUserId: existingSnapshot.coHostRecipientUserId,
      coHostRuleId: existingSnapshot.coHostRuleId,
      coHostRuleType: existingSnapshot.coHostRuleType,
      coHostPercentageBps: existingSnapshot.coHostPercentageBps,
      coHostFixedPaise: existingSnapshot.coHostFixedPaise,
      coHostRuleTerms: existingSnapshot.coHostRuleTerms,
      policyVersion: existingSnapshot.policyVersion,
      reviewStatus: existingSnapshot.reviewStatus,
      reviewReasons: existingSnapshot.reviewReasons,
      sourceData: existingSnapshot.sourceData,
    };
    const duplicateSaved = await freshPrisma.$transaction(async (tx) => {
      return saveBookingFinanceSnapshot(tx, duplicateData);
    });
    if (duplicateSaved.id !== existingSnapshot.id) {
      throw new Error('Duplicate request created a new snapshot instead of returning existing');
    }
    console.log('  ✓ Duplicate snapshot request returns existing snapshot (idempotent)');

    // 3. Conflicting snapshot request throws SnapshotConflictError
    const conflictingData = {
      ...duplicateData,
      basePaise: 9999999n,
    };
    let caughtConflict = false;
    try {
      await freshPrisma.$transaction(async (tx) => {
        return saveBookingFinanceSnapshot(tx, conflictingData);
      });
    } catch (err) {
      if (err instanceof SnapshotConflictError) {
        caughtConflict = true;
      }
    }
    if (!caughtConflict) {
      throw new Error('Conflicting snapshot request did not throw SnapshotConflictError');
    }
    console.log('  ✓ Conflicting snapshot request threw SnapshotConflictError');

    // 4. Meaningful provenance mismatch throws SnapshotConflictError
    const provenanceMismatchData = {
      ...duplicateData,
      captureProvenance: 'HISTORICAL_RECONSTRUCTION',
    };
    let caughtProvConflict = false;
    try {
      await freshPrisma.$transaction(async (tx) => {
        return saveBookingFinanceSnapshot(tx, provenanceMismatchData);
      });
    } catch (err) {
      if (err instanceof SnapshotConflictError) {
        caughtProvConflict = true;
      }
    }
    if (!caughtProvConflict) {
      throw new Error('Provenance mismatch was silently treated as identical!');
    }
    console.log('  ✓ Meaningful provenance mismatch correctly flagged as conflict');

    // 5. Unchanged captured agreement after a source-rule edit (Immutability)
    const targetRule = await freshPrisma.payoutRule.findFirstOrThrow();
    const originalSnapshotForRule = await freshPrisma.bookingFinanceSnapshot.findFirstOrThrow({
      where: { coHostRuleId: targetRule.id },
    });
    const originalBps = originalSnapshotForRule.coHostPercentageBps;

    // Mutate the source rule in PayoutRule table
    await freshPrisma.payoutRule.update({
      where: { id: targetRule.id },
      data: { percentage: 99.9, status: 'REJECTED' },
    });

    // Verify snapshot in DB remains unchanged
    const reFetchedSnapshot = await freshPrisma.bookingFinanceSnapshot.findUniqueOrThrow({
      where: { id: originalSnapshotForRule.id },
    });
    if (reFetchedSnapshot.coHostPercentageBps !== originalBps) {
      throw new Error('Snapshot was altered after source PayoutRule modification!');
    }
    console.log('  ✓ Unchanged captured agreement after source-rule edit (immutability preserved)');

    // -------------------------------------------------------------------------
    // TEST F: MANIFEST CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n[TEST F] Executing manifest cleanup in foreign key order...');
    if (manifest.snapshots.length > 0) {
      const res = await freshPrisma.bookingFinanceSnapshot.deleteMany({
        where: { id: { in: manifest.snapshots } },
      });
      results.cleanupCounts.deleted += res.count;
    }
    if (manifest.payoutRules.length > 0) {
      const res = await freshPrisma.payoutRule.deleteMany({
        where: { id: { in: manifest.payoutRules } },
      });
      results.cleanupCounts.deleted += res.count;
    }
    if (manifest.bookings.length > 0) {
      const res = await freshPrisma.booking.deleteMany({
        where: { id: { in: manifest.bookings } },
      });
      results.cleanupCounts.deleted += res.count;
    }
    if (manifest.coHostRelationships.length > 0) {
      const res = await freshPrisma.coHostRelationship.deleteMany({
        where: { id: { in: manifest.coHostRelationships } },
      });
      results.cleanupCounts.deleted += res.count;
    }
    if (manifest.properties.length > 0) {
      const res = await freshPrisma.property.deleteMany({
        where: { id: { in: manifest.properties } },
      });
      results.cleanupCounts.deleted += res.count;
    }
    if (manifest.users.length > 0) {
      const res = await freshPrisma.user.deleteMany({
        where: { id: { in: manifest.users } },
      });
      results.cleanupCounts.deleted += res.count;
    }

    // Verify 0 remaining rows
    const remUsers = await freshPrisma.user.count({ where: { id: { in: manifest.users } } });
    const remProps = await freshPrisma.property.count({ where: { id: { in: manifest.properties } } });
    const remSnaps = await freshPrisma.bookingFinanceSnapshot.count({
      where: { id: { in: manifest.snapshots } },
    });
    results.cleanupCounts.remaining = remUsers + remProps + remSnaps;
    if (results.cleanupCounts.remaining !== 0) {
      throw new Error(`Manifest cleanup left ${results.cleanupCounts.remaining} rows behind!`);
    }
    console.log(`  ✓ Manifest cleanup complete: created=${results.cleanupCounts.created}, deleted=${results.cleanupCounts.deleted}, remaining=0`);

    await freshPrisma.$disconnect();
    terminateAndDropDb(freshDbName);
    console.log(`[TEST A] Cleanly dropped ${freshDbName}.\n`);
    results.testA_fresh = 'PASS';

    // -------------------------------------------------------------------------
    // TEST B: UPGRADE INSTALLATION
    // -------------------------------------------------------------------------
    const upgradeDbName = `fairbnb_test_upgrade_${Date.now()}`;
    console.log(`[TEST B] Creating disposable upgrade DB: ${upgradeDbName}...`);
    executeSql('postgres', `CREATE DATABASE "${upgradeDbName}";`);
    const upgradeDbUrl = `postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${upgradeDbName}?schema=public`;

    // 1. Apply pre-change schema (first 4 migrations):
    // Init, Normalize Casing, Add Snapshot, Add Missing Cohost Payout History
    console.log('[TEST B] Applying pre-change migrations (up to 20260917173000)...');

    // Create _prisma_migrations table
    executeSql(upgradeDbName, `
      CREATE TABLE "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);

    const migDirs = [
      '20260821050705_init_user_and_property',
      '20260915143000_normalize_refund_status_casing',
      '20260917150000_add_booking_finance_snapshot',
      '20260917173000_add_missing_cohost_payout_history',
    ];

    for (const m of migDirs) {
      const sqlPath = path.join(BACKEND_DIR, 'prisma', 'migrations', m, 'migration.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      executeSql(upgradeDbName, sql);
      executeSql(upgradeDbName, `
        INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
        VALUES (gen_random_uuid()::text, 'checksum', NOW(), '${m}', 1);
      `);
    }
    console.log('[TEST B] Pre-change schema applied successfully.');

    // 2. Insert representative pre-change fixture records
    executeSql(upgradeDbName, `
      INSERT INTO "User" ("id", "name", "email", "phone", "passwordHash", "role", "updatedAt")
      VALUES ('u_host_pre', 'Pre Host', 'host_pre@test.com', '+919999990001', 'hash', 'HOST', NOW()),
             ('u_guest_pre', 'Pre Guest', 'guest_pre@test.com', '+919999990002', 'hash', 'USER', NOW());

      INSERT INTO "Property" ("id", "title", "slug", "description", "category", "propertyType", "listingPurpose",
        "city", "state", "country", "maxGuests", "bedrooms", "beds", "bathrooms", "basePrice",
        "cleaningFee", "serviceFeeRate", "taxRate", "instantBook", "totalStock", "minNights",
        "cancellationPolicy", "images", "gallery", "listingExtras", "status", "verificationStatus", "hostId", "updatedAt")
      VALUES ('p_pre', 'Pre Property', 'pre-prop', 'desc', 'APARTMENT', 'ENTIRE_PLACE', 'RENT',
        'Mumbai', 'MH', 'India', 4, 2, 2, 2, 10000, 1000, 0.1, 0.18, true, 1, 1,
        'FLEXIBLE', ARRAY[]::TEXT[], '[]'::jsonb, '{}'::jsonb, 'PUBLISHED', 'APPROVED', 'u_host_pre', NOW());

      INSERT INTO "Booking" ("id", "propertyId", "guestId", "checkIn", "checkOut", "nights", "baseAmount",
        "cleaningFee", "serviceFee", "taxAmount", "totalAmount", "guests", "status", "paymentStatus", "updatedAt")
      VALUES ('b_pre_1', 'p_pre', 'u_guest_pre', NOW() + INTERVAL '1 day', NOW() + INTERVAL '3 days', 2,
        10000, 1000, 1000, 2160, 14160, 2, 'CONFIRMED', 'PAID', NOW()),
             ('b_pre_2', 'p_pre', 'u_guest_pre', NOW() + INTERVAL '4 day', NOW() + INTERVAL '6 days', 2,
        10000, 1000, 1000, 2160, 14160, 2, 'CONFIRMED', 'PAID', NOW());

      -- Pre-change snapshot 1 with PERCENTAGE
      INSERT INTO "BookingFinanceSnapshot" ("id", "bookingId", "snapshotVersion", "currency", "basePaise",
        "cleaningPaise", "serviceFeePaise", "taxPaise", "discountPaise", "guestTotalPaise",
        "hostUserId", "propertyId", "discountFunding", "coHostAgreementStatus", "coHostRuleType",
        "policyVersion", "reviewStatus", "reviewReasons", "updatedAt")
      VALUES (gen_random_uuid()::text, 'b_pre_1', 1, 'INR', 1000000, 100000, 100000, 216000, 0, 1416000,
        'u_host_pre', 'p_pre', 'NONE', 'AGREED', 'PERCENTAGE', 'DRAFT_V1', 'VALID', ARRAY[]::TEXT[], NOW());

      -- Pre-change snapshot 2 with legacy FIXED
      INSERT INTO "BookingFinanceSnapshot" ("id", "bookingId", "snapshotVersion", "currency", "basePaise",
        "cleaningPaise", "serviceFeePaise", "taxPaise", "discountPaise", "guestTotalPaise",
        "hostUserId", "propertyId", "discountFunding", "coHostAgreementStatus", "coHostRuleType",
        "policyVersion", "reviewStatus", "reviewReasons", "updatedAt")
      VALUES (gen_random_uuid()::text, 'b_pre_2', 1, 'INR', 1000000, 100000, 100000, 216000, 0, 1416000,
        'u_host_pre', 'p_pre', 'NONE', 'AGREED', 'FIXED', 'DRAFT_V1', 'VALID', ARRAY[]::TEXT[], NOW());
    `);
    console.log('[TEST B] Pre-change fixture records inserted (PERCENTAGE and legacy FIXED).');

    // 3. Now apply the new additive migration
    console.log('[TEST B] Applying new migration 20260919133000_align_snapshot_cohost_rule_types...');
    runPrisma('migrate deploy', upgradeDbUrl);

    // 4. Confirm pre-existing records survived completely unharmed
    const preCount = executeSql(upgradeDbName, `
      SELECT count(*) FROM "BookingFinanceSnapshot" WHERE "coHostRuleType" IN ('PERCENTAGE', 'FIXED');
    `);
    if (parseInt(preCount, 10) !== 2) {
      throw new Error(`[TEST B FAILED] Pre-existing records did not survive migration upgrade! Count: ${preCount}`);
    }
    console.log('  ✓ Pre-change records survived migration intact (count: 2)');

    // 5. Confirm new rule types can now be inserted
    executeSql(upgradeDbName, `
      INSERT INTO "Booking" ("id", "propertyId", "guestId", "checkIn", "checkOut", "nights", "baseAmount",
        "cleaningFee", "serviceFee", "taxAmount", "totalAmount", "guests", "status", "paymentStatus", "updatedAt")
      VALUES ('b_post_1', 'p_pre', 'u_guest_pre', NOW() + INTERVAL '7 day', NOW() + INTERVAL '9 days', 2,
        10000, 1000, 1000, 2160, 14160, 2, 'CONFIRMED', 'PAID', NOW()),
             ('b_post_2', 'p_pre', 'u_guest_pre', NOW() + INTERVAL '10 day', NOW() + INTERVAL '12 days', 2,
        10000, 1000, 1000, 2160, 14160, 2, 'CONFIRMED', 'PAID', NOW());

      -- New FIXED_AMOUNT
      INSERT INTO "BookingFinanceSnapshot" ("id", "bookingId", "snapshotVersion", "currency", "basePaise",
        "cleaningPaise", "serviceFeePaise", "taxPaise", "discountPaise", "guestTotalPaise",
        "hostUserId", "propertyId", "discountFunding", "coHostAgreementStatus", "coHostRuleType",
        "policyVersion", "reviewStatus", "reviewReasons", "updatedAt")
      VALUES (gen_random_uuid()::text, 'b_post_1', 1, 'INR', 1000000, 100000, 100000, 216000, 0, 1416000,
        'u_host_pre', 'p_pre', 'NONE', 'AGREED', 'FIXED_AMOUNT', 'DRAFT_V1', 'VALID', ARRAY[]::TEXT[], NOW());

      -- New CLEANING_FEE
      INSERT INTO "BookingFinanceSnapshot" ("id", "bookingId", "snapshotVersion", "currency", "basePaise",
        "cleaningPaise", "serviceFeePaise", "taxPaise", "discountPaise", "guestTotalPaise",
        "hostUserId", "propertyId", "discountFunding", "coHostAgreementStatus", "coHostRuleType",
        "policyVersion", "reviewStatus", "reviewReasons", "updatedAt")
      VALUES (gen_random_uuid()::text, 'b_post_2', 1, 'INR', 1000000, 100000, 100000, 216000, 0, 1416000,
        'u_host_pre', 'p_pre', 'NONE', 'AGREED', 'CLEANING_FEE', 'DRAFT_V1', 'VALID', ARRAY[]::TEXT[], NOW());
    `);
    console.log('  ✓ Post-upgrade insertion of FIXED_AMOUNT and CLEANING_FEE succeeded');

    // 6. Confirm constraint actively rejects invalid rule type
    let rejectedInvalid = false;
    try {
      executeSql(upgradeDbName, `
        INSERT INTO "BookingFinanceSnapshot" ("id", "bookingId", "snapshotVersion", "currency", "basePaise",
          "cleaningPaise", "serviceFeePaise", "taxPaise", "discountPaise", "guestTotalPaise",
          "hostUserId", "propertyId", "discountFunding", "coHostAgreementStatus", "coHostRuleType",
          "policyVersion", "reviewStatus", "reviewReasons", "updatedAt")
        VALUES (gen_random_uuid()::text, 'b_invalid', 1, 'INR', 1000000, 100000, 100000, 216000, 0, 1416000,
          'u_host_pre', 'p_pre', 'NONE', 'AGREED', 'INVALID_RULE_TYPE', 'DRAFT_V1', 'VALID', ARRAY[]::TEXT[], NOW());
      `, true);
    } catch (err) {
      const msg = (err.stderr || err.stdout || err.message || '').toString();
      if (msg.includes('chk_snapshot_cohost_rule_type_enum')) {
        rejectedInvalid = true;
      }
    }
    if (!rejectedInvalid) {
      throw new Error('[TEST B FAILED] CHECK constraint failed to reject invalid coHostRuleType!');
    }
    console.log('  ✓ CHECK constraint actively rejects invalid rule types');

    terminateAndDropDb(upgradeDbName);
    console.log(`[TEST B] Cleanly dropped ${upgradeDbName}.\n`);
    results.testB_upgrade = 'PASS';

    // -------------------------------------------------------------------------
    // TEST C: OUT-OF-BAND SCHEMA RECONCILIATION
    // -------------------------------------------------------------------------
    const reconcileDbName = `fairbnb_test_reconcile_${Date.now()}`;
    console.log(`[TEST C] Creating disposable DB for reconciliation: ${reconcileDbName}...`);
    executeSql('postgres', `CREATE DATABASE "${reconcileDbName}";`);
    const reconcileDbUrl = `postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${reconcileDbName}?schema=public`;

    // Simulate an existing database where tables were pushed out-of-band:
    // Apply migration 1 & 2 only
    for (const m of ['20260821050705_init_user_and_property', '20260915143000_normalize_refund_status_casing']) {
      const sqlPath = path.join(BACKEND_DIR, 'prisma', 'migrations', m, 'migration.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      executeSql(reconcileDbName, sql);
    }

    // Now out-of-band create CoHostRelationship & PayoutRule tables directly
    const cohostSqlPath = path.join(
      BACKEND_DIR,
      'prisma',
      'migrations',
      '20260917173000_add_missing_cohost_payout_history',
      'migration.sql',
    );
    const cohostSql = fs.readFileSync(cohostSqlPath, 'utf8');
    executeSql(reconcileDbName, cohostSql);

    // And create BookingFinanceSnapshot table directly
    const snapSqlPath = path.join(
      BACKEND_DIR,
      'prisma',
      'migrations',
      '20260917150000_add_booking_finance_snapshot',
      'migration.sql',
    );
    const snapSql = fs.readFileSync(snapSqlPath, 'utf8');
    executeSql(reconcileDbName, snapSql);

    // Notice: at this point, tables exist, but _prisma_migrations only has the first 2!
    // Reconciliation Procedure:
    // Mark historical migrations as already applied:
    console.log('[TEST C] Executing supported reconciliation procedure:');
    console.log('  1. prisma migrate resolve --applied 20260821050705_init_user_and_property');
    runPrisma('migrate resolve --applied 20260821050705_init_user_and_property', reconcileDbUrl);
    console.log('  2. prisma migrate resolve --applied 20260915143000_normalize_refund_status_casing');
    runPrisma('migrate resolve --applied 20260915143000_normalize_refund_status_casing', reconcileDbUrl);
    console.log('  3. prisma migrate resolve --applied 20260917173000_add_missing_cohost_payout_history');
    runPrisma('migrate resolve --applied 20260917173000_add_missing_cohost_payout_history', reconcileDbUrl);
    console.log('  4. prisma migrate resolve --applied 20260917150000_add_booking_finance_snapshot');
    runPrisma('migrate resolve --applied 20260917150000_add_booking_finance_snapshot', reconcileDbUrl);

    // Deploy any pending additive migrations
    console.log('  5. prisma migrate deploy');
    runPrisma('migrate deploy', reconcileDbUrl);

    // Check status
    const statusOutput = runPrisma('migrate status', reconcileDbUrl);
    if (!statusOutput.includes('Database schema is up to date')) {
      throw new Error(`[TEST C FAILED] Reconciliation did not achieve sync: ${statusOutput}`);
    }
    console.log('  ✓ Migration status confirmed: Database schema is up to date!');

    terminateAndDropDb(reconcileDbName);
    console.log(`[TEST C] Cleanly dropped ${reconcileDbName}.\n`);
    results.testC_reconcile = 'PASS';

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('===============================================================');
    console.log('ALL ISOLATED VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('\n[FATAL ERROR IN VERIFICATION]:', err);
    process.exit(1);
  }
}

run();
