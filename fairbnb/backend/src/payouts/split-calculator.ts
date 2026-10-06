/**
 * Pure deterministic payout split calculator for FairBnB (Chunk 1).
 *
 * Enforces:
 * - Exact bigint paise arithmetic
 * - Invariant: host + coHost + platform + tax = guestTotal - sum(completedRefundAmounts)
 * - Validation of all inputs, refund integrity, and co-host agreements
 * - Zero mutation of inputs
 */

import {
  fromPaise,
  applyPercentageHalfUp,
  SUPPORTED_CURRENCY,
  BPS_DIVISOR,
} from './money.js';
import {
  SplitCalculationInput,
  SplitCalculationResult,
  CalculatedSplit,
  HeldSplit,
  DiagnosticDetail,
  HeldReasonCode,
} from './split-calculator.types.js';

export function calculateSplit(
  input: SplitCalculationInput,
): SplitCalculationResult {
  const diagnostics: DiagnosticDetail[] = [];
  const reasonCodes: HeldReasonCode[] = [];

  function addDiagnostic(
    code: HeldReasonCode,
    message: string,
    details?: Record<string, string | number | bigint | boolean | null | undefined>,
  ) {
    if (!reasonCodes.includes(code)) {
      reasonCodes.push(code);
    }
    diagnostics.push({ code, message, details });
  }

  // 1. Currency validation
  if (input.currency !== SUPPORTED_CURRENCY) {
    addDiagnostic(
      'INVALID_CURRENCY',
      `Currency "${input.currency}" is not supported. Supported currency is "${SUPPORTED_CURRENCY}".`,
      { currency: input.currency },
    );
  }

  // 2. Non-negative validation on booking amounts
  if (input.basePaise < 0n) {
    addDiagnostic('NEGATIVE_AMOUNT', 'basePaise cannot be negative', {
      basePaise: input.basePaise,
    });
  }
  if (input.cleaningPaise < 0n) {
    addDiagnostic('NEGATIVE_AMOUNT', 'cleaningPaise cannot be negative', {
      cleaningPaise: input.cleaningPaise,
    });
  }
  if (input.serviceFeePaise < 0n) {
    addDiagnostic('NEGATIVE_AMOUNT', 'serviceFeePaise cannot be negative', {
      serviceFeePaise: input.serviceFeePaise,
    });
  }
  if (input.taxPaise < 0n) {
    addDiagnostic('NEGATIVE_AMOUNT', 'taxPaise cannot be negative', {
      taxPaise: input.taxPaise,
    });
  }
  if (input.discountPaise < 0n) {
    addDiagnostic('NEGATIVE_AMOUNT', 'discountPaise cannot be negative', {
      discountPaise: input.discountPaise,
    });
  }
  if (input.guestTotalPaise < 0n) {
    addDiagnostic('NEGATIVE_AMOUNT', 'guestTotalPaise cannot be negative', {
      guestTotalPaise: input.guestTotalPaise,
    });
  }

  // 3. Exact quoted-total reconciliation
  // guestTotal = base + cleaning + serviceFee + tax - discount
  const expectedGuestTotal =
    input.basePaise +
    input.cleaningPaise +
    input.serviceFeePaise +
    input.taxPaise -
    input.discountPaise;

  if (input.guestTotalPaise !== expectedGuestTotal) {
    addDiagnostic(
      'TOTAL_MISMATCH',
      `Quoted guest total (${input.guestTotalPaise} paise) does not match components sum (${expectedGuestTotal} paise).`,
      {
        expectedGuestTotal,
        actualGuestTotal: input.guestTotalPaise,
        discrepancy: input.guestTotalPaise - expectedGuestTotal,
      },
    );
  }

  // 4. Discount funding resolution
  let hostDiscountPaise = 0n;
  let platformDiscountPaise = 0n;

  if (input.discountPaise > 0n) {
    if (input.discountFunding === 'UNRESOLVED') {
      addDiagnostic(
        'UNRESOLVED_DISCOUNT_FUNDING',
        `Discount of ${input.discountPaise} paise exists but discount funding is UNRESOLVED.`,
      );
    } else if (input.discountFunding === 'NONE') {
      addDiagnostic(
        'INVALID_DISCOUNT_FUNDING',
        `Discount of ${input.discountPaise} paise exists but discount funding is set to NONE.`,
      );
    } else if (input.discountFunding === 'PLATFORM') {
      platformDiscountPaise = input.discountPaise;
      if (platformDiscountPaise > input.serviceFeePaise) {
        const shortfall = platformDiscountPaise - input.serviceFeePaise;
        addDiagnostic(
          'FUNDING_GAP',
          `Platform-funded discount (${platformDiscountPaise} paise) exceeds service fee (${input.serviceFeePaise} paise) by ${shortfall} paise.`,
          {
            fundedBy: 'PLATFORM',
            discountPaise: platformDiscountPaise,
            availablePaise: input.serviceFeePaise,
            shortfallPaise: shortfall,
          },
        );
      }
    } else if (input.discountFunding === 'HOST') {
      hostDiscountPaise = input.discountPaise;
      if (hostDiscountPaise > input.basePaise) {
        const shortfall = hostDiscountPaise - input.basePaise;
        addDiagnostic(
          'FUNDING_GAP',
          `Host-funded discount (${hostDiscountPaise} paise) exceeds base accommodation (${input.basePaise} paise) by ${shortfall} paise.`,
          {
            fundedBy: 'HOST',
            discountPaise: hostDiscountPaise,
            availablePaise: input.basePaise,
            shortfallPaise: shortfall,
          },
        );
      }
    } else {
      addDiagnostic(
        'INVALID_DISCOUNT_FUNDING',
        `Unrecognized discount funding policy: "${input.discountFunding}"`,
      );
    }
  }

  // 5. Refunds validation
  const seenRefundIds = new Set<string>();
  let totalRefundedPaise = 0n;
  let accommodationRefundPaise = 0n;
  let cleaningRefundPaise = 0n;
  let platformRefundPaise = 0n;
  let taxRefundPaise = 0n;

  for (const refund of input.completedRefunds) {
    if (seenRefundIds.has(refund.id)) {
      addDiagnostic(
        'DUPLICATE_REFUND_ID',
        `Duplicate refund id "${refund.id}" found in completedRefunds.`,
        { refundId: refund.id },
      );
    }
    seenRefundIds.add(refund.id);

    if (
      refund.amountPaise < 0n ||
      refund.accommodationPaise < 0n ||
      refund.cleaningPaise < 0n ||
      refund.platformPaise < 0n ||
      refund.taxPaise < 0n
    ) {
      addDiagnostic(
        'NEGATIVE_AMOUNT',
        `Refund "${refund.id}" contains negative component amounts.`,
        { refundId: refund.id },
      );
    }

    const componentSum =
      refund.accommodationPaise +
      refund.cleaningPaise +
      refund.platformPaise +
      refund.taxPaise;

    if (refund.amountPaise !== componentSum) {
      addDiagnostic(
        'REFUND_TOTAL_MISMATCH',
        `Refund "${refund.id}" total (${refund.amountPaise} paise) does not match sum of its components (${componentSum} paise).`,
        {
          refundId: refund.id,
          statedAmount: refund.amountPaise,
          calculatedComponentsSum: componentSum,
        },
      );
    }

    totalRefundedPaise += refund.amountPaise;
    accommodationRefundPaise += refund.accommodationPaise;
    cleaningRefundPaise += refund.cleaningPaise;
    platformRefundPaise += refund.platformPaise;
    taxRefundPaise += refund.taxPaise;
  }

  // Component capacity checks for refunds
  const maxAccommodationRefundable = input.basePaise - hostDiscountPaise;
  if (accommodationRefundPaise > maxAccommodationRefundable) {
    addDiagnostic(
      'REFUND_EXCEEDS_COMPONENT',
      `Cumulative accommodation refunds (${accommodationRefundPaise} paise) exceed funded accommodation (${maxAccommodationRefundable} paise).`,
      {
        component: 'ACCOMMODATION',
        refundedPaise: accommodationRefundPaise,
        availablePaise: maxAccommodationRefundable,
      },
    );
  }

  const maxCleaningRefundable = input.cleaningPaise;
  if (cleaningRefundPaise > maxCleaningRefundable) {
    addDiagnostic(
      'REFUND_EXCEEDS_COMPONENT',
      `Cumulative cleaning refunds (${cleaningRefundPaise} paise) exceed cleaning fee (${maxCleaningRefundable} paise).`,
      {
        component: 'CLEANING',
        refundedPaise: cleaningRefundPaise,
        availablePaise: maxCleaningRefundable,
      },
    );
  }

  const maxPlatformRefundable = input.serviceFeePaise - platformDiscountPaise;
  if (platformRefundPaise > maxPlatformRefundable) {
    addDiagnostic(
      'REFUND_EXCEEDS_COMPONENT',
      `Cumulative platform refunds (${platformRefundPaise} paise) exceed net platform fee (${maxPlatformRefundable} paise).`,
      {
        component: 'PLATFORM',
        refundedPaise: platformRefundPaise,
        availablePaise: maxPlatformRefundable,
      },
    );
  }

  const maxTaxRefundable = input.taxPaise;
  if (taxRefundPaise > maxTaxRefundable) {
    addDiagnostic(
      'REFUND_EXCEEDS_COMPONENT',
      `Cumulative tax refunds (${taxRefundPaise} paise) exceed collected tax (${maxTaxRefundable} paise).`,
      {
        component: 'TAX',
        refundedPaise: taxRefundPaise,
        availablePaise: maxTaxRefundable,
      },
    );
  }

  // 6. Net component calculations
  const netAccommodationPaise =
    input.basePaise - hostDiscountPaise - accommodationRefundPaise;
  const netCleaningPaise = input.cleaningPaise - cleaningRefundPaise;
  const netPlatformPaise =
    input.serviceFeePaise - platformDiscountPaise - platformRefundPaise;
  const netTaxPaise = input.taxPaise - taxRefundPaise;

  const hostPoolPaise = netAccommodationPaise + netCleaningPaise;

  // 7. Co-Host Agreement & Allocation
  let coHostAllocationPaise = 0n;
  const coHost = input.coHostAgreement;

  if (coHost.status === 'UNRESOLVED') {
    addDiagnostic(
      'UNRESOLVED_COHOST_AGREEMENT',
      'Co-host agreement status is UNRESOLVED.',
    );
  } else if (coHost.status === 'NONE') {
    coHostAllocationPaise = 0n;
  } else if (coHost.status === 'AGREED') {
    const ruleType = coHost.ruleType;
    if (!ruleType || ruleType === 'NONE') {
      coHostAllocationPaise = 0n;
    } else if (ruleType === 'PERCENTAGE') {
      if (
        coHost.percentageBps === undefined ||
        coHost.percentageBps < 0n ||
        coHost.percentageBps > BPS_DIVISOR
      ) {
        addDiagnostic(
          'INVALID_COHOST_RULE',
          `Co-host rule PERCENTAGE requires percentageBps between 0 and ${BPS_DIVISOR}.`,
          { percentageBps: coHost.percentageBps },
        );
      } else {
        coHostAllocationPaise = applyPercentageHalfUp(
          netAccommodationPaise,
          coHost.percentageBps,
        );
      }
    } else if (ruleType === 'FIXED_AMOUNT') {
      if (
        coHost.fixedAmountPaise === undefined ||
        coHost.fixedAmountPaise < 0n
      ) {
        addDiagnostic(
          'INVALID_COHOST_RULE',
          'Co-host rule FIXED_AMOUNT requires non-negative fixedAmountPaise.',
          { fixedAmountPaise: coHost.fixedAmountPaise },
        );
      } else {
        coHostAllocationPaise = coHost.fixedAmountPaise;
      }
    } else if (ruleType === 'CLEANING_FEE') {
      coHostAllocationPaise = netCleaningPaise;
    } else if (ruleType === 'CLEANING_FEE_PLUS_PERCENTAGE') {
      if (
        coHost.percentageBps === undefined ||
        coHost.percentageBps < 0n ||
        coHost.percentageBps > BPS_DIVISOR
      ) {
        addDiagnostic(
          'INVALID_COHOST_RULE',
          `Co-host rule CLEANING_FEE_PLUS_PERCENTAGE requires percentageBps between 0 and ${BPS_DIVISOR}.`,
          { percentageBps: coHost.percentageBps },
        );
      } else {
        const percentageShare = applyPercentageHalfUp(
          netAccommodationPaise,
          coHost.percentageBps,
        );
        coHostAllocationPaise = netCleaningPaise + percentageShare;
      }
    } else {
      addDiagnostic(
        'INVALID_COHOST_RULE',
        `Unrecognized co-host rule type: "${ruleType}".`,
      );
    }
  }

  // 8. Co-host vs Host Pool capacity check
  if (coHostAllocationPaise > hostPoolPaise) {
    addDiagnostic(
      'COHOST_EXCEEDS_POOL',
      `Co-host allocation (${coHostAllocationPaise} paise) exceeds host pool (${hostPoolPaise} paise).`,
      {
        coHostAllocationPaise,
        hostPoolPaise,
        shortfallPaise: coHostAllocationPaise - hostPoolPaise,
      },
    );
  }

  // If any diagnostic exists, return HELD
  if (diagnostics.length > 0) {
    const heldResult: HeldSplit = {
      status: 'HELD',
      bookingId: input.bookingId,
      currency: input.currency,
      reasonCodes,
      diagnostics,
    };
    return heldResult;
  }

  // 9. Host allocation & Final Reconciliation
  const hostAllocationPaise = hostPoolPaise - coHostAllocationPaise;
  const platformAllocationPaise = netPlatformPaise;
  const taxAllocationPaise = netTaxPaise;

  const sumOfAllocationsPaise =
    hostAllocationPaise +
    coHostAllocationPaise +
    platformAllocationPaise +
    taxAllocationPaise;

  const netCollectedPaise = input.guestTotalPaise - totalRefundedPaise;
  const discrepancyPaise = sumOfAllocationsPaise - netCollectedPaise;
  const isReconciled = discrepancyPaise === 0n;

  const explanation =
    `Split calculated successfully for booking ${input.bookingId}. ` +
    `Guest paid ₹${fromPaise(input.guestTotalPaise)}, refunds ₹${fromPaise(totalRefundedPaise)}, ` +
    `net collected ₹${fromPaise(netCollectedPaise)}. ` +
    `Allocations: Host ₹${fromPaise(hostAllocationPaise)}, Co-Host ₹${fromPaise(coHostAllocationPaise)}, ` +
    `Platform ₹${fromPaise(platformAllocationPaise)}, Tax ₹${fromPaise(taxAllocationPaise)}.`;

  const calculatedResult: CalculatedSplit = {
    status: 'CALCULATED',
    bookingId: input.bookingId,
    currency: 'INR',
    breakdown: {
      basePaise: input.basePaise,
      cleaningPaise: input.cleaningPaise,
      serviceFeePaise: input.serviceFeePaise,
      taxPaise: input.taxPaise,
      discountPaise: input.discountPaise,
      guestTotalPaise: input.guestTotalPaise,

      hostDiscountPaise,
      platformDiscountPaise,

      totalRefundedPaise,
      accommodationRefundPaise,
      cleaningRefundPaise,
      platformRefundPaise,
      taxRefundPaise,

      netAccommodationPaise,
      netCleaningPaise,
      netPlatformPaise,
      netTaxPaise,

      hostPoolPaise,
      coHostAllocationPaise,
      hostAllocationPaise,
      platformAllocationPaise,
      taxAllocationPaise,
    },
    formatted: {
      guestTotal: fromPaise(input.guestTotalPaise),
      totalRefunded: fromPaise(totalRefundedPaise),
      netCollected: fromPaise(netCollectedPaise),
      hostAllocation: fromPaise(hostAllocationPaise),
      coHostAllocation: fromPaise(coHostAllocationPaise),
      platformAllocation: fromPaise(platformAllocationPaise),
      taxAllocation: fromPaise(taxAllocationPaise),
    },
    reconciliation: {
      sumOfAllocationsPaise,
      netCollectedPaise,
      isReconciled,
      discrepancyPaise,
    },
    explanation,
  };

  return calculatedResult;
}
