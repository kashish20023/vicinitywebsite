/**
 * Types and interfaces for Refund Allocation and Financial Coordination (Phase 2).
 */

export interface RefundComponentBreakdown {
  accommodationPaise: bigint;
  cleaningPaise: bigint;
  platformPaise: bigint;
  taxPaise: bigint;
  totalPaise: bigint;
}

export type RefundReservationStatus =
  | 'RESERVED'
  | 'PENDING_PROVIDER'
  | 'COMPLETED'
  | 'FAILED'
  | 'UNKNOWN';

export type RefundReviewStatus = 'VALID' | 'NEEDS_REVIEW';

export interface CreateRefundReservationDto {
  bookingId: string;
  amountPaise: bigint;
  operationReference: string;
  reason?: string;
  paymentId?: string;
  processedById?: string;
  idempotencyKey?: string;
  breakdown?: {
    accommodationPaise: bigint;
    cleaningPaise: bigint;
    platformPaise: bigint;
    taxPaise: bigint;
  };
}

export interface RefundProviderOutcome {
  status: 'COMPLETED' | 'FAILED' | 'UNKNOWN';
  providerRefundId?: string;
  failureReason?: string;
  rawResponse?: any;
}

export interface RefundableCapacity {
  capturedPaise: bigint;
  consumedRefundPaise: bigint;
  remainingCapacityPaise: bigint;
  hasUnknownRefunds: boolean;
}
