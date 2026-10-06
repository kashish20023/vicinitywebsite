/**
 * Types and interfaces for Settlement Service and Lifecycle Integration (Phase 3).
 */

export type SettlementStatus =
  | 'PENDING'
  | 'READY'
  | 'HELD'
  | 'PROCESSING'
  | 'PARTIALLY_SETTLED'
  | 'SETTLED'
  | 'CANCELLED';

export type SettlementAllocationStatus =
  | 'PENDING'
  | 'ELIGIBLE'
  | 'HELD'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PAID'
  | 'ADJUSTED';

export type RecipientRole = 'HOST' | 'CO_HOST' | 'PLATFORM' | 'TAX_AUTHORITY';

export interface EligibilityAssessment {
  isEligible: boolean;
  holdReasons: string[];
  details: Record<string, any>;
}

export interface SettlementPreparationResult {
  settlementId: string;
  bookingId: string;
  status: SettlementStatus;
  holdReasons: string[];
  revisionNumber: number;
  revisionId: string;
  isNewRevision: boolean;
  totalGrossPaise: bigint;
  totalRefundedPaise: bigint;
  totalNetPaise: bigint;
  hostNetPaise: bigint;
  coHostNetPaise: bigint;
  platformNetPaise: bigint;
  taxNetPaise: bigint;
  allocations: {
    allocationKey: string;
    recipientRole: string;
    recipientUserId: string | null;
    grossPaise: bigint;
    refundDeductionPaise: bigint;
    netEntitledPaise: bigint;
    status: SettlementAllocationStatus;
    holdReasons: string[];
  }[];
}
