import { BadRequestException } from '@nestjs/common';
import {
  CouponRule,
  CouponRuleContext,
  CouponData,
} from './coupon-rule.interface.js';

export class MinOrderAmountRule implements CouponRule {
  check(coupon: CouponData, context: CouponRuleContext): void {
    if (
      coupon.minOrderAmount != null &&
      context.orderAmount < coupon.minOrderAmount
    ) {
      throw new BadRequestException(
        `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      );
    }
  }
}
