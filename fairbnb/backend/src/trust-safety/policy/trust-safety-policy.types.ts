export type ModerationDecision = 'ALLOW' | 'BLOCK' | 'HOLD' | 'ESCALATE';

export type ModerationReasonCode =
  | 'CLEAN'
  | 'PHONE_NUMBER_DETECTED'
  | 'WHATSAPP_LINK_DETECTED'
  | 'TEL_LINK_DETECTED'
  | 'OBFUSCATED_DIGITS_DETECTED'
  | 'SUSPICIOUS_CONTACT_PATTERN'
  | 'INPUT_LENGTH_EXCEEDED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MULTI_MESSAGE_SPLIT_DETECTED';

export interface SpanMapping {
  originalStart: number;
  originalEnd: number;
  originalText: string;
  normalizedText: string;
  reasonCode: ModerationReasonCode;
}

export interface ModerationEvaluationResult {
  decision: ModerationDecision;
  reasons: ModerationReasonCode[];
  spans: SpanMapping[];
  matchedIdentifiers: string[]; // masked values
  evaluationTimeMs: number;
  policyVersion: number;
  policyEpoch: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sanitizedMessage?: string;
  requiresHumanReview: boolean;
}

export interface TrustSafetyPolicy {
  version: number;
  epoch: number;
  name: string;
  isActive: boolean;
  contactSharingRule: {
    enabled: boolean;
    blockConfidence: 'HIGH' | 'MEDIUM';
    maxDigitsAllowed: number;
    allowlistedShortCodes: string[];
    allowedCurrencySymbols: string[];
  };
  limits: {
    maxMessageBytes: number;
    maxCharacters: number;
    maxRegexExecutionMs: number;
    maxCandidates: number;
    conversationWindowSeconds?: number;
    conversationWindowMaxMessages?: number;
  };
  updatedAt: string;
}

export const DEFAULT_TRUST_SAFETY_POLICY: TrustSafetyPolicy = {
  version: 1,
  epoch: 1,
  name: 'Default V2 Strict Anti-Circumvention Policy',
  isActive: true,
  contactSharingRule: {
    enabled: true,
    blockConfidence: 'HIGH',
    maxDigitsAllowed: 9, // 10+ digits usually represent phone numbers
    allowlistedShortCodes: ['100', '101', '102', '108', '112', '911'],
    allowedCurrencySymbols: ['₹', '$', '€', '£', 'rs', 'inr'],
  },
  limits: {
    maxMessageBytes: 4096, // 4 KB
    maxCharacters: 4000,
    maxRegexExecutionMs: 25,
    maxCandidates: 20,
    conversationWindowSeconds: 120,
    conversationWindowMaxMessages: 5,
  },
  updatedAt: '2026-10-01T00:00:00.000Z',
};
