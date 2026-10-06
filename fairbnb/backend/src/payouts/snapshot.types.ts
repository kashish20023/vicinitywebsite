/**
 * Type contracts for Booking Finance Snapshot (Chunk 2A).
 */

export type DiscountFundingPolicy = 'NONE' | 'PLATFORM' | 'HOST' | 'UNRESOLVED';

export type CoHostSnapshotStatus = 'NONE' | 'AGREED' | 'UNRESOLVED';

export type SnapshotReviewStatus = 'VALID' | 'NEEDS_REVIEW';

export interface SourceFinancialFacts {
  basePrice?: number | string | bigint | null;
  cleaningFee?: number | string | bigint | null;
  serviceFee?: number | string | bigint | null;
  taxAmount?: number | string | bigint | null;
  discountAmount?: number | string | bigint | null;
  totalAmount?: number | string | bigint | null;
  currency?: string | null;
}

export interface SourceDiscountFacts {
  couponCode?: string | null;
  discountFunding?: DiscountFundingPolicy | null;
  fundedByEvidence?: string | null;
}

export interface SourceCoHostRuleFacts {
  ruleId?: string | null;
  recipientUserId?: string | null;
  ruleType?: string | null;
  percentage?: number | string | null;
  fixedAmount?: number | string | bigint | null;
  status?: string | null;
  coHostRelationshipId?: string | null;
  rawTerms?: Record<string, any> | null;
}

export interface SourceBookingSnapshotInput {
  bookingId: string;
  propertyId: string;
  hostUserId: string;
  financials: SourceFinancialFacts;
  discount: SourceDiscountFacts;
  coHost?: SourceCoHostRuleFacts | null;
  coHostAgreementStatus?: CoHostSnapshotStatus | null;
  capturedAt: Date;
  captureProvenance?: string;
  policyVersion?: string;
}

export interface BookingFinanceSnapshotData {
  bookingId: string;
  snapshotVersion: number;
  capturedAt: Date;
  captureProvenance: string;
  currency: string;
  basePaise: bigint | null;
  cleaningPaise: bigint | null;
  serviceFeePaise: bigint | null;
  taxPaise: bigint | null;
  discountPaise: bigint | null;
  guestTotalPaise: bigint | null;
  hostUserId: string;
  propertyId: string;
  discountFunding: DiscountFundingPolicy;
  coHostAgreementStatus: CoHostSnapshotStatus;
  coHostRecipientUserId: string | null;
  coHostRuleId: string | null;
  coHostRuleType: string | null;
  coHostPercentageBps: bigint | null;
  coHostFixedPaise: bigint | null;
  coHostRuleTerms: Record<string, any> | null;
  policyVersion: string;
  reviewStatus: SnapshotReviewStatus;
  reviewReasons: string[];
  sourceData: Record<string, any>;
}

export interface SerializedBookingFinanceSnapshot {
  id?: string;
  bookingId: string;
  snapshotVersion: number;
  capturedAt: string;
  captureProvenance: string;
  currency: string;
  basePaise: string | null;
  cleaningPaise: string | null;
  serviceFeePaise: string | null;
  taxPaise: string | null;
  discountPaise: string | null;
  guestTotalPaise: string | null;
  hostUserId: string;
  propertyId: string;
  discountFunding: DiscountFundingPolicy;
  coHostAgreementStatus: CoHostSnapshotStatus;
  coHostRecipientUserId: string | null;
  coHostRuleId: string | null;
  coHostRuleType: string | null;
  coHostPercentageBps: string | null;
  coHostFixedPaise: string | null;
  coHostRuleTerms: Record<string, any> | null;
  policyVersion: string;
  reviewStatus: SnapshotReviewStatus;
  reviewReasons: string[];
  sourceData: Record<string, any> | null;
  formattedRupees?: {
    baseAmount: string | null;
    cleaningFee: string | null;
    serviceFee: string | null;
    taxAmount: string | null;
    discountAmount: string | null;
    guestTotal: string | null;
    coHostFixedAmount: string | null;
  };
}
