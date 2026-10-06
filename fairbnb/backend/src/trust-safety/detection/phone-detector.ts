import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { UnicodeNormalizer } from '../normalization/unicode-normalizer.js';
import {
  ModerationEvaluationResult,
  ModerationReasonCode,
  SpanMapping,
  TrustSafetyPolicy,
  DEFAULT_TRUST_SAFETY_POLICY,
} from '../policy/trust-safety-policy.types.js';

export interface AuthoritativeContext {
  bookingId?: string;
  propertyPrice?: number;
  maxGuests?: number;
  postalCode?: string;
  senderRole?: 'GUEST' | 'HOST' | 'COHOST' | 'ADMIN';
  isPreBooking?: boolean;
}

export class DeterministicPhoneDetector {
  // Common WhatsApp contact URL patterns
  private static readonly WA_LINK_REGEX =
    /(?:https?:\/\/)?(?:www\.)?(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?[0-9]{7,15})/gi;

  // Tel: URI patterns
  private static readonly TEL_LINK_REGEX =
    /tel:(\+?[0-9]{7,15})/gi;

  // Negative context lookbehinds/lookaheads (prices, dates, times, postal codes)
  private static readonly CURRENCY_PREFIX_REGEX =
    /(?:₹|\$|€|£|rs\.?|inr)\s*[0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?/gi;

  private static readonly PRICE_SUFFIX_REGEX =
    /[0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?\s*(?:\/\s*night|per\s*night|nightly|rupees|rs|bucks|inr)/gi;

  private static readonly DATE_PATTERN_REGEX =
    /\b(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})\b/g;

  private static readonly TIME_PATTERN_REGEX =
    /\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*[ap]m)?\b|\b[1-9]\s*(?:am|pm)\b/gi;

  private static readonly PINCODE_REGEX =
    /\b(?:pincode|pin|postal\s*code|zip)\s*[:#-]?\s*(\d{6})\b/gi;

  private static readonly EMERGENCY_NUMBERS = new Set(['100', '101', '102', '108', '112', '911']);

  /**
   * Evaluates a message content string deterministically under given policy and context.
   */
  public static evaluate(
    rawText: string,
    context?: AuthoritativeContext,
    policy: TrustSafetyPolicy = DEFAULT_TRUST_SAFETY_POLICY,
  ): ModerationEvaluationResult {
    const startTime = Date.now();
    const reasons: ModerationReasonCode[] = [];
    const spans: SpanMapping[] = [];
    const matchedIdentifiers: string[] = [];

    // Boundary check on length
    if (!rawText || rawText.trim().length === 0) {
      return {
        decision: 'ALLOW',
        reasons: ['CLEAN'],
        spans: [],
        matchedIdentifiers: [],
        evaluationTimeMs: Date.now() - startTime,
        policyVersion: policy.version,
        policyEpoch: policy.epoch,
        confidence: 'HIGH',
        requiresHumanReview: false,
      };
    }

    if (rawText.length > policy.limits.maxCharacters) {
      return {
        decision: 'BLOCK',
        reasons: ['INPUT_LENGTH_EXCEEDED'],
        spans: [{
          originalStart: policy.limits.maxCharacters,
          originalEnd: rawText.length,
          originalText: '... [truncated]',
          normalizedText: '... [truncated]',
          reasonCode: 'INPUT_LENGTH_EXCEEDED',
        }],
        matchedIdentifiers: ['[PAYLOAD_TOO_LARGE]'],
        evaluationTimeMs: Date.now() - startTime,
        policyVersion: policy.version,
        policyEpoch: policy.epoch,
        confidence: 'HIGH',
        requiresHumanReview: false,
      };
    }

    // 1. Check direct WhatsApp links
    const waMatches = Array.from(rawText.matchAll(this.WA_LINK_REGEX));
    for (const match of waMatches) {
      const matchedUrl = match[0];
      const phoneDigits = match[1];
      const start = match.index || 0;
      reasons.push('WHATSAPP_LINK_DETECTED');
      spans.push({
        originalStart: start,
        originalEnd: start + matchedUrl.length,
        originalText: matchedUrl,
        normalizedText: phoneDigits,
        reasonCode: 'WHATSAPP_LINK_DETECTED',
      });
      matchedIdentifiers.push(this.maskIdentifier(phoneDigits));
    }

    // 2. Check direct tel: links
    const telMatches = Array.from(rawText.matchAll(this.TEL_LINK_REGEX));
    for (const match of telMatches) {
      const matchedTel = match[0];
      const phoneDigits = match[1];
      const start = match.index || 0;
      reasons.push('TEL_LINK_DETECTED');
      spans.push({
        originalStart: start,
        originalEnd: start + matchedTel.length,
        originalText: matchedTel,
        normalizedText: phoneDigits,
        reasonCode: 'TEL_LINK_DETECTED',
      });
      matchedIdentifiers.push(this.maskIdentifier(phoneDigits));
    }

    // If explicit contact link found, block immediately with HIGH confidence
    if (reasons.length > 0) {
      return {
        decision: 'BLOCK',
        reasons,
        spans,
        matchedIdentifiers,
        evaluationTimeMs: Date.now() - startTime,
        policyVersion: policy.version,
        policyEpoch: policy.epoch,
        confidence: 'HIGH',
        requiresHumanReview: false,
      };
    }

    // 3. Normalize content (Unicode, Devanagari numerals, Zero-width, Digit words)
    const norm = UnicodeNormalizer.normalize(rawText);
    const normalized = norm.normalized;

    // 4. Identify negative context zones to exclude harmless dates, prices, times, pincodes
    const excludedRanges = this.extractNegativeContextRanges(normalized, context);

    // 5. Extract digit sequence candidates (allowing separators: spaces, dots, dashes, slashes)
    // Matches candidate blocks containing digits and standard separators
    const candidateRegex = /(?:\+?[0-9][0-9\s.\-_/()]{6,25}[0-9])/g;
    const candidates = Array.from(normalized.matchAll(candidateRegex));

    for (const cand of candidates) {
      const matchText = cand[0];
      const startIndex = cand.index || 0;
      const endIndex = startIndex + matchText.length;

      // Check if candidate overlaps an excluded negative context (e.g. price or date)
      if (this.isRangeExcluded(startIndex, endIndex, excludedRanges)) {
        continue;
      }

      // Extract pure digits
      const digitsOnly = matchText.replace(/[^0-9]/g, '');

      // Check short emergency codes
      if (this.EMERGENCY_NUMBERS.has(digitsOnly)) {
        continue;
      }

      // Check authoritative booking ID match
      if (context?.bookingId && digitsOnly === context.bookingId.replace(/[^0-9]/g, '')) {
        continue;
      }

      // Validate candidate using libphonenumber-js
      const isPhone = this.validatePhoneNumber(matchText, digitsOnly);
      if (isPhone) {
        reasons.push('PHONE_NUMBER_DETECTED');
        spans.push({
          originalStart: startIndex,
          originalEnd: endIndex,
          originalText: matchText,
          normalizedText: digitsOnly,
          reasonCode: 'PHONE_NUMBER_DETECTED',
        });
        matchedIdentifiers.push(this.maskIdentifier(digitsOnly));
      } else if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
        // Obfuscated / separated 10-digit number that failed strict country formatting
        // but represents an obvious 10-digit mobile number attempt
        const hasObfuscation = /\s|\.|-|_|\/|,/.test(matchText) || norm.original !== norm.normalized;
        reasons.push(hasObfuscation ? 'OBFUSCATED_DIGITS_DETECTED' : 'PHONE_NUMBER_DETECTED');
        spans.push({
          originalStart: startIndex,
          originalEnd: endIndex,
          originalText: matchText,
          normalizedText: digitsOnly,
          reasonCode: hasObfuscation ? 'OBFUSCATED_DIGITS_DETECTED' : 'PHONE_NUMBER_DETECTED',
        });
        matchedIdentifiers.push(this.maskIdentifier(digitsOnly));
      }
    }

    // 6. Contact intent with partial/suspicious evidence check
    if (reasons.length === 0) {
      const suspiciousIntentRegex =
        /\b(?:call\s*me|whatsapp\s*me|ping\s*me|message\s*me|contact\s*me\s*at|reach\s*me\s*on)\b/i;
      const hasIntent = suspiciousIntentRegex.test(rawText);
      const digitsCount = (rawText.match(/\d/g) || []).length;

      if (hasIntent && digitsCount >= 4 && digitsCount < 10) {
        // Incomplete number or partial contact attempt -> HOLD for human review
        return {
          decision: 'HOLD',
          reasons: ['SUSPICIOUS_CONTACT_PATTERN'],
          spans: [{
            originalStart: 0,
            originalEnd: rawText.length,
            originalText: rawText,
            normalizedText: normalized,
            reasonCode: 'SUSPICIOUS_CONTACT_PATTERN',
          }],
          matchedIdentifiers: ['[SUSPICIOUS_PARTIAL_CONTACT]'],
          evaluationTimeMs: Date.now() - startTime,
          policyVersion: policy.version,
          policyEpoch: policy.epoch,
          confidence: 'MEDIUM',
          requiresHumanReview: true,
        };
      }
    }

    // Decision consolidation
    if (reasons.length > 0) {
      return {
        decision: 'BLOCK',
        reasons,
        spans,
        matchedIdentifiers,
        evaluationTimeMs: Date.now() - startTime,
        policyVersion: policy.version,
        policyEpoch: policy.epoch,
        confidence: 'HIGH',
        requiresHumanReview: false,
      };
    }

    return {
      decision: 'ALLOW',
      reasons: ['CLEAN'],
      spans: [],
      matchedIdentifiers: [],
      evaluationTimeMs: Date.now() - startTime,
      policyVersion: policy.version,
      policyEpoch: policy.epoch,
      confidence: 'HIGH',
      requiresHumanReview: false,
    };
  }

  private static validatePhoneNumber(candidate: string, digitsOnly: string): boolean {
    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
      return false;
    }

    // Try parsing with libphonenumber-js
    try {
      // 1. With international plus prefix if present
      if (candidate.trim().startsWith('+')) {
        return isValidPhoneNumber(candidate.trim());
      }

      // 2. Default to IN (India) region for national 10-digit numbers
      if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
        return isValidPhoneNumber(digitsOnly, 'IN');
      }

      // 3. Check parsed phone with country fallback
      const parsed = parsePhoneNumber(candidate.trim(), 'IN');
      if (parsed && parsed.isValid()) {
        return true;
      }
    } catch {
      // libphonenumber may throw on malformed input
    }

    // Fallback: If 10 contiguous/spaced digits starting with valid mobile prefix (6-9 for India)
    if (digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly)) {
      return true;
    }

    return false;
  }

  private static extractNegativeContextRanges(
    text: string,
    context?: AuthoritativeContext,
  ): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];

    // Currency prefix ranges (e.g. ₹15,000, Rs 5000)
    for (const m of text.matchAll(this.CURRENCY_PREFIX_REGEX)) {
      ranges.push({ start: m.index || 0, end: (m.index || 0) + m[0].length });
    }

    // Price suffix ranges (e.g. 5000 per night, 12000 rupees)
    for (const m of text.matchAll(this.PRICE_SUFFIX_REGEX)) {
      ranges.push({ start: m.index || 0, end: (m.index || 0) + m[0].length });
    }

    // Date ranges (e.g. 12/10/2026)
    for (const m of text.matchAll(this.DATE_PATTERN_REGEX)) {
      ranges.push({ start: m.index || 0, end: (m.index || 0) + m[0].length });
    }

    // Time ranges (e.g. 14:30, 2pm)
    for (const m of text.matchAll(this.TIME_PATTERN_REGEX)) {
      ranges.push({ start: m.index || 0, end: (m.index || 0) + m[0].length });
    }

    // Pincode ranges (e.g. Pincode: 403516)
    for (const m of text.matchAll(this.PINCODE_REGEX)) {
      ranges.push({ start: m.index || 0, end: (m.index || 0) + m[0].length });
    }

    // Contextual property postal code match
    if (context?.postalCode) {
      const idx = text.indexOf(context.postalCode);
      if (idx !== -1) {
        ranges.push({ start: idx, end: idx + context.postalCode.length });
      }
    }

    return ranges;
  }

  private static isRangeExcluded(
    start: number,
    end: number,
    excludedRanges: Array<{ start: number; end: number }>,
  ): boolean {
    for (const r of excludedRanges) {
      // If candidate is fully or significantly contained in an excluded negative context
      if (start >= r.start && end <= r.end) {
        return true;
      }
    }
    return false;
  }

  private static maskIdentifier(digits: string): string {
    if (!digits || digits.length <= 4) return '***';
    return digits.substring(0, 2) + '******' + digits.substring(digits.length - 2);
  }
}
