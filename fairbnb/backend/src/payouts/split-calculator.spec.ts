import {
  toPaise,
  fromPaise,
  applyPercentageHalfUp,
  BPS_DIVISOR,
} from './money.js';
import { calculateSplit } from './split-calculator.js';
import {
  SplitCalculationInput,
  CalculatedSplit,
  HeldSplit,
} from './split-calculator.types.js';

describe('FairBnB Payout Split Engine (Chunk 1)', () => {
  describe('Money Helpers (money.ts)', () => {
    it('should correctly convert decimal strings to bigint paise', () => {
      expect(toPaise('10000.00')).toBe(1000000n);
      expect(toPaise('10000.5')).toBe(1000050n);
      expect(toPaise('10000.05')).toBe(1000005n);
      expect(toPaise('10000')).toBe(1000000n);
      expect(toPaise('0.01')).toBe(1n);
      expect(toPaise('0.00')).toBe(0n);
      expect(toPaise('-500.00')).toBe(-50000n);
      expect(toPaise(5000n)).toBe(5000n);
      expect(toPaise(100)).toBe(10000n);
    });

    it('should throw on invalid monetary strings or > 2 decimal places', () => {
      expect(() => toPaise('10.005')).toThrow(/more than 2 decimal places/);
      expect(() => toPaise('')).toThrow(/Empty string/);
      expect(() => toPaise('abc')).toThrow(/Invalid monetary string/);
      expect(() => toPaise('10.2.3')).toThrow(/Invalid monetary string/);
    });

    it('should format bigint paise into exact 2-decimal strings', () => {
      expect(fromPaise(1000000n)).toBe('10000.00');
      expect(fromPaise(1000050n)).toBe('10000.50');
      expect(fromPaise(1000005n)).toBe('10000.05');
      expect(fromPaise(0n)).toBe('0.00');
      expect(fromPaise(5n)).toBe('0.05');
      expect(fromPaise(50n)).toBe('0.50');
      expect(fromPaise(-50000n)).toBe('-500.00');
      expect(fromPaise(-5n)).toBe('-0.05');
    });

    it('should correctly perform half-up percentage rounding', () => {
      // 1 paisa at 50.00% (5000 bps) -> (1 * 5000 + 5000) / 10000 = 10000 / 10000 = 1n
      expect(applyPercentageHalfUp(1n, 5000n)).toBe(1n);
      // 1 paisa at 49.99% (4999 bps) -> (1 * 4999 + 5000) / 10000 = 9999 / 10000 = 0n
      expect(applyPercentageHalfUp(1n, 4999n)).toBe(0n);
      // 0 paise gives 0
      expect(applyPercentageHalfUp(0n, 5000n)).toBe(0n);
      // 0 bps gives 0
      expect(applyPercentageHalfUp(100000n, 0n)).toBe(0n);
      // 10000 bps (100%) gives full amount
      expect(applyPercentageHalfUp(123456n, 10000n)).toBe(123456n);
    });

    it('should reject invalid percentage basis points', () => {
      expect(() => applyPercentageHalfUp(1000n, -1n)).toThrow(RangeError);
      expect(() => applyPercentageHalfUp(1000n, 10001n)).toThrow(RangeError);
    });
  });

  describe('Required Fixtures (A through H)', () => {
    // Base 10,000; cleaning 1,000; service fee 1,000; tax 2,160.
    const basePaise = toPaise('10000.00'); // 1,000,000n
    const cleaningPaise = toPaise('1000.00'); // 100,000n
    const serviceFeePaise = toPaise('1000.00'); // 100,000n
    const taxPaise = toPaise('2160.00'); // 216,000n

    it('Fixture A: No discount/refund/co-host -> Host 11,000; platform 1,000; tax 2,160', () => {
      const discountPaise = 0n;
      const guestTotalPaise =
        basePaise + cleaningPaise + serviceFeePaise + taxPaise - discountPaise; // 14,160.00

      const input: SplitCalculationInput = {
        bookingId: 'book_fixture_a',
        currency: 'INR',
        basePaise,
        cleaningPaise,
        serviceFeePaise,
        taxPaise,
        discountPaise,
        guestTotalPaise,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: { status: 'NONE' },
      };

      const result = calculateSplit(input);
      expect(result.status).toBe('CALCULATED');
      const calc = result as CalculatedSplit;

      expect(calc.breakdown.hostAllocationPaise).toBe(toPaise('11000.00'));
      expect(calc.breakdown.coHostAllocationPaise).toBe(0n);
      expect(calc.breakdown.platformAllocationPaise).toBe(toPaise('1000.00'));
      expect(calc.breakdown.taxAllocationPaise).toBe(toPaise('2160.00'));
      expect(calc.reconciliation.isReconciled).toBe(true);
      expect(calc.reconciliation.discrepancyPaise).toBe(0n);
    });

    it('Fixture B: Platform-funded discount 500; co-host 20% -> Host 9,000; co-host 2,000; platform 500; tax 2,160', () => {
      const discountPaise = toPaise('500.00'); // 50,000n
      const guestTotalPaise =
        basePaise + cleaningPaise + serviceFeePaise + taxPaise - discountPaise; // 13,660.00

      const input: SplitCalculationInput = {
        bookingId: 'book_fixture_b',
        currency: 'INR',
        basePaise,
        cleaningPaise,
        serviceFeePaise,
        taxPaise,
        discountPaise,
        guestTotalPaise,
        discountFunding: 'PLATFORM',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_cohost_1',
          ruleType: 'PERCENTAGE',
          percentageBps: 2000n, // 20.00%
        },
      };

      const result = calculateSplit(input);
      expect(result.status).toBe('CALCULATED');
      const calc = result as CalculatedSplit;

      expect(calc.breakdown.hostAllocationPaise).toBe(toPaise('9000.00'));
      expect(calc.breakdown.coHostAllocationPaise).toBe(toPaise('2000.00'));
      expect(calc.breakdown.platformAllocationPaise).toBe(toPaise('500.00'));
      expect(calc.breakdown.taxAllocationPaise).toBe(toPaise('2160.00'));
      expect(calc.reconciliation.isReconciled).toBe(true);
      expect(calc.reconciliation.discrepancyPaise).toBe(0n);
    });

    it('Fixture C: Host-funded discount 500; co-host 20% -> Host 8,600; co-host 1,900; platform 1,000; tax 2,160', () => {
      const discountPaise = toPaise('500.00');
      const guestTotalPaise =
        basePaise + cleaningPaise + serviceFeePaise + taxPaise - discountPaise; // 13,660.00

      const input: SplitCalculationInput = {
        bookingId: 'book_fixture_c',
        currency: 'INR',
        basePaise,
        cleaningPaise,
        serviceFeePaise,
        taxPaise,
        discountPaise,
        guestTotalPaise,
        discountFunding: 'HOST',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_cohost_1',
          ruleType: 'PERCENTAGE',
          percentageBps: 2000n,
        },
      };

      const result = calculateSplit(input);
      expect(result.status).toBe('CALCULATED');
      const calc = result as CalculatedSplit;

      expect(calc.breakdown.hostAllocationPaise).toBe(toPaise('8600.00'));
      expect(calc.breakdown.coHostAllocationPaise).toBe(toPaise('1900.00'));
      expect(calc.breakdown.platformAllocationPaise).toBe(toPaise('1000.00'));
      expect(calc.breakdown.taxAllocationPaise).toBe(toPaise('2160.00'));
      expect(calc.reconciliation.isReconciled).toBe(true);
      expect(calc.reconciliation.discrepancyPaise).toBe(0n);
    });

    it('Fixture D: Case B plus refund 2,360 (accommodation 2,000, tax 360) -> Host 7,400; co-host 1,600; platform 500; tax 1,800', () => {
      const discountPaise = toPaise('500.00');
      const guestTotalPaise =
        basePaise + cleaningPaise + serviceFeePaise + taxPaise - discountPaise; // 13,660.00

      const input: SplitCalculationInput = {
        bookingId: 'book_fixture_d',
        currency: 'INR',
        basePaise,
        cleaningPaise,
        serviceFeePaise,
        taxPaise,
        discountPaise,
        guestTotalPaise,
        discountFunding: 'PLATFORM',
        completedRefunds: [
          {
            id: 'rfnd_1',
            amountPaise: toPaise('2360.00'),
            accommodationPaise: toPaise('2000.00'),
            cleaningPaise: 0n,
            platformPaise: 0n,
            taxPaise: toPaise('360.00'),
          },
        ],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_cohost_1',
          ruleType: 'PERCENTAGE',
          percentageBps: 2000n,
        },
      };

      const result = calculateSplit(input);
      expect(result.status).toBe('CALCULATED');
      const calc = result as CalculatedSplit;

      expect(calc.breakdown.hostAllocationPaise).toBe(toPaise('7400.00'));
      expect(calc.breakdown.coHostAllocationPaise).toBe(toPaise('1600.00'));
      expect(calc.breakdown.platformAllocationPaise).toBe(toPaise('500.00'));
      expect(calc.breakdown.taxAllocationPaise).toBe(toPaise('1800.00'));
      expect(calc.reconciliation.isReconciled).toBe(true);
      expect(calc.reconciliation.discrepancyPaise).toBe(0n);
    });

    it('Fixture E: Case D with CLEANING_FEE_PLUS_PERCENTAGE at 10% -> Host 7,200; co-host 1,800; platform 500; tax 1,800', () => {
      const discountPaise = toPaise('500.00');
      const guestTotalPaise =
        basePaise + cleaningPaise + serviceFeePaise + taxPaise - discountPaise;

      const input: SplitCalculationInput = {
        bookingId: 'book_fixture_e',
        currency: 'INR',
        basePaise,
        cleaningPaise,
        serviceFeePaise,
        taxPaise,
        discountPaise,
        guestTotalPaise,
        discountFunding: 'PLATFORM',
        completedRefunds: [
          {
            id: 'rfnd_1',
            amountPaise: toPaise('2360.00'),
            accommodationPaise: toPaise('2000.00'),
            cleaningPaise: 0n,
            platformPaise: 0n,
            taxPaise: toPaise('360.00'),
          },
        ],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_cohost_1',
          ruleType: 'CLEANING_FEE_PLUS_PERCENTAGE',
          percentageBps: 1000n, // 10.00%
        },
      };

      const result = calculateSplit(input);
      expect(result.status).toBe('CALCULATED');
      const calc = result as CalculatedSplit;

      // netAccommodation = 10,000 - 2,000 = 8,000
      // netCleaning = 1,000
      // coHost = netCleaning (1,000) + 10% of netAccommodation (800) = 1,800
      // hostPool = 9,000 -> host = 9,000 - 1,800 = 7,200
      // platform = 1,000 - 500 = 500
      // tax = 2,160 - 360 = 1,800
      expect(calc.breakdown.hostAllocationPaise).toBe(toPaise('7200.00'));
      expect(calc.breakdown.coHostAllocationPaise).toBe(toPaise('1800.00'));
      expect(calc.breakdown.platformAllocationPaise).toBe(toPaise('500.00'));
      expect(calc.breakdown.taxAllocationPaise).toBe(toPaise('1800.00'));
      expect(calc.reconciliation.isReconciled).toBe(true);
      expect(calc.reconciliation.discrepancyPaise).toBe(0n);
    });

    it('Fixture F: Platform discount 1,500 against service fee 1,000 -> HELD with funding shortfall 500', () => {
      const discountPaise = toPaise('1500.00');
      const guestTotalPaise =
        basePaise + cleaningPaise + serviceFeePaise + taxPaise - discountPaise;

      const input: SplitCalculationInput = {
        bookingId: 'book_fixture_f',
        currency: 'INR',
        basePaise,
        cleaningPaise,
        serviceFeePaise, // 1,000.00
        taxPaise,
        discountPaise, // 1,500.00
        guestTotalPaise,
        discountFunding: 'PLATFORM',
        completedRefunds: [],
        coHostAgreement: { status: 'NONE' },
      };

      const result = calculateSplit(input);
      expect(result.status).toBe('HELD');
      const held = result as HeldSplit;

      expect(held.reasonCodes).toContain('FUNDING_GAP');
      const gapDiagnostic = held.diagnostics.find(
        (d) => d.code === 'FUNDING_GAP',
      );
      expect(gapDiagnostic).toBeDefined();
      expect(gapDiagnostic?.details?.shortfallPaise).toBe(toPaise('500.00'));
    });

    it('Fixture G: Fixed co-host 12,000 against hostPool 11,000 -> HELD with COHOST_EXCEEDS_POOL', () => {
      const discountPaise = 0n;
      const guestTotalPaise =
        basePaise + cleaningPaise + serviceFeePaise + taxPaise;

      const input: SplitCalculationInput = {
        bookingId: 'book_fixture_g',
        currency: 'INR',
        basePaise, // 10,000
        cleaningPaise, // 1,000 -> hostPool = 11,000
        serviceFeePaise,
        taxPaise,
        discountPaise,
        guestTotalPaise,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_cohost_1',
          ruleType: 'FIXED_AMOUNT',
          fixedAmountPaise: toPaise('12000.00'), // 12,000 > 11,000
        },
      };

      const result = calculateSplit(input);
      expect(result.status).toBe('HELD');
      const held = result as HeldSplit;

      expect(held.reasonCodes).toContain('COHOST_EXCEEDS_POOL');
      const poolDiagnostic = held.diagnostics.find(
        (d) => d.code === 'COHOST_EXCEEDS_POOL',
      );
      expect(poolDiagnostic).toBeDefined();
      expect(poolDiagnostic?.details?.shortfallPaise).toBe(toPaise('1000.00'));
    });

    it('Fixture H: Net accommodation 1,000.05 at 33.33% -> Co-host 333.32; host residual 666.73', () => {
      const netAccomPaise = toPaise('1000.05'); // 100,005n
      const guestTotalPaise = netAccomPaise;

      const input: SplitCalculationInput = {
        bookingId: 'book_fixture_h',
        currency: 'INR',
        basePaise: netAccomPaise,
        cleaningPaise: 0n,
        serviceFeePaise: 0n,
        taxPaise: 0n,
        discountPaise: 0n,
        guestTotalPaise,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_cohost_1',
          ruleType: 'PERCENTAGE',
          percentageBps: 3333n, // 33.33%
        },
      };

      const result = calculateSplit(input);
      expect(result.status).toBe('CALCULATED');
      const calc = result as CalculatedSplit;

      expect(calc.breakdown.coHostAllocationPaise).toBe(toPaise('333.32'));
      expect(calc.breakdown.hostAllocationPaise).toBe(toPaise('666.73'));
      expect(
        calc.breakdown.coHostAllocationPaise + calc.breakdown.hostAllocationPaise,
      ).toBe(netAccomPaise);
      expect(calc.reconciliation.isReconciled).toBe(true);
    });
  });

  describe('Additional Comprehensive Cases', () => {
    const base = toPaise('10000.00');
    const clean = toPaise('1000.00');
    const fee = toPaise('1000.00');
    const tax = toPaise('2160.00');
    const total = base + clean + fee + tax;

    it('should test Co-Host Rule Type: CLEANING_FEE alone', () => {
      const input: SplitCalculationInput = {
        bookingId: 'book_cohost_clean',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_cleaner',
          ruleType: 'CLEANING_FEE',
        },
      };

      const result = calculateSplit(input) as CalculatedSplit;
      expect(result.status).toBe('CALCULATED');
      expect(result.breakdown.coHostAllocationPaise).toBe(clean); // 1,000.00
      expect(result.breakdown.hostAllocationPaise).toBe(base); // 10,000.00
      expect(result.reconciliation.isReconciled).toBe(true);
    });

    it('should test Co-Host Rule Type: FIXED_AMOUNT within pool', () => {
      const input: SplitCalculationInput = {
        bookingId: 'book_cohost_fixed',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_cohost',
          ruleType: 'FIXED_AMOUNT',
          fixedAmountPaise: toPaise('2500.00'),
        },
      };

      const result = calculateSplit(input) as CalculatedSplit;
      expect(result.status).toBe('CALCULATED');
      expect(result.breakdown.coHostAllocationPaise).toBe(toPaise('2500.00'));
      expect(result.breakdown.hostAllocationPaise).toBe(toPaise('8500.00'));
      expect(result.reconciliation.isReconciled).toBe(true);
    });

    it('should hold when discount funding is UNRESOLVED but discount > 0', () => {
      const discount = toPaise('500.00');
      const input: SplitCalculationInput = {
        bookingId: 'book_unres_discount',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: discount,
        guestTotalPaise: total - discount,
        discountFunding: 'UNRESOLVED',
        completedRefunds: [],
        coHostAgreement: { status: 'NONE' },
      };

      const result = calculateSplit(input) as HeldSplit;
      expect(result.status).toBe('HELD');
      expect(result.reasonCodes).toContain('UNRESOLVED_DISCOUNT_FUNDING');
    });

    it('should hold when co-host agreement is UNRESOLVED', () => {
      const input: SplitCalculationInput = {
        bookingId: 'book_unres_cohost',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: { status: 'UNRESOLVED' },
      };

      const result = calculateSplit(input) as HeldSplit;
      expect(result.status).toBe('HELD');
      expect(result.reasonCodes).toContain('UNRESOLVED_COHOST_AGREEMENT');
    });

    it('should hold on duplicate refund IDs', () => {
      const input: SplitCalculationInput = {
        bookingId: 'book_dup_refund',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [
          {
            id: 'rfnd_same',
            amountPaise: toPaise('500.00'),
            accommodationPaise: toPaise('500.00'),
            cleaningPaise: 0n,
            platformPaise: 0n,
            taxPaise: 0n,
          },
          {
            id: 'rfnd_same', // duplicate ID
            amountPaise: toPaise('500.00'),
            accommodationPaise: toPaise('500.00'),
            cleaningPaise: 0n,
            platformPaise: 0n,
            taxPaise: 0n,
          },
        ],
        coHostAgreement: { status: 'NONE' },
      };

      const result = calculateSplit(input) as HeldSplit;
      expect(result.status).toBe('HELD');
      expect(result.reasonCodes).toContain('DUPLICATE_REFUND_ID');
    });

    it('should hold on refund breakdown sum mismatch', () => {
      const input: SplitCalculationInput = {
        bookingId: 'book_mismatch_refund',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [
          {
            id: 'rfnd_bad_sum',
            amountPaise: toPaise('1000.00'),
            accommodationPaise: toPaise('400.00'),
            cleaningPaise: toPaise('300.00'),
            platformPaise: 0n,
            taxPaise: 0n, // sum = 700 != 1000
          },
        ],
        coHostAgreement: { status: 'NONE' },
      };

      const result = calculateSplit(input) as HeldSplit;
      expect(result.status).toBe('HELD');
      expect(result.reasonCodes).toContain('REFUND_TOTAL_MISMATCH');
    });

    it('should hold when refund exceeds individual component capacity', () => {
      const input: SplitCalculationInput = {
        bookingId: 'book_overflow_refund',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean, // 1,000.00
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [
          {
            id: 'rfnd_overflow',
            amountPaise: toPaise('1500.00'),
            accommodationPaise: 0n,
            cleaningPaise: toPaise('1500.00'), // 1,500 > cleaning fee 1,000
            platformPaise: 0n,
            taxPaise: 0n,
          },
        ],
        coHostAgreement: { status: 'NONE' },
      };

      const result = calculateSplit(input) as HeldSplit;
      expect(result.status).toBe('HELD');
      expect(result.reasonCodes).toContain('REFUND_EXCEEDS_COMPONENT');
    });

    it('should correctly calculate a 100% full refund across all components', () => {
      const input: SplitCalculationInput = {
        bookingId: 'book_full_refund',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [
          {
            id: 'rfnd_full',
            amountPaise: total,
            accommodationPaise: base,
            cleaningPaise: clean,
            platformPaise: fee,
            taxPaise: tax,
          },
        ],
        coHostAgreement: { status: 'NONE' },
      };

      const result = calculateSplit(input) as CalculatedSplit;
      expect(result.status).toBe('CALCULATED');
      expect(result.breakdown.hostAllocationPaise).toBe(0n);
      expect(result.breakdown.coHostAllocationPaise).toBe(0n);
      expect(result.breakdown.platformAllocationPaise).toBe(0n);
      expect(result.breakdown.taxAllocationPaise).toBe(0n);
      expect(result.reconciliation.isReconciled).toBe(true);
      expect(result.reconciliation.netCollectedPaise).toBe(0n);
      expect(result.reconciliation.sumOfAllocationsPaise).toBe(0n);
    });

    it('should test 0%, 100%, and invalid co-host percentages', () => {
      // 0%
      const res0 = calculateSplit({
        bookingId: 'book_0pct',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_1',
          ruleType: 'PERCENTAGE',
          percentageBps: 0n,
        },
      }) as CalculatedSplit;
      expect(res0.breakdown.coHostAllocationPaise).toBe(0n);

      // 100%
      const res100 = calculateSplit({
        bookingId: 'book_100pct',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_1',
          ruleType: 'PERCENTAGE',
          percentageBps: 10000n,
        },
      }) as CalculatedSplit;
      expect(res100.breakdown.coHostAllocationPaise).toBe(base); // all accommodation
      expect(res100.breakdown.hostAllocationPaise).toBe(clean); // cleaning stays with host

      // Invalid percentage > 10000 bps
      const resInvalid = calculateSplit({
        bookingId: 'book_invalid_pct',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [],
        coHostAgreement: {
          status: 'AGREED',
          recipientUserId: 'usr_1',
          ruleType: 'PERCENTAGE',
          percentageBps: 10001n,
        },
      }) as HeldSplit;
      expect(resInvalid.status).toBe('HELD');
      expect(resInvalid.reasonCodes).toContain('INVALID_COHOST_RULE');
    });

    it('should be deterministic regardless of refund input order', () => {
      const r1 = {
        id: 'r_part_1',
        amountPaise: toPaise('1000.00'),
        accommodationPaise: toPaise('1000.00'),
        cleaningPaise: 0n,
        platformPaise: 0n,
        taxPaise: 0n,
      };
      const r2 = {
        id: 'r_part_2',
        amountPaise: toPaise('500.00'),
        accommodationPaise: 0n,
        cleaningPaise: toPaise('500.00'),
        platformPaise: 0n,
        taxPaise: 0n,
      };

      const inputOrder1: SplitCalculationInput = {
        bookingId: 'book_order_test',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: [r1, r2],
        coHostAgreement: { status: 'NONE' },
      };

      const inputOrder2: SplitCalculationInput = {
        ...inputOrder1,
        completedRefunds: [r2, r1],
      };

      const res1 = calculateSplit(inputOrder1) as CalculatedSplit;
      const res2 = calculateSplit(inputOrder2) as CalculatedSplit;

      expect(res1.breakdown).toEqual(res2.breakdown);
      expect(res1.formatted).toEqual(res2.formatted);
      expect(res1.reconciliation).toEqual(res2.reconciliation);
    });

    it('should not mutate input objects', () => {
      const input: SplitCalculationInput = Object.freeze({
        bookingId: 'book_immutability',
        currency: 'INR',
        basePaise: base,
        cleaningPaise: clean,
        serviceFeePaise: fee,
        taxPaise: tax,
        discountPaise: 0n,
        guestTotalPaise: total,
        discountFunding: 'NONE',
        completedRefunds: Object.freeze([
          Object.freeze({
            id: 'r_freeze',
            amountPaise: toPaise('500.00'),
            accommodationPaise: toPaise('500.00'),
            cleaningPaise: 0n,
            platformPaise: 0n,
            taxPaise: 0n,
          }),
        ]),
        coHostAgreement: Object.freeze({
          status: 'AGREED',
          recipientUserId: 'usr_cohost',
          ruleType: 'PERCENTAGE',
          percentageBps: 2000n,
        }),
      });

      expect(() => calculateSplit(input)).not.toThrow();
    });

    it('should enforce reconciliation invariant across arbitrary valid configurations', () => {
      const testCases = [
        { base: '5000.00', clean: '500.00', fee: '500.00', tax: '1080.00', disc: '200.00', funding: 'PLATFORM' as const, cohostBps: 1500n },
        { base: '25000.00', clean: '2000.00', fee: '2500.00', tax: '5310.00', disc: '1000.00', funding: 'HOST' as const, cohostBps: 2500n },
        { base: '750.50', clean: '100.25', fee: '75.05', tax: '166.64', disc: '0.00', funding: 'NONE' as const, cohostBps: 5000n },
      ];

      for (const tc of testCases) {
        const b = toPaise(tc.base);
        const c = toPaise(tc.clean);
        const f = toPaise(tc.fee);
        const t = toPaise(tc.tax);
        const d = toPaise(tc.disc);
        const gt = b + c + f + t - d;

        const res = calculateSplit({
          bookingId: 'book_invariant_loop',
          currency: 'INR',
          basePaise: b,
          cleaningPaise: c,
          serviceFeePaise: f,
          taxPaise: t,
          discountPaise: d,
          guestTotalPaise: gt,
          discountFunding: tc.funding,
          completedRefunds: [],
          coHostAgreement: {
            status: 'AGREED',
            recipientUserId: 'usr_test',
            ruleType: 'PERCENTAGE',
            percentageBps: tc.cohostBps,
          },
        });

        expect(resultIsCalculated(res)).toBe(true);
        if (resultIsCalculated(res)) {
          expect(res.reconciliation.isReconciled).toBe(true);
          expect(res.reconciliation.discrepancyPaise).toBe(0n);
          expect(
            res.breakdown.hostAllocationPaise +
              res.breakdown.coHostAllocationPaise +
              res.breakdown.platformAllocationPaise +
              res.breakdown.taxAllocationPaise,
          ).toBe(gt);
        }
      }
    });
  });
});

function resultIsCalculated(res: any): res is CalculatedSplit {
  return res.status === 'CALCULATED';
}
