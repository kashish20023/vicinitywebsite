/**
 * Internal persistence helper for BookingFinanceSnapshot (Chunk 2A).
 *
 * Implements:
 * - Atomic persistence within caller's Prisma transaction client.
 * - Create-once behavior:
 *     - Acquires parameterized lock on the parent Booking row to serialize concurrent snapshot creation.
 *     - If no snapshot exists: creates and returns the snapshot.
 *     - If snapshot already exists with identical business content: returns existing snapshot (idempotent retry).
 *     - If snapshot already exists with conflicting content: throws explicit ConflictException.
 * - Never mutates/updates existing snapshots.
 * - Database uniqueness constraint on bookingId serves as the final backstop.
 */

import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BookingFinanceSnapshotData } from './snapshot.types.js';

export class SnapshotConflictError extends ConflictException {
  constructor(
    public readonly bookingId: string,
    public readonly fieldDifferences: Record<string, { existing: any; incoming: any }>,
  ) {
    super({
      message: `Conflicting financial snapshot content for booking "${bookingId}"`,
      bookingId,
      fieldDifferences,
    });
  }
}

/**
 * Normalizes JSON objects recursively with sorted keys for key-order-insensitive canonical comparison.
 */
export function canonicalizeJson(val: any): string {
  if (val === null || val === undefined) {
    return 'null';
  }
  if (typeof val === 'bigint') {
    return val.toString();
  }
  if (Array.isArray(val)) {
    return `[${val.map(canonicalizeJson).join(',')}]`;
  }
  if (typeof val === 'object') {
    const sortedKeys = Object.keys(val).sort();
    const entries = sortedKeys.map(
      (k) => `${JSON.stringify(k)}:${canonicalizeJson(val[k])}`,
    );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(val);
}

/**
 * Normalizes review reason sets (order-insensitive array).
 */
export function canonicalizeReasonSet(reasons: string[] | null | undefined): string {
  if (!reasons || !Array.isArray(reasons)) return '[]';
  const sorted = [...reasons].sort();
  return JSON.stringify(sorted);
}

/**
 * Compares canonical business content between an existing snapshot and incoming data.
 * Ignores id, capturedAt, createdAt, updatedAt, and retry capture provenance.
 */
export function compareCanonicalContent(
  existing: any,
  incoming: BookingFinanceSnapshotData,
): { identical: boolean; differences: Record<string, { existing: any; incoming: any }> } {
  const differences: Record<string, { existing: any; incoming: any }> = {};

  const scalarFields: Array<keyof BookingFinanceSnapshotData> = [
    'snapshotVersion',
    'captureProvenance',
    'currency',
    'basePaise',
    'cleaningPaise',
    'serviceFeePaise',
    'taxPaise',
    'discountPaise',
    'guestTotalPaise',
    'hostUserId',
    'propertyId',
    'discountFunding',
    'coHostAgreementStatus',
    'coHostRecipientUserId',
    'coHostRuleId',
    'coHostRuleType',
    'coHostPercentageBps',
    'coHostFixedPaise',
    'policyVersion',
    'reviewStatus',
  ];

  for (const field of scalarFields) {
    const existVal = existing[field];
    const incomingVal = incoming[field];

    const normExist =
      typeof existVal === 'bigint'
        ? existVal.toString()
        : existVal === null || existVal === undefined
          ? null
          : String(existVal);

    const normIncoming =
      typeof incomingVal === 'bigint'
        ? incomingVal.toString()
        : incomingVal === null || incomingVal === undefined
          ? null
          : String(incomingVal);

    if (normExist !== normIncoming) {
      differences[field as string] = {
        existing: existVal,
        incoming: incomingVal,
      };
    }
  }

  // Order-insensitive set comparison for review reasons
  const existReasonsNorm = canonicalizeReasonSet(existing.reviewReasons);
  const incomingReasonsNorm = canonicalizeReasonSet(incoming.reviewReasons);
  if (existReasonsNorm !== incomingReasonsNorm) {
    differences['reviewReasons'] = {
      existing: existing.reviewReasons,
      incoming: incoming.reviewReasons,
    };
  }

  // Key-order-insensitive JSON comparison for coHostRuleTerms
  const existTermsNorm = canonicalizeJson(existing.coHostRuleTerms);
  const incomingTermsNorm = canonicalizeJson(incoming.coHostRuleTerms);
  if (existTermsNorm !== incomingTermsNorm) {
    differences['coHostRuleTerms'] = {
      existing: existing.coHostRuleTerms,
      incoming: incoming.coHostRuleTerms,
    };
  }

  // Semantic source data comparison (comparing rawFinancials, rawDiscount, rawCoHost)
  const existSource = existing.sourceData;
  const incomingSource = incoming.sourceData;
  if (existSource || incomingSource) {
    const existSemantic = existSource
      ? {
          rawFinancials: existSource.rawFinancials,
          rawDiscount: existSource.rawDiscount,
          rawCoHost: existSource.rawCoHost,
        }
      : null;
    const incomingSemantic = incomingSource
      ? {
          rawFinancials: incomingSource.rawFinancials,
          rawDiscount: incomingSource.rawDiscount,
          rawCoHost: incomingSource.rawCoHost,
        }
      : null;
    const existSourceNorm = canonicalizeJson(existSemantic);
    const incomingSourceNorm = canonicalizeJson(incomingSemantic);
    if (existSourceNorm !== incomingSourceNorm) {
      differences['sourceData'] = {
        existing: existSource,
        incoming: incomingSource,
      };
    }
  }

  return {
    identical: Object.keys(differences).length === 0,
    differences,
  };
}

/**
 * Saves a BookingFinanceSnapshotData record within an active transaction client.
 *
 * Algorithm:
 * 1. Acquire a parameterized lock on the parent Booking row (`SELECT "id" FROM "Booking" WHERE "id" = $1 FOR UPDATE`).
 *    This ensures concurrent transactions for the same booking serialize safely without causing P2002 aborts.
 * 2. Read existing snapshot after obtaining the lock.
 * 3. If present: compare canonical business content. Return existing if identical, throw SnapshotConflictError if conflicting.
 * 4. If absent: create the snapshot and return it.
 * 5. Retain database uniqueness as the final protection.
 */
export async function saveBookingFinanceSnapshot(
  tx: Prisma.TransactionClient,
  snapshot: BookingFinanceSnapshotData,
) {
  // 1. Acquire parameterized lock on the parent Booking row.
  // Tagged template literal parameterizes snapshot.bookingId as $1.
  await tx.$queryRaw`SELECT "id" FROM "Booking" WHERE "id" = ${snapshot.bookingId} FOR UPDATE;`;

  // 2. Read existing snapshot after obtaining the lock.
  const existing = await tx.bookingFinanceSnapshot.findUnique({
    where: { bookingId: snapshot.bookingId },
  });

  // 3. Compare canonical business content if snapshot exists.
  if (existing) {
    const comparison = compareCanonicalContent(existing, snapshot);
    if (comparison.identical) {
      // Idempotent retry: return existing row unchanged.
      return existing;
    }
    // Conflicting content: reject.
    throw new SnapshotConflictError(snapshot.bookingId, comparison.differences);
  }

  // 4. Create snapshot if absent.
  const created = await tx.bookingFinanceSnapshot.create({
    data: {
      bookingId: snapshot.bookingId,
      snapshotVersion: snapshot.snapshotVersion,
      capturedAt: snapshot.capturedAt,
      captureProvenance: snapshot.captureProvenance,
      currency: snapshot.currency,
      basePaise: snapshot.basePaise,
      cleaningPaise: snapshot.cleaningPaise,
      serviceFeePaise: snapshot.serviceFeePaise,
      taxPaise: snapshot.taxPaise,
      discountPaise: snapshot.discountPaise,
      guestTotalPaise: snapshot.guestTotalPaise,
      hostUserId: snapshot.hostUserId,
      propertyId: snapshot.propertyId,
      discountFunding: snapshot.discountFunding,
      coHostAgreementStatus: snapshot.coHostAgreementStatus,
      coHostRecipientUserId: snapshot.coHostRecipientUserId,
      coHostRuleId: snapshot.coHostRuleId,
      coHostRuleType: snapshot.coHostRuleType,
      coHostPercentageBps: snapshot.coHostPercentageBps,
      coHostFixedPaise: snapshot.coHostFixedPaise,
      coHostRuleTerms: snapshot.coHostRuleTerms as Prisma.InputJsonValue,
      policyVersion: snapshot.policyVersion,
      reviewStatus: snapshot.reviewStatus,
      reviewReasons: snapshot.reviewReasons,
      sourceData: snapshot.sourceData as Prisma.InputJsonValue,
    },
  });

  return created;
}
