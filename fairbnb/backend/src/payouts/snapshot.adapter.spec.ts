import {
  buildBookingFinanceSnapshot,
  convertPercentageToBps,
  parseSourcePaise,
  serializeSnapshot,
} from './snapshot.adapter.js';
import {
  compareCanonicalContent,
  canonicalizeJson,
  canonicalizeReasonSet,
} from './snapshot.persistence.js';
import { SourceBookingSnapshotInput } from './snapshot.types.js';
import {
  toPaise,
  fromPaise,
  strictFloatRupeesToPaise,
  applyPercentageHalfUp,
} from './money.js';

describe('Booking Finance Snapshot Adapter and Pure Logic (Chunk 2A-R1)', () => {
  const fixedTimestamp = new Date('2026-09-17T12:00:00.000Z');

  describe('Float-Boundary and Money Arithmetic (money.ts)', () => {
    it('should convert ordinary supported 2-decimal values accurately', () => {
      expect(toPaise(100)).toBe(10000n);
      expect(toPaise(100.5)).toBe(10050n);
      expect(toPaise(100.55)).toBe(10055n);
      expect(toPaise('100.50')).toBe(10050n);
      expect(toPaise('10000.00')).toBe(1000000n);
    });

    it('should handle permitted representation noise within narrow drift bound (<= 1e-5)', () => {
      // 19.999999999999996 (IEEE-754 representation noise of 20.00)
      const res = strictFloatRupeesToPaise(19.999999999999996);
      expect(res.exact).toBe(true);
      expect(res.paise).toBe(2000n);
    });

    it('should reject materially fractional-paisa inputs', () => {
      const res1 = strictFloatRupeesToPaise(100.125);
      expect(res1.exact).toBe(false);
      expect(res1.error).toMatch(/Material fractional-paisa precision/);

      const res2 = strictFloatRupeesToPaise(100.005);
      expect(res2.exact).toBe(false);
      expect(res2.error).toMatch(/Material fractional-paisa precision/);

      const res3 = strictFloatRupeesToPaise(19.123);
      expect(res3.exact).toBe(false);
      expect(res3.error).toMatch(/Material fractional-paisa precision/);
    });

    it('should reject NaN, Infinity, and unsafe float magnitudes', () => {
      expect(strictFloatRupeesToPaise(NaN).exact).toBe(false);
      expect(strictFloatRupeesToPaise(Infinity).exact).toBe(false);
      expect(strictFloatRupeesToPaise(-Infinity).exact).toBe(false);
      expect(strictFloatRupeesToPaise(1e25).exact).toBe(false);
      expect(strictFloatRupeesToPaise(Number.MAX_SAFE_INTEGER + 1000).exact).toBe(false);
    });

    it('should treat BigInt inputs as ALREADY in paise without multiplying by 100 again', () => {
      expect(toPaise(1000000n)).toBe(1000000n);
      expect(toPaise(500n)).toBe(500n);
      expect(toPaise(0n)).toBe(0n);
    });

    it('should format paise accurately and perform half-up rounding', () => {
      expect(fromPaise(1000000n)).toBe('10000.00');
      expect(fromPaise(50n)).toBe('0.50');
      expect(fromPaise(5n)).toBe('0.05');
      expect(fromPaise(0n)).toBe('0.00');
      expect(applyPercentageHalfUp(100000n, 1000n)).toBe(10000n); // 10% of 100000 = 10000
      expect(applyPercentageHalfUp(1n, 5000n)).toBe(1n); // Half-up
      expect(applyPercentageHalfUp(1n, 4999n)).toBe(0n);
    });
  });

  describe('Percentage to BPS Conversion', () => {
    it('should convert clean whole percentages and standard 2-decimal percentages', () => {
      expect(convertPercentageToBps(20)).toEqual({ bps: 2000n, exact: true });
      expect(convertPercentageToBps('20')).toEqual({ bps: 2000n, exact: true });
      expect(convertPercentageToBps('33.33')).toEqual({ bps: 3333n, exact: true });
      expect(convertPercentageToBps(33.33)).toEqual({ bps: 3333n, exact: true });
      expect(convertPercentageToBps(0)).toEqual({ bps: 0n, exact: true });
      expect(convertPercentageToBps(100)).toEqual({ bps: 10000n, exact: true });
      expect(convertPercentageToBps(null)).toEqual({ bps: null, exact: true });
    });

    it('should reject unsupported sub-basis-point precision', () => {
      const resStr = convertPercentageToBps('33.333');
      expect(resStr.exact).toBe(false);
      expect(resStr.error).toMatch(/Unsupported sub-basis-point precision/);

      const resNum = convertPercentageToBps(33.333);
      expect(resNum.exact).toBe(false);
      expect(resNum.error).toMatch(/Unsupported sub-basis-point/);
    });

    it('should reject out-of-bound percentages', () => {
      expect(convertPercentageToBps(-1).exact).toBe(false);
      expect(convertPercentageToBps(101).exact).toBe(false);
    });
  });

  describe('Source Paise Parsing', () => {
    it('should parse safe numbers, strings, and bigints accurately', () => {
      expect(parseSourcePaise(1000, 'basePrice')).toEqual({
        paise: 100000n,
        exact: true,
      });
      expect(parseSourcePaise('1000.50', 'basePrice')).toEqual({
        paise: 100050n,
        exact: true,
      });
      expect(parseSourcePaise(100050n, 'basePrice')).toEqual({
        paise: 100050n,
        exact: true,
      });
    });

    it('should reject materially fractional paise numbers without blind toFixed(2)', () => {
      const res = parseSourcePaise(100.005, 'basePrice');
      expect(res.exact).toBe(false);
      expect(res.error).toMatch(/Material fractional-paisa precision/);
    });

    it('should reject negative amounts and non-finite numbers', () => {
      expect(parseSourcePaise(-50, 'basePrice').exact).toBe(false);
      expect(parseSourcePaise(NaN, 'basePrice').exact).toBe(false);
      expect(parseSourcePaise(Infinity, 'basePrice').exact).toBe(false);
    });
  });

  describe('buildBookingFinanceSnapshot and Defaults', () => {
    it('should build a VALID snapshot when components reconcile exactly', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'book_valid_1',
        propertyId: 'prop_1',
        hostUserId: 'host_1',
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 500,
          totalAmount: 13660,
          currency: 'INR',
        },
        discount: {
          couponCode: 'PROMO500',
          discountFunding: 'PLATFORM',
        },
        coHost: {
          ruleId: 'rule_1',
          recipientUserId: 'cohost_user_1',
          ruleType: 'PERCENTAGE',
          percentage: 20,
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.reviewStatus).toBe('VALID');
      expect(snapshot.reviewReasons).toHaveLength(0);
      expect(snapshot.basePaise).toBe(toPaise('10000.00'));
      expect(snapshot.cleaningPaise).toBe(toPaise('1000.00'));
      expect(snapshot.serviceFeePaise).toBe(toPaise('1000.00'));
      expect(snapshot.taxPaise).toBe(toPaise('2160.00'));
      expect(snapshot.discountPaise).toBe(toPaise('500.00'));
      expect(snapshot.guestTotalPaise).toBe(toPaise('13660.00'));
      expect(snapshot.discountFunding).toBe('PLATFORM');
      expect(snapshot.coHostAgreementStatus).toBe('AGREED');
      expect(snapshot.coHostPercentageBps).toBe(2000n);
      expect(snapshot.coHostRuleTerms?.ruleType).toBe('PERCENTAGE');
      expect(snapshot.capturedAt).toBe(fixedTimestamp);
    });

    it('should validate AGREED co-host rules: flag missing recipientUserId or missing percentage', () => {
      const inputMissingRecipient: SourceBookingSnapshotInput = {
        bookingId: 'book_agreed_missing_recip',
        propertyId: 'prop_1',
        hostUserId: 'host_1',
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
          currency: 'INR',
        },
        discount: {},
        coHost: {
          ruleId: 'rule_bad',
          recipientUserId: null, // missing recipient!
          ruleType: 'PERCENTAGE',
          percentage: 20,
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snap1 = buildBookingFinanceSnapshot(inputMissingRecipient);
      expect(snap1.reviewStatus).toBe('NEEDS_REVIEW');
      expect(snap1.reviewReasons.some((r) => r.includes('COHOST_AGREED_MISSING_RECIPIENT'))).toBe(true);

      const inputMissingPercentage: SourceBookingSnapshotInput = {
        bookingId: 'book_agreed_missing_pct',
        propertyId: 'prop_1',
        hostUserId: 'host_1',
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
          currency: 'INR',
        },
        discount: {},
        coHost: {
          ruleId: 'rule_bad_2',
          recipientUserId: 'cohost_1',
          ruleType: 'PERCENTAGE',
          percentage: null, // missing percentage!
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snap2 = buildBookingFinanceSnapshot(inputMissingPercentage);
      expect(snap2.reviewStatus).toBe('NEEDS_REVIEW');
      expect(snap2.reviewReasons.some((r) => r.includes('COHOST_AGREED_MISSING_PERCENTAGE'))).toBe(true);
    });

    it('should flag PRICING_COMPONENT_MISMATCH and mark NEEDS_REVIEW if total != components sum', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'book_mismatch',
        propertyId: 'prop_1',
        hostUserId: 'host_1',
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 15000, // Should be 14160
        },
        discount: {},
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.reviewStatus).toBe('NEEDS_REVIEW');
      expect(snapshot.reviewReasons.some((r) => r.includes('PRICING_COMPONENT_MISMATCH'))).toBe(true);
      expect(snapshot.basePaise).toBe(toPaise('10000.00'));
    });

    it('should mark UNRESOLVED_DISCOUNT_FUNDING if discount > 0 without explicit funding policy', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'book_unres_disc',
        propertyId: 'prop_1',
        hostUserId: 'host_1',
        financials: {
          basePrice: 10000,
          cleaningFee: 0,
          serviceFee: 1000,
          taxAmount: 0,
          discountAmount: 500,
          totalAmount: 10500,
        },
        discount: {
          couponCode: 'MYDISCOUNT',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.discountFunding).toBe('UNRESOLVED');
      expect(snapshot.reviewStatus).toBe('NEEDS_REVIEW');
      expect(snapshot.reviewReasons.some((r) => r.includes('UNRESOLVED_DISCOUNT_FUNDING'))).toBe(true);
    });

    it('should mark co-host UNRESOLVED if status is PENDING_CONFIRMATION', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'book_pending_cohost',
        propertyId: 'prop_1',
        hostUserId: 'host_1',
        financials: {
          basePrice: 10000,
          cleaningFee: 0,
          serviceFee: 0,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: 10000,
        },
        discount: {},
        coHost: {
          ruleId: 'rule_pending',
          recipientUserId: 'cohost_1',
          ruleType: 'PERCENTAGE',
          percentage: 15,
          status: 'PENDING_CONFIRMATION',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.coHostAgreementStatus).toBe('UNRESOLVED');
      expect(snapshot.reviewStatus).toBe('NEEDS_REVIEW');
      expect(snapshot.reviewReasons.some((r) => r.includes('COHOST_AGREEMENT_PENDING_CONFIRMATION'))).toBe(true);
    });

    it('should serialize BigInt paise inside JSON as integer strings', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'book_ser_1',
        propertyId: 'prop_1',
        hostUserId: 'host_1',
        financials: {
          basePrice: 10000,
          cleaningFee: 1000,
          serviceFee: 1000,
          taxAmount: 2160,
          discountAmount: 0,
          totalAmount: 14160,
        },
        discount: {},
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      const serialized = serializeSnapshot(snapshot);

      expect(serialized.basePaise).toBe('1000000');
      expect(serialized.cleaningPaise).toBe('100000');
      expect(serialized.serviceFeePaise).toBe('100000');
      expect(serialized.taxPaise).toBe('216000');
      expect(serialized.guestTotalPaise).toBe('1416000');
      expect(serialized.formattedRupees?.baseAmount).toBe('10000.00');
      expect(() => JSON.stringify(serialized)).not.toThrow();
    });
  });

  describe('Canonical Comparison (snapshot.persistence.ts)', () => {
    it('should consider equivalent JSON with different key orders as identical', () => {
      const existing = {
        snapshotVersion: 1,
        captureProvenance: 'BOOKING_CREATION',
        currency: 'INR',
        basePaise: 1000000n,
        cleaningPaise: 100000n,
        serviceFeePaise: 100000n,
        taxPaise: 216000n,
        discountPaise: 0n,
        guestTotalPaise: 1416000n,
        hostUserId: 'host_1',
        propertyId: 'prop_1',
        discountFunding: 'NONE',
        coHostAgreementStatus: 'AGREED',
        coHostRecipientUserId: 'cohost_1',
        coHostRuleId: 'rule_1',
        coHostRuleType: 'PERCENTAGE',
        coHostPercentageBps: 2000n,
        coHostFixedPaise: null,
        coHostRuleTerms: { b_term: 'second', a_term: 'first', nested: { z: 1, y: 2 } },
        policyVersion: 'DRAFT_V1',
        reviewStatus: 'VALID',
        reviewReasons: ['REASON_B', 'REASON_A'],
        sourceData: {
          rawFinancials: { y: 2, x: 1 },
          rawDiscount: {},
          rawCoHost: null,
        },
      };

      const incoming = {
        bookingId: 'book_canonical_1',
        snapshotVersion: 1,
        capturedAt: new Date(Date.now() + 10000), // different capture time ignored
        captureProvenance: 'BOOKING_CREATION',
        currency: 'INR',
        basePaise: 1000000n,
        cleaningPaise: 100000n,
        serviceFeePaise: 100000n,
        taxPaise: 216000n,
        discountPaise: 0n,
        guestTotalPaise: 1416000n,
        hostUserId: 'host_1',
        propertyId: 'prop_1',
        discountFunding: 'NONE' as const,
        coHostAgreementStatus: 'AGREED' as const,
        coHostRecipientUserId: 'cohost_1',
        coHostRuleId: 'rule_1',
        coHostRuleType: 'PERCENTAGE',
        coHostPercentageBps: 2000n,
        coHostFixedPaise: null,
        coHostRuleTerms: { a_term: 'first', b_term: 'second', nested: { y: 2, z: 1 } },
        policyVersion: 'DRAFT_V1',
        reviewStatus: 'VALID' as const,
        reviewReasons: ['REASON_A', 'REASON_B'], // different reason order ignored
        sourceData: {
          rawFinancials: { x: 1, y: 2 },
          rawDiscount: {},
          rawCoHost: null,
        },
      };

      const result = compareCanonicalContent(existing, incoming);
      expect(result.identical).toBe(true);
      expect(Object.keys(result.differences)).toHaveLength(0);
    });

    it('should reject changed currency, policyVersion, coHostAgreementStatus, or captureProvenance as conflicts', () => {
      const existing = {
        snapshotVersion: 1,
        captureProvenance: 'BOOKING_CREATION',
        currency: 'INR',
        basePaise: 1000000n,
        cleaningPaise: 0n,
        serviceFeePaise: 0n,
        taxPaise: 0n,
        discountPaise: 0n,
        guestTotalPaise: 1000000n,
        hostUserId: 'host_1',
        propertyId: 'prop_1',
        discountFunding: 'NONE',
        coHostAgreementStatus: 'NONE',
        coHostRecipientUserId: null,
        coHostRuleId: null,
        coHostRuleType: null,
        coHostPercentageBps: null,
        coHostFixedPaise: null,
        coHostRuleTerms: null,
        policyVersion: 'DRAFT_V1',
        reviewStatus: 'VALID',
        reviewReasons: [],
      };

      const incomingChangedCurrency = {
        ...existing,
        bookingId: 'b1',
        capturedAt: new Date(),
        captureProvenance: 'BOOKING_CREATION',
        currency: 'USD',
        discountFunding: 'NONE' as const,
        coHostAgreementStatus: 'NONE' as const,
        reviewStatus: 'VALID' as const,
        sourceData: {},
      };

      const diffCurrency = compareCanonicalContent(existing, incomingChangedCurrency);
      expect(diffCurrency.identical).toBe(false);
      expect(diffCurrency.differences.currency).toBeDefined();

      const incomingChangedPolicy = {
        ...existing,
        bookingId: 'b1',
        capturedAt: new Date(),
        captureProvenance: 'BOOKING_CREATION',
        policyVersion: 'PRODUCTION_V2',
        discountFunding: 'NONE' as const,
        coHostAgreementStatus: 'NONE' as const,
        reviewStatus: 'VALID' as const,
        sourceData: {},
      };

      const diffPolicy = compareCanonicalContent(existing, incomingChangedPolicy);
      expect(diffPolicy.identical).toBe(false);
      expect(diffPolicy.differences.policyVersion).toBeDefined();

      const incomingChangedCoHost = {
        ...existing,
        bookingId: 'b1',
        capturedAt: new Date(),
        captureProvenance: 'BOOKING_CREATION',
        coHostAgreementStatus: 'AGREED' as const,
        discountFunding: 'NONE' as const,
        reviewStatus: 'VALID' as const,
        sourceData: {},
      };

      const diffCoHost = compareCanonicalContent(existing, incomingChangedCoHost);
      expect(diffCoHost.identical).toBe(false);
      expect(diffCoHost.differences.coHostAgreementStatus).toBeDefined();

      // Meaningful capture provenance mismatch must NOT be ignored
      const incomingChangedProvenance = {
        ...existing,
        bookingId: 'b1',
        capturedAt: new Date(),
        captureProvenance: 'HISTORICAL_RECONSTRUCTION',
        discountFunding: 'NONE' as const,
        coHostAgreementStatus: 'NONE' as const,
        reviewStatus: 'VALID' as const,
        sourceData: {},
      };

      const diffProv = compareCanonicalContent(existing, incomingChangedProvenance);
      expect(diffProv.identical).toBe(false);
      expect(diffProv.differences.captureProvenance).toBeDefined();
      expect(diffProv.differences.captureProvenance.existing).toBe('BOOKING_CREATION');
      expect(diffProv.differences.captureProvenance.incoming).toBe('HISTORICAL_RECONSTRUCTION');
    });
  });

  describe('Co-Host Rule Type Alignment & Compatibility Mapping', () => {
    const baseFinancials = {
      basePrice: 10000,
      cleaningFee: 1000,
      serviceFee: 1000,
      taxAmount: 2160,
      discountAmount: 0,
      totalAmount: 14160,
    };

    it('should support PERCENTAGE co-host rule', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'b_pct',
        propertyId: 'p1',
        hostUserId: 'h1',
        financials: baseFinancials,
        discount: {},
        coHost: {
          ruleId: 'r_pct',
          recipientUserId: 'cohost_user',
          ruleType: 'PERCENTAGE',
          percentage: 20,
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.coHostAgreementStatus).toBe('AGREED');
      expect(snapshot.coHostRuleType).toBe('PERCENTAGE');
      expect(snapshot.coHostPercentageBps).toBe(2000n);
      expect(snapshot.reviewStatus).toBe('VALID');
    });

    it('should support FIXED_AMOUNT co-host rule', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'b_fixed_amount',
        propertyId: 'p1',
        hostUserId: 'h1',
        financials: baseFinancials,
        discount: {},
        coHost: {
          ruleId: 'r_fixed_amt',
          recipientUserId: 'cohost_user',
          ruleType: 'FIXED_AMOUNT',
          fixedAmount: 1500,
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.coHostAgreementStatus).toBe('AGREED');
      expect(snapshot.coHostRuleType).toBe('FIXED_AMOUNT');
      expect(snapshot.coHostFixedPaise).toBe(150000n);
      expect(snapshot.reviewStatus).toBe('VALID');
    });

    it('should support CLEANING_FEE co-host rule without requiring percentage or fixedAmount', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'b_clean',
        propertyId: 'p1',
        hostUserId: 'h1',
        financials: baseFinancials,
        discount: {},
        coHost: {
          ruleId: 'r_clean',
          recipientUserId: 'cohost_user',
          ruleType: 'CLEANING_FEE',
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.coHostAgreementStatus).toBe('AGREED');
      expect(snapshot.coHostRuleType).toBe('CLEANING_FEE');
      expect(snapshot.coHostPercentageBps).toBeNull();
      expect(snapshot.coHostFixedPaise).toBeNull();
      expect(snapshot.reviewStatus).toBe('VALID');
    });

    it('should support CLEANING_FEE_PLUS_PERCENTAGE co-host rule', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'b_clean_pct',
        propertyId: 'p1',
        hostUserId: 'h1',
        financials: baseFinancials,
        discount: {},
        coHost: {
          ruleId: 'r_clean_pct',
          recipientUserId: 'cohost_user',
          ruleType: 'CLEANING_FEE_PLUS_PERCENTAGE',
          percentage: 10,
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.coHostAgreementStatus).toBe('AGREED');
      expect(snapshot.coHostRuleType).toBe('CLEANING_FEE_PLUS_PERCENTAGE');
      expect(snapshot.coHostPercentageBps).toBe(1000n);
      expect(snapshot.reviewStatus).toBe('VALID');
    });

    it('should map legacy FIXED rule type to canonical FIXED_AMOUNT with legacyRuleType in terms', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'b_legacy_fixed',
        propertyId: 'p1',
        hostUserId: 'h1',
        financials: baseFinancials,
        discount: {},
        coHost: {
          ruleId: 'r_legacy',
          recipientUserId: 'cohost_user',
          ruleType: 'FIXED', // legacy name
          fixedAmount: 2000,
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.coHostAgreementStatus).toBe('AGREED');
      expect(snapshot.coHostRuleType).toBe('FIXED_AMOUNT');
      expect(snapshot.coHostFixedPaise).toBe(200000n);
      expect(snapshot.coHostRuleTerms?.legacyRuleType).toBe('FIXED');
      expect(snapshot.reviewStatus).toBe('VALID');
    });

    it('should mark unknown rule type as invalid and flag reviewReasons', () => {
      const input: SourceBookingSnapshotInput = {
        bookingId: 'b_unknown_rule',
        propertyId: 'p1',
        hostUserId: 'h1',
        financials: baseFinancials,
        discount: {},
        coHost: {
          ruleId: 'r_unknown',
          recipientUserId: 'cohost_user',
          ruleType: 'UNSUPPORTED_RULE_TYPE',
          status: 'ACTIVE',
        },
        capturedAt: fixedTimestamp,
      };

      const snapshot = buildBookingFinanceSnapshot(input);
      expect(snapshot.coHostAgreementStatus).toBe('AGREED');
      expect(snapshot.reviewStatus).toBe('NEEDS_REVIEW');
      expect(
        snapshot.reviewReasons.some((r) =>
          r.includes('COHOST_AGREED_INVALID_RULE_TYPE'),
        ),
      ).toBe(true);
    });
  });

  describe('Numeric Boundary & Precision Proofs', () => {
    it('should convert maximum safe float rupees preserving exact paisa precision', () => {
      // 1,000,000,000.00 rupees (1 Billion INR) = 100,000,000,000 paise
      const maxSafeRupees = 1000000000;
      const res = strictFloatRupeesToPaise(maxSafeRupees);
      expect(res.exact).toBe(true);
      expect(res.paise).toBe(100000000000n);
    });

    it('should reject float rupees exceeding safe float paisa precision limit', () => {
      // Numbers exceeding MAX_SAFE_FLOAT_RUPEES (e.g. 90 trillion or 1,000,000,001) must be rejected
      const unsafeFloat = 1000000001;
      const res = strictFloatRupeesToPaise(unsafeFloat);
      expect(res.exact).toBe(false);
      expect(res.error).toMatch(/exceeds safe paisa precision limit/);

      const ninetyTrillion = 90071992547409.91;
      const resTrillion = strictFloatRupeesToPaise(ninetyTrillion);
      expect(resTrillion.exact).toBe(false);
      expect(resTrillion.error).toMatch(/exceeds safe paisa precision limit/);
    });

    it('should support string and BigInt inputs well beyond JavaScript float precision', () => {
      // 500 trillion rupees as string -> 50,000,000,000,000,050 paise
      const largeString = '500000000000000.50';
      const paise = toPaise(largeString);
      expect(paise).toBe(50000000000000050n);

      // Raw BigInt already in paise
      const largeBigInt = 9000000000000000000n;
      expect(toPaise(largeBigInt)).toBe(9000000000000000000n);
    });
  });
});
