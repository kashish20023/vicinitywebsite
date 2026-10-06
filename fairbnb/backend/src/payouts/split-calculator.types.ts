/**
 * Type contracts for the FairBnB Payout Split Engine (Chunk 1).
 */

export type DiscountFunding = 'NONE' | 'PLATFORM' | 'HOST' | 'UNRESOLVED';

export type CoHostAgreementStatus = 'NONE' | 'AGREED' | 'UNRESOLVED';

export type CoHostRuleType =
  | 'NONE'
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'CLEANING_FEE'
  | 'CLEANING_FEE_PLUS_PERCENTAGE';

export interface RefundInput {
  readonly id: string;
  readonly amountPaise: bigint;
  readonly accommodationPaise: bigint;
  readonly cleaningPaise: bigint;
  readonly platformPaise: bigint;
  readonly taxPaise: bigint;
}

export interface CoHostAgreementInput {
  readonly status: CoHostAgreementStatus;
  readonly recipientUserId?: string;
  readonly ruleType?: CoHostRuleType;
  readonly percentageBps?: bigint;
  readonly fixedAmountPaise?: bigint;
}

export interface SplitCalculationInput {
  readonly bookingId: string;
  readonly currency: string;
  readonly basePaise: bigint;
  readonly cleaningPaise: bigint;
  readonly serviceFeePaise: bigint;
  readonly taxPaise: bigint;
  readonly discountPaise: bigint;
  readonly guestTotalPaise: bigint;
  readonly discountFunding: DiscountFunding;
  readonly completedRefunds: readonly RefundInput[];
  readonly coHostAgreement: CoHostAgreementInput;
}

export type HeldReasonCode =
  | 'INVALID_CURRENCY'
  | 'NEGATIVE_AMOUNT'
  | 'TOTAL_MISMATCH'
  | 'UNRESOLVED_DISCOUNT_FUNDING'
  | 'INVALID_DISCOUNT_FUNDING'
  | 'FUNDING_GAP'
  | 'DUPLICATE_REFUND_ID'
  | 'REFUND_TOTAL_MISMATCH'
  | 'REFUND_EXCEEDS_COMPONENT'
  | 'UNRESOLVED_COHOST_AGREEMENT'
  | 'INVALID_COHOST_RULE'
  | 'COHOST_EXCEEDS_POOL';

export interface DiagnosticDetail {
  code: HeldReasonCode;
  message: string;
  details?: Record<string, string | number | bigint | boolean | null | undefined>;
}

export interface CalculatedSplit {
  status: 'CALCULATED';
  bookingId: string;
  currency: 'INR';
  breakdown: {
    basePaise: bigint;
    cleaningPaise: bigint;
    serviceFeePaise: bigint;
    taxPaise: bigint;
    discountPaise: bigint;
    guestTotalPaise: bigint;

    hostDiscountPaise: bigint;
    platformDiscountPaise: bigint;

    totalRefundedPaise: bigint;
    accommodationRefundPaise: bigint;
    cleaningRefundPaise: bigint;
    platformRefundPaise: bigint;
    taxRefundPaise: bigint;

    netAccommodationPaise: bigint;
    netCleaningPaise: bigint;
    netPlatformPaise: bigint;
    netTaxPaise: bigint;

    hostPoolPaise: bigint;
    coHostAllocationPaise: bigint;
    hostAllocationPaise: bigint;
    platformAllocationPaise: bigint;
    taxAllocationPaise: bigint;
  };
  formatted: {
    guestTotal: string;
    totalRefunded: string;
    netCollected: string;
    hostAllocation: string;
    coHostAllocation: string;
    platformAllocation: string;
    taxAllocation: string;
  };
  reconciliation: {
    sumOfAllocationsPaise: bigint;
    netCollectedPaise: bigint;
    isReconciled: boolean;
    discrepancyPaise: bigint;
  };
  explanation: string;
}

export interface HeldSplit {
  status: 'HELD';
  bookingId: string;
  currency: string;
  reasonCodes: HeldReasonCode[];
  diagnostics: DiagnosticDetail[];
}

export type SplitCalculationResult = CalculatedSplit | HeldSplit;
