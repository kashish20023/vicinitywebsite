/**
 * Exact monetary arithmetic helpers for FairBnB Payout Split Engine (Chunk 1 & Chunk 2A).
 *
 * Unit Conventions:
 * - Internal representation: bigint paise (1 INR = 100 paise).
 * - BigInt inputs to toPaise() are treated as ALREADY in paise.
 * - String and Number inputs to toPaise() are treated as RUPEES (e.g. "100.50" -> 10050n paise).
 * - Percentage: integer basis points (bps) where 10000 bps = 100.00%.
 * - Half-up percentage rounding formula:
 *     (amountPaise * percentageBps + 5000n) / 10000n
 *
 * PostgreSQL BigInt range:
 *   -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 (-2^63 to 2^63 - 1).
 */

export const SUPPORTED_CURRENCY = 'INR' as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCY;

export const BPS_DIVISOR = 10000n;
export const HALF_BPS = 5000n;

export const PG_BIGINT_MIN = -9223372036854775808n;
export const PG_BIGINT_MAX = 9223372036854775807n;

export function isPgBigInt(val: bigint): boolean {
  return val >= PG_BIGINT_MIN && val <= PG_BIGINT_MAX;
}

export function isNonNegativePgBigInt(val: bigint): boolean {
  return val >= 0n && val <= PG_BIGINT_MAX;
}

/**
 * Conservative upper bound for floating-point rupee values.
 * While Number.MAX_SAFE_INTEGER is 9,007,199,254,740,991, IEEE-754 double precision
 * numbers with 2 decimal places lose adjacent-paisa resolution around ~35-70 trillion
 * (e.g. Number("90071992547409.90") === Number("90071992547409.91") evaluates to true!).
 *
 * To guarantee strict single-paisa distinction and ample margin against representation noise,
 * legacy float numbers are restricted to a conservative limit of ₹1,000,000,000.00
 * (₹1 Billion INR / 100 Crores). At 10^9, ULP is ~2.38e-7 rupees (0.00002 paise),
 * which is orders of magnitude smaller than 0.01 paise.
 *
 * For any larger amounts, decimal strings (e.g. "1500000000.50") or bigint paise MUST be used.
 */
export const MAX_SAFE_FLOAT_RUPEES = 1000000000;

/**
 * Strict inspection and conversion of floating-point rupee numbers into bigint paise.
 * Rejects non-finite, unsafe, or materially fractional-paisa numbers (> 2 decimal places)
 * without blind toFixed(2) clamping.
 */
export function strictFloatRupeesToPaise(value: number): {
  paise: bigint | null;
  exact: boolean;
  error?: string;
} {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      paise: null,
      exact: false,
      error: `Non-finite number value: ${String(value)}`,
    };
  }

  if (Math.abs(value) > MAX_SAFE_FLOAT_RUPEES) {
    return {
      paise: null,
      exact: false,
      error: `Float rupee value ${value} exceeds safe paisa precision limit (${MAX_SAFE_FLOAT_RUPEES}); use string or bigint for larger amounts`,
    };
  }

  if (!Number.isSafeInteger(value)) {
    const rawStr = value.toString();
    // Check if rawStr has more than 2 decimal places
    const dotIndex = rawStr.indexOf('.');
    if (dotIndex !== -1) {
      const decimals = rawStr.slice(dotIndex + 1);
      // Check for IEEE-754 representation noise vs material fractional paise
      // e.g. 19.999999999999996 vs 19.995 or 19.123
      const roundedTo2 = Number(value.toFixed(2));
      const drift = Math.abs(value - roundedTo2);
      if (decimals.length > 2 && drift > 1e-5) {
        return {
          paise: null,
          exact: false,
          error: `Material fractional-paisa precision detected in float value: ${value}`,
        };
      }
      return {
        paise: toPaise(roundedTo2.toFixed(2)),
        exact: true,
      };
    }
  }

  // Safe integer number of rupees
  const paise = BigInt(value) * 100n;
  if (!isPgBigInt(paise)) {
    return {
      paise: null,
      exact: false,
      error: `Value exceeds PostgreSQL 64-bit bigint range: ${value}`,
    };
  }

  return { paise, exact: true };
}

/**
 * Converts a string decimal (rupees), number (rupees), or bigint (paise) into exact bigint paise.
 * Throws an Error if decimal has more than 2 decimal places or is malformed.
 */
export function toPaise(value: string | bigint | number): bigint {
  if (typeof value === 'bigint') {
    if (!isPgBigInt(value)) {
      throw new RangeError(
        `BigInt value ${value} exceeds PostgreSQL 64-bit signed range`,
      );
    }
    return value;
  }

  if (typeof value === 'number') {
    const converted = strictFloatRupeesToPaise(value);
    if (!converted.exact || converted.paise === null) {
      throw new Error(converted.error || `Cannot convert float ${value} to paise`);
    }
    return converted.paise;
  }

  if (typeof value !== 'string') {
    throw new TypeError(`Cannot convert value of type ${typeof value} to paise`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Empty string cannot be converted to paise');
  }

  const isNegative = trimmed.startsWith('-');
  const rawNumber = isNegative ? trimmed.slice(1) : trimmed;

  // Regex validation for decimal or whole number
  if (!/^\d+(\.\d+)?$/.test(rawNumber)) {
    throw new Error(`Invalid monetary string format: "${trimmed}"`);
  }

  const parts = rawNumber.split('.');
  const wholePart = BigInt(parts[0]);

  let fracPart = 0n;
  if (parts.length > 1) {
    const fracStr = parts[1];
    if (fracStr.length === 1) {
      fracPart = BigInt(fracStr) * 10n;
    } else if (fracStr.length === 2) {
      fracPart = BigInt(fracStr);
    } else {
      throw new Error(
        `Monetary value has more than 2 decimal places: "${trimmed}"`,
      );
    }
  }

  const totalPaise = wholePart * 100n + fracPart;
  const result = isNegative ? -totalPaise : totalPaise;
  if (!isPgBigInt(result)) {
    throw new RangeError(
      `Converted paise value ${result} exceeds PostgreSQL 64-bit signed range`,
    );
  }
  return result;
}

/**
 * Formats bigint paise into exact 2-decimal string representation ("X.YY").
 */
export function fromPaise(paise: bigint): string {
  const isNegative = paise < 0n;
  const abs = isNegative ? -paise : paise;
  const whole = abs / 100n;
  const frac = abs % 100n;
  const fracStr = frac < 10n ? `0${frac}` : `${frac}`;
  const sign = isNegative ? '-' : '';
  return `${sign}${whole}.${fracStr}`;
}

/**
 * Calculates half-up percentage of amountPaise using integer basis points (0 to 10000 bps).
 * Formula: (amountPaise * percentageBps + 5000n) / 10000n
 */
export function applyPercentageHalfUp(
  amountPaise: bigint,
  percentageBps: bigint,
): bigint {
  if (percentageBps < 0n || percentageBps > BPS_DIVISOR) {
    throw new RangeError(
      `percentageBps must be between 0 and 10000, received ${percentageBps}`,
    );
  }
  if (amountPaise === 0n || percentageBps === 0n) {
    return 0n;
  }
  return (amountPaise * percentageBps + HALF_BPS) / BPS_DIVISOR;
}
