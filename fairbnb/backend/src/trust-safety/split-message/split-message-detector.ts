import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { DeterministicPhoneDetector, AuthoritativeContext } from '../detection/phone-detector.js';
import {
  ModerationEvaluationResult,
  TrustSafetyPolicy,
  DEFAULT_TRUST_SAFETY_POLICY,
} from '../policy/trust-safety-policy.types.js';

export interface FragmentRecord {
  senderId: string;
  conversationId: string;
  content: string;
  digits: string;
  timestampMs: number;
}

export class SplitMessageDetector {
  // Key: `${senderId}:${conversationId}` -> FIFO array of recent fragments
  private static fragmentWindows = new Map<string, FragmentRecord[]>();

  // Mutex per sender-conversation to serialize concurrent requests (M13)
  private static locks = new Map<string, Promise<void>>();

  public static async evaluateWithHistory(
    senderId: string,
    conversationId: string,
    currentContent: string,
    context?: AuthoritativeContext,
    policy: TrustSafetyPolicy = DEFAULT_TRUST_SAFETY_POLICY,
  ): Promise<ModerationEvaluationResult> {
    const key = `${senderId}:${conversationId}`;

    // Wait for any existing in-flight evaluation for this sender & conversation (M13 serialization)
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.locks.set(key, lockPromise);

    try {
      const now = Date.now();
      const windowMs = (policy.limits.conversationWindowSeconds || 120) * 1000;
      const maxFragments = policy.limits.conversationWindowMaxMessages || 5;
      const currentDigits = (currentContent.match(/\d+/g) || []).join('');

      // 1. First, evaluate current single message independently
      const singleResult = DeterministicPhoneDetector.evaluate(currentContent, context, policy);

      // If single message is already confirmed BLOCK, record and return immediately
      if (singleResult.decision === 'BLOCK') {
        this.addFragment(key, { senderId, conversationId, content: currentContent, digits: currentDigits, timestampMs: now }, windowMs, maxFragments);
        return singleResult;
      }

      // 2. Fetch existing recent same-sender fragments within window
      const recent = this.getRecentFragments(key, now, windowMs);

      if (recent.length > 0) {
        // Strategy A: Combined text concatenation
        const combinedText = recent.map(r => r.content).join(' ') + ' ' + currentContent;
        const combinedResult = DeterministicPhoneDetector.evaluate(combinedText, context, policy);

        if (combinedResult.decision === 'BLOCK') {
          this.addFragment(key, { senderId, conversationId, content: currentContent, digits: currentDigits, timestampMs: now }, windowMs, maxFragments);
          return {
            decision: 'BLOCK',
            reasons: ['MULTI_MESSAGE_SPLIT_DETECTED', ...combinedResult.reasons.filter(r => r !== 'CLEAN')],
            spans: combinedResult.spans,
            matchedIdentifiers: combinedResult.matchedIdentifiers,
            evaluationTimeMs: combinedResult.evaluationTimeMs,
            policyVersion: policy.version,
            policyEpoch: policy.epoch,
            confidence: 'HIGH',
            requiresHumanReview: false,
          };
        }

        // Strategy B: Cross-message concatenated digit stream check (e.g. 5 digits in msg 1, 5 in msg 2)
        const combinedDigits = recent.map(r => r.digits).join('') + currentDigits;
        if (combinedDigits.length >= 10 && combinedDigits.length <= 15) {
          // Check if combined digits form a valid mobile number
          const isValid = this.isPhoneSequence(combinedDigits);
          if (isValid) {
            this.addFragment(key, { senderId, conversationId, content: currentContent, digits: currentDigits, timestampMs: now }, windowMs, maxFragments);
            return {
              decision: 'BLOCK',
              reasons: ['MULTI_MESSAGE_SPLIT_DETECTED', 'PHONE_NUMBER_DETECTED'],
              spans: [{
                originalStart: 0,
                originalEnd: currentContent.length,
                originalText: currentContent,
                normalizedText: combinedDigits,
                reasonCode: 'MULTI_MESSAGE_SPLIT_DETECTED',
              }],
              matchedIdentifiers: [this.maskIdentifier(combinedDigits)],
              evaluationTimeMs: Date.now() - now,
              policyVersion: policy.version,
              policyEpoch: policy.epoch,
              confidence: 'HIGH',
              requiresHumanReview: false,
            };
          }
        }

        // If combined text has suspicious contact intent without enough digits -> HOLD
        if (combinedResult.decision === 'HOLD') {
          this.addFragment(key, { senderId, conversationId, content: currentContent, digits: currentDigits, timestampMs: now }, windowMs, maxFragments);
          return {
            ...combinedResult,
            reasons: ['MULTI_MESSAGE_SPLIT_DETECTED', ...combinedResult.reasons],
          };
        }
      }

      // Record current fragment
      this.addFragment(key, { senderId, conversationId, content: currentContent, digits: currentDigits, timestampMs: now }, windowMs, maxFragments);
      return singleResult;
    } finally {
      this.locks.delete(key);
      releaseLock();
    }
  }

  private static isPhoneSequence(digits: string): boolean {
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      try {
        if (isValidPhoneNumber(digits, 'IN')) return true;
      } catch {}
      return true; // 10 contiguous digits starting with 6-9 in India is an obvious phone number
    }
    try {
      if (isValidPhoneNumber('+' + digits)) return true;
    } catch {}
    return false;
  }

  private static maskIdentifier(digits: string): string {
    if (!digits || digits.length <= 4) return '***';
    return digits.substring(0, 2) + '******' + digits.substring(digits.length - 2);
  }

  private static getRecentFragments(key: string, now: number, windowMs: number): FragmentRecord[] {
    const list = this.fragmentWindows.get(key) || [];
    const valid = list.filter(f => now - f.timestampMs <= windowMs);
    this.fragmentWindows.set(key, valid);
    return valid;
  }

  private static addFragment(key: string, record: FragmentRecord, windowMs: number, maxFragments: number): void {
    const list = this.getRecentFragments(key, record.timestampMs, windowMs);
    list.push(record);
    while (list.length > maxFragments) {
      list.shift();
    }
    this.fragmentWindows.set(key, list);
  }

  public static clearWindows(): void {
    this.fragmentWindows.clear();
    this.locks.clear();
  }
}
