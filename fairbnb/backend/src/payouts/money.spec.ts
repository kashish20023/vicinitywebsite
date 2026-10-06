import {
  toPaise,
  fromPaise,
  strictFloatRupeesToPaise,
  MAX_SAFE_FLOAT_RUPEES,
  PG_BIGINT_MAX,
  PG_BIGINT_MIN,
  isPgBigInt,
  isNonNegativePgBigInt,
} from './money';

describe('Monetary Precision and Conversion Engine (Phase 0 Regression)', () => {
  describe('A. IEEE-754 Float Precision Collision and Range Rejection', () => {
    it('demonstrates JavaScript float collision at 90 trillion and proves rejection by strictFloatRupeesToPaise', () => {
      // Demonstrable JS floating point collision:
      const num1 = Number('90071992547409.90');
      const num2 = Number('90071992547409.91');
      expect(num1 === num2).toBe(true); // Demonstrates collision in JS Number!

      // strictFloatRupeesToPaise MUST reject numbers exceeding MAX_SAFE_FLOAT_RUPEES
      const res1 = strictFloatRupeesToPaise(num1);
      expect(res1.exact).toBe(false);
      expect(res1.paise).toBeNull();
      expect(res1.error).toContain('exceeds safe paisa precision limit');

      expect(() => toPaise(num1)).toThrow('exceeds safe paisa precision limit');
      expect(() => toPaise(num2)).toThrow('exceeds safe paisa precision limit');

      // However, exact decimal strings retain full precision and distinguish adjacent paise!
      const paise1 = toPaise('90071992547409.90');
      const paise2 = toPaise('90071992547409.91');
      expect(paise1).toBe(9007199254740990n);
      expect(paise2).toBe(9007199254740991n);
      expect(paise2 - paise1).toBe(1n); // Exactly 1 paisa difference!
    });

    it('enforces the conservative upper bound MAX_SAFE_FLOAT_RUPEES (₹1 Billion / 100 Crores)', () => {
      expect(MAX_SAFE_FLOAT_RUPEES).toBe(1000000000);

      // At exactly ₹1 Billion
      const atLimit = strictFloatRupeesToPaise(1000000000);
      expect(atLimit.exact).toBe(true);
      expect(atLimit.paise).toBe(100000000000n);

      // Slightly above limit
      const aboveLimit = strictFloatRupeesToPaise(1000000001);
      expect(aboveLimit.exact).toBe(false);
      expect(aboveLimit.error).toContain('exceeds safe paisa precision limit');
    });
  });

  describe('B. Ordinary Two-Decimal Values', () => {
    it('accurately parses standard two-decimal float and string amounts', () => {
      expect(toPaise(100.5)).toBe(10050n);
      expect(toPaise('100.50')).toBe(10050n);
      expect(toPaise(0.99)).toBe(99n);
      expect(toPaise('0.99')).toBe(99n);
      expect(toPaise(1234567.89)).toBe(123456789n);
      expect(toPaise('1234567.89')).toBe(123456789n);
      expect(toPaise(0)).toBe(0n);
      expect(toPaise('0.00')).toBe(0n);
    });

    it('formats paise back to exact two-decimal string format', () => {
      expect(fromPaise(10050n)).toBe('100.50');
      expect(fromPaise(99n)).toBe('0.99');
      expect(fromPaise(5n)).toBe('0.05');
      expect(fromPaise(0n)).toBe('0.00');
      expect(fromPaise(-150n)).toBe('-1.50');
    });
  });

  describe('C. Material Fractional-Paisa Values & Noise Tolerance', () => {
    it('rejects material fractional-paisa values (> 2 decimal places)', () => {
      // Numbers with real third decimal place (> 1e-5 drift)
      const res1 = strictFloatRupeesToPaise(10.005);
      expect(res1.exact).toBe(false);
      expect(res1.error).toContain('Material fractional-paisa precision detected');

      const res2 = strictFloatRupeesToPaise(10.123);
      expect(res2.exact).toBe(false);
      expect(res2.error).toContain('Material fractional-paisa precision detected');

      expect(() => toPaise('10.001')).toThrow('more than 2 decimal places');
      expect(() => toPaise('10.999')).toThrow('more than 2 decimal places');
    });

    it('tolerates IEEE-754 representation noise where drift <= 1e-5', () => {
      // 19.999999999999996 is binary float artifact of 20 - 4e-15
      const noiseValue = 19.999999999999996;
      const res = strictFloatRupeesToPaise(noiseValue);
      expect(res.exact).toBe(true);
      expect(res.paise).toBe(2000n);
    });
  });

  describe('D. Non-Finite and Malformed Inputs', () => {
    it('rejects NaN, Infinity, and non-number types', () => {
      expect(strictFloatRupeesToPaise(NaN).exact).toBe(false);
      expect(strictFloatRupeesToPaise(Infinity).exact).toBe(false);
      expect(strictFloatRupeesToPaise(-Infinity).exact).toBe(false);
      expect(() => toPaise('abc')).toThrow('Invalid monetary string format');
      expect(() => toPaise('')).toThrow('Empty string');
      expect(() => toPaise(null as any)).toThrow(TypeError);
    });
  });

  describe('E. PostgreSQL BigInt Bounds', () => {
    it('validates PostgreSQL signed 64-bit integer range', () => {
      expect(isPgBigInt(PG_BIGINT_MAX)).toBe(true);
      expect(isPgBigInt(PG_BIGINT_MIN)).toBe(true);
      expect(isPgBigInt(PG_BIGINT_MAX + 1n)).toBe(false);
      expect(isPgBigInt(PG_BIGINT_MIN - 1n)).toBe(false);

      expect(isNonNegativePgBigInt(0n)).toBe(true);
      expect(isNonNegativePgBigInt(PG_BIGINT_MAX)).toBe(true);
      expect(isNonNegativePgBigInt(-1n)).toBe(false);
    });

    it('throws RangeError when converting string exceeding PostgreSQL 64-bit bounds', () => {
      const hugeRupeeString = '100000000000000000000000.00';
      expect(() => toPaise(hugeRupeeString)).toThrow(RangeError);
      expect(() => toPaise(PG_BIGINT_MAX + 1n)).toThrow(RangeError);
    });
  });
});
