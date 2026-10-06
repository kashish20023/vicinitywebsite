import { NotFoundException } from '@nestjs/common';
import {
  CouponRule,
  CouponData,
  CouponRuleContext,
} from './coupon-rule.interface.js';

export class ActiveRule implements CouponRule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  check(coupon: CouponData, _context?: CouponRuleContext): void {
    if (!coupon.isActive) {
      throw new NotFoundException('Invalid or expired coupon code');
    }
  }
}
