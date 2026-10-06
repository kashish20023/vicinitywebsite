/**
 * Pure Snapshot Adapter for FairBnB (Chunk 2A).
 *
 * Responsibilities:
 * - Validate raw pricing, discount, and co-host agreement facts.
 * - Convert floating-point and string amounts to exact bigint paise without float drift or blind toFixed(2).
 * - Detect sub-basis-point percentage precision and reject unhandled precision.
 * - Validate exact pricing component identity: guestTotal = base + cleaning + serviceFee + tax - discount.
 * - Preserve original source facts in sourceData for auditing.
 * - Never invent terms or substitute zero for unestablished values.
 */

import {
  toPaise,
  fromPaise,
  strictFloatRupeesToPaise,
  isNonNegativePgBigInt,
  SUPPORTED_CURRENCY,
} from './money.js';
import {
  SourceBookingSnapshotInput,
  BookingFinanceSnapshotData,
  SerializedBookingFinanceSnapshot,
  DiscountFundingPolicy,
  CoHostSnapshotStatus,
  SnapshotReviewStatus,
} from './snapshot.types.js';

/**
 * Converts percentage (0.00% to 100.00%) to integer basis points (0 to 10000 bps).
 * Rejects unsupported sub-basis-point fractions without silent rounding.
 */
export function convertPercentageToBps(
  percentage: number | string | null | undefined,
): { bps: bigint | null; exact: boolean; error?: string } {
  if (percentage === null || percentage === undefined) {
    return { bps: null, exact: true };
  }

  if (typeof percentage === 'string') {
    const trimmed = percentage.trim();
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      return {
        bps: null,
        exact: false,
        error: `Invalid percentage string format: "${percentage}"`,
      };
    }
    const parts = trimmed.split('.');
    if (parts.length > 1 && parts[1].length > 2) {
      return {
        bps: null,
        exact: false,
        error: `Unsupported sub-basis-point precision in percentage: "${percentage}" (max 2 decimal places allowed, e.g. 33.33%)`,
      };
    }
    const num = Number(trimmed);
    if (num < 0 || num > 100) {
      return {
        bps: null,
        exact: false,
        error: `Percentage out of bounds (must be 0-100): "${percentage}"`,
      };
    }
    const bps = toPaise(trimmed); // 20.00% as rupee-paise parser gives 2000n
    return { bps, exact: true };
  }

  if (typeof percentage === 'number') {
    if (!Number.isFinite(percentage)) {
      return {
        bps: null,
        exact: false,
        error: `Non-finite percentage: ${percentage}`,
      };
    }
    if (percentage < 0 || percentage > 100) {
      return {
        bps: null,
        exact: false,
        error: `Percentage out of bounds (must be 0-100): ${percentage}`,
      };
    }

    const rawBps = percentage * 100;
    const roundedBps = Math.round(rawBps);
    if (Math.abs(rawBps - roundedBps) > 1e-4) {
      return {
        bps: null,
        exact: false,
        error: `Unsupported sub-basis-point float precision in percentage: ${percentage}`,
      };
    }
    return { bps: BigInt(roundedBps), exact: true };
  }

  return {
    bps: null,
    exact: false,
    error: `Unsupported percentage type: ${typeof percentage}`,
  };
}

/**
 * Safely parses any source financial amount to bigint paise.
 */
export function parseSourcePaise(
  value: number | string | bigint | null | undefined,
  fieldName: string,
): { paise: bigint | null; exact: boolean; error?: string } {
  if (value === null || value === undefined) {
    return {
      paise: null,
      exact: false,
      error: `Missing required field "${fieldName}"`,
    };
  }

  if (typeof value === 'bigint') {
    if (!isNonNegativePgBigInt(value)) {
      return {
        paise: null,
        exact: false,
        error: `Field "${fieldName}" has negative or out-of-range BigInt paise value: ${value}`,
      };
    }
    return { paise: value, exact: true };
  }

  if (typeof value === 'number') {
    if (value < 0) {
      return {
        paise: null,
        exact: false,
        error: `Field "${fieldName}" has negative amount: ${value}`,
      };
    }
    const conv = strictFloatRupeesToPaise(value);
    if (!conv.exact || conv.paise === null) {
      return {
        paise: null,
        exact: false,
        error: `Field "${fieldName}" float conversion error: ${conv.error}`,
      };
    }
    if (!isNonNegativePgBigInt(conv.paise)) {
      return {
        paise: null,
        exact: false,
        error: `Field "${fieldName}" converted paise out of bounds: ${conv.paise}`,
      };
    }
    return { paise: conv.paise, exact: true };
  }

  if (typeof value === 'string') {
    try {
      const parsed = toPaise(value);
      if (!isNonNegativePgBigInt(parsed)) {
        return {
          paise: null,
          exact: false,
          error: `Field "${fieldName}" parsed negative or out-of-range paise: ${parsed}`,
        };
      }
      return { paise: parsed, exact: true };
    } catch (err: any) {
      return {
        paise: null,
        exact: false,
        error: `Field "${fieldName}" string parse error: ${err?.message || err}`,
      };
    }
  }

  return {
    paise: null,
    exact: false,
    error: `Field "${fieldName}" has invalid type ${typeof value}`,
  };
}

/**
 * Pure helper that receives source facts and builds a validated BookingFinanceSnapshotData payload.
 */
export function buildBookingFinanceSnapshot(
  input: SourceBookingSnapshotInput,
): BookingFinanceSnapshotData {
  const reviewReasons: string[] = [];
  let reviewStatus: SnapshotReviewStatus = 'VALID';

  // 1. Currency
  const currency = (input.financials.currency || SUPPORTED_CURRENCY).toUpperCase();
  if (currency !== SUPPORTED_CURRENCY) {
    reviewReasons.push(`UNSUPPORTED_CURRENCY: "${currency}"`);
    reviewStatus = 'NEEDS_REVIEW';
  }

  // 2. Financial Components
  const baseRes = parseSourcePaise(input.financials.basePrice, 'basePrice');
  const cleanRes = parseSourcePaise(input.financials.cleaningFee ?? 0, 'cleaningFee');
  const serviceFeeRes = parseSourcePaise(input.financials.serviceFee ?? 0, 'serviceFee');
  const taxRes = parseSourcePaise(input.financials.taxAmount ?? 0, 'taxAmount');
  const discountRes = parseSourcePaise(input.financials.discountAmount ?? 0, 'discountAmount');
  const totalRes = parseSourcePaise(input.financials.totalAmount, 'totalAmount');

  for (const res of [baseRes, cleanRes, serviceFeeRes, taxRes, discountRes, totalRes]) {
    if (!res.exact) {
      if (res.error) reviewReasons.push(res.error);
      reviewStatus = 'NEEDS_REVIEW';
    }
  }

  const basePaise = baseRes.paise;
  const cleaningPaise = cleanRes.paise;
  const serviceFeePaise = serviceFeeRes.paise;
  const taxPaise = taxRes.paise;
  const discountPaise = discountRes.paise;
  const guestTotalPaise = totalRes.paise;

  // 3. Exact pricing component identity:
  // guestTotal = base + cleaning + serviceFee + tax - discount
  if (
    basePaise !== null &&
    cleaningPaise !== null &&
    serviceFeePaise !== null &&
    taxPaise !== null &&
    discountPaise !== null &&
    guestTotalPaise !== null
  ) {
    const expectedTotal =
      basePaise + cleaningPaise + serviceFeePaise + taxPaise - discountPaise;
    if (guestTotalPaise !== expectedTotal) {
      reviewReasons.push(
        `PRICING_COMPONENT_MISMATCH: Stated guest total (${guestTotalPaise} paise) != base(${basePaise}) + cleaning(${cleaningPaise}) + serviceFee(${serviceFeePaise}) + tax(${taxPaise}) - discount(${discountPaise}) = ${expectedTotal} paise`,
      );
      reviewStatus = 'NEEDS_REVIEW';
    }
  } else {
    reviewReasons.push('INCOMPLETE_FINANCIAL_COMPONENTS: One or more monetary fields could not be established');
    reviewStatus = 'NEEDS_REVIEW';
  }

  // 4. Discount funding policy
  let discountFunding: DiscountFundingPolicy = 'NONE';
  if (discountPaise !== null && discountPaise > 0n) {
    if (input.discount.discountFunding === 'PLATFORM') {
      discountFunding = 'PLATFORM';
    } else if (input.discount.discountFunding === 'HOST') {
      discountFunding = 'HOST';
    } else {
      discountFunding = 'UNRESOLVED';
      reviewReasons.push(
        `UNRESOLVED_DISCOUNT_FUNDING: Positive discount of ${discountPaise} paise without explicit funding policy`,
      );
      reviewStatus = 'NEEDS_REVIEW';
    }
  }

  // 5. Co-Host Agreement State
  let coHostAgreementStatus: CoHostSnapshotStatus =
    input.coHostAgreementStatus || 'NONE';
  let coHostRecipientUserId: string | null = null;
  let coHostRuleId: string | null = null;
  let coHostRuleType: string | null = null;
  let coHostPercentageBps: bigint | null = null;
  let coHostFixedPaise: bigint | null = null;
  let coHostRuleTerms: Record<string, any> | null = null;

  if (input.coHost) {
    const rule = input.coHost;
    coHostRuleId = rule.ruleId || null;
    coHostRecipientUserId = rule.recipientUserId || null;

    // Authoritative rule types and legacy compatibility:
    // 'FIXED' is legacy terminology in some early code; mapped to canonical 'FIXED_AMOUNT'.
    const rawRuleType = rule.ruleType || null;
    const normalizedRuleType =
      rawRuleType === 'FIXED' ? 'FIXED_AMOUNT' : rawRuleType;
    coHostRuleType = normalizedRuleType;

    const ALLOWED_RULE_TYPES = [
      'PERCENTAGE',
      'FIXED_AMOUNT',
      'CLEANING_FEE',
      'CLEANING_FEE_PLUS_PERCENTAGE',
    ];

    if (rule.status === 'ACTIVE') {
      coHostAgreementStatus = 'AGREED';

      // Validate required fields for an active/agreed co-host agreement
      if (!rule.recipientUserId) {
        reviewReasons.push('COHOST_AGREED_MISSING_RECIPIENT: recipientUserId is required for an active co-host agreement');
        reviewStatus = 'NEEDS_REVIEW';
      }
      if (!rule.ruleType) {
        reviewReasons.push('COHOST_AGREED_MISSING_RULE_TYPE: ruleType is required for an active co-host agreement');
        reviewStatus = 'NEEDS_REVIEW';
      } else if (!ALLOWED_RULE_TYPES.includes(normalizedRuleType || '')) {
        reviewReasons.push(`COHOST_AGREED_INVALID_RULE_TYPE: "${rule.ruleType}" is not a recognized rule type`);
        reviewStatus = 'NEEDS_REVIEW';
      } else {
        if (
          normalizedRuleType === 'PERCENTAGE' ||
          normalizedRuleType === 'CLEANING_FEE_PLUS_PERCENTAGE'
        ) {
          if (rule.percentage === undefined || rule.percentage === null) {
            reviewReasons.push(`COHOST_AGREED_MISSING_PERCENTAGE: percentage is required for rule type "${rule.ruleType}"`);
            reviewStatus = 'NEEDS_REVIEW';
          }
        }
        if (normalizedRuleType === 'FIXED_AMOUNT') {
          if (rule.fixedAmount === undefined || rule.fixedAmount === null) {
            reviewReasons.push(`COHOST_AGREED_MISSING_FIXED_AMOUNT: fixedAmount is required for rule type "${rule.ruleType}"`);
            reviewStatus = 'NEEDS_REVIEW';
          }
        }
        // For 'CLEANING_FEE', cleaning fee from financials is passed to co-host directly; no extra parameters needed.
      }
    } else if (rule.status === 'PENDING_CONFIRMATION') {
      coHostAgreementStatus = 'UNRESOLVED';
      reviewReasons.push('COHOST_AGREEMENT_PENDING_CONFIRMATION: Rule not confirmed by co-host');
      reviewStatus = 'NEEDS_REVIEW';
    } else {
      coHostAgreementStatus = 'UNRESOLVED';
      reviewReasons.push(`COHOST_RULE_STATUS_UNRESOLVED: status is "${rule.status}"`);
      reviewStatus = 'NEEDS_REVIEW';
    }

    // Parse terms
    if (rule.percentage !== undefined && rule.percentage !== null) {
      const bpsRes = convertPercentageToBps(rule.percentage);
      if (!bpsRes.exact) {
        if (bpsRes.error) reviewReasons.push(bpsRes.error);
        reviewStatus = 'NEEDS_REVIEW';
      } else {
        coHostPercentageBps = bpsRes.bps;
      }
    }

    if (rule.fixedAmount !== undefined && rule.fixedAmount !== null) {
      const fixedRes = parseSourcePaise(rule.fixedAmount, 'coHostFixedAmount');
      if (!fixedRes.exact) {
        if (fixedRes.error) reviewReasons.push(fixedRes.error);
        reviewStatus = 'NEEDS_REVIEW';
      } else {
        coHostFixedPaise = fixedRes.paise;
      }
    }

    coHostRuleTerms = {
      ruleId: coHostRuleId,
      recipientUserId: coHostRecipientUserId,
      ruleType: coHostRuleType,
      legacyRuleType: rawRuleType !== normalizedRuleType ? rawRuleType : null,
      percentageBps: coHostPercentageBps ? coHostPercentageBps.toString() : null,
      fixedPaise: coHostFixedPaise ? coHostFixedPaise.toString() : null,
      rawPercentage: rule.percentage ?? null,
      rawFixedAmount: rule.fixedAmount ?? null,
      coHostRelationshipId: rule.coHostRelationshipId || null,
      rawTerms: rule.rawTerms || null,
    };
  }

  // 6. Source Data Preservation
  const sourceData: Record<string, any> = {
    rawFinancials: input.financials,
    rawDiscount: input.discount,
    rawCoHost: input.coHost || null,
    inputTimestamps: {
      capturedAt: input.capturedAt.toISOString(),
    },
  };

  if (reviewReasons.length > 0) {
    reviewStatus = 'NEEDS_REVIEW';
  }

  return {
    bookingId: input.bookingId,
    snapshotVersion: 1,
    capturedAt: input.capturedAt,
    captureProvenance: input.captureProvenance || 'BOOKING_CREATION',
    currency,
    basePaise,
    cleaningPaise,
    serviceFeePaise,
    taxPaise,
    discountPaise,
    guestTotalPaise,
    hostUserId: input.hostUserId,
    propertyId: input.propertyId,
    discountFunding,
    coHostAgreementStatus,
    coHostRecipientUserId,
    coHostRuleId,
    coHostRuleType,
    coHostPercentageBps,
    coHostFixedPaise,
    coHostRuleTerms,
    policyVersion: input.policyVersion || 'DRAFT_V1',
    reviewStatus,
    reviewReasons,
    sourceData,
  };
}

/**
 * Serializes snapshot into JSON-safe structure where BigInt paise are integer strings.
 */
export function serializeSnapshot(
  snapshot: BookingFinanceSnapshotData,
): SerializedBookingFinanceSnapshot {
  return {
    bookingId: snapshot.bookingId,
    snapshotVersion: snapshot.snapshotVersion,
    capturedAt: snapshot.capturedAt.toISOString(),
    captureProvenance: snapshot.captureProvenance,
    currency: snapshot.currency,
    basePaise: snapshot.basePaise !== null ? snapshot.basePaise.toString() : null,
    cleaningPaise: snapshot.cleaningPaise !== null ? snapshot.cleaningPaise.toString() : null,
    serviceFeePaise: snapshot.serviceFeePaise !== null ? snapshot.serviceFeePaise.toString() : null,
    taxPaise: snapshot.taxPaise !== null ? snapshot.taxPaise.toString() : null,
    discountPaise: snapshot.discountPaise !== null ? snapshot.discountPaise.toString() : null,
    guestTotalPaise: snapshot.guestTotalPaise !== null ? snapshot.guestTotalPaise.toString() : null,
    hostUserId: snapshot.hostUserId,
    propertyId: snapshot.propertyId,
    discountFunding: snapshot.discountFunding,
    coHostAgreementStatus: snapshot.coHostAgreementStatus,
    coHostRecipientUserId: snapshot.coHostRecipientUserId,
    coHostRuleId: snapshot.coHostRuleId,
    coHostRuleType: snapshot.coHostRuleType,
    coHostPercentageBps:
      snapshot.coHostPercentageBps !== null
        ? snapshot.coHostPercentageBps.toString()
        : null,
    coHostFixedPaise:
      snapshot.coHostFixedPaise !== null
        ? snapshot.coHostFixedPaise.toString()
        : null,
    coHostRuleTerms: snapshot.coHostRuleTerms,
    policyVersion: snapshot.policyVersion,
    reviewStatus: snapshot.reviewStatus,
    reviewReasons: snapshot.reviewReasons,
    sourceData: snapshot.sourceData,
    formattedRupees: {
      baseAmount: snapshot.basePaise !== null ? fromPaise(snapshot.basePaise) : null,
      cleaningFee: snapshot.cleaningPaise !== null ? fromPaise(snapshot.cleaningPaise) : null,
      serviceFee: snapshot.serviceFeePaise !== null ? fromPaise(snapshot.serviceFeePaise) : null,
      taxAmount: snapshot.taxPaise !== null ? fromPaise(snapshot.taxPaise) : null,
      discountAmount: snapshot.discountPaise !== null ? fromPaise(snapshot.discountPaise) : null,
      guestTotal: snapshot.guestTotalPaise !== null ? fromPaise(snapshot.guestTotalPaise) : null,
      coHostFixedAmount:
        snapshot.coHostFixedPaise !== null
          ? fromPaise(snapshot.coHostFixedPaise)
          : null,
    },
  };
}
