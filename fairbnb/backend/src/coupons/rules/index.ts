import {
  CouponRule,
  CouponRuleContext,
  CouponData,
} from './coupon-rule.interface.js';
import { ActiveRule } from './active.rule.js';
import { ExpiryRule } from './expiry.rule.js';
import { UsageLimitRule } from './usage-limit.rule.js';
import { MinOrderAmountRule } from './min-order-amount.rule.js';

export * from './coupon-rule.interface.js';
export * from './active.rule.js';
export * from './expiry.rule.js';
export * from './usage-limit.rule.js';
export * from './min-order-amount.rule.js';

export function runCouponRules(
  coupon: CouponData,
  context: CouponRuleContext,
  rules: CouponRule[],
) {
  for (const rule of rules) {
    rule.check(coupon, context);
  }
}

export const FULL_VALIDATION_CHAIN: CouponRule[] = [
  new ActiveRule(),
  new ExpiryRule(),
  new UsageLimitRule(),
  new MinOrderAmountRule(),
];

// Used by redeemCoupon — usage-limit is enforced separately via the atomic
// updateMany, and minOrderAmount isn't relevant at redemption time
export const REDEMPTION_CHAIN: CouponRule[] = [
  new ActiveRule(),
  new ExpiryRule(),
];
