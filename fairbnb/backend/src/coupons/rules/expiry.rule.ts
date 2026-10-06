import { BadRequestException } from '@nestjs/common';
import {
  CouponRule,
  CouponData,
  CouponRuleContext,
} from './coupon-rule.interface.js';

export class ExpiryRule implements CouponRule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  check(coupon: CouponData, _context?: CouponRuleContext): void {
    const now = new Date();
    if (coupon.validUntil && coupon.validUntil < now) {
      throw new BadRequestException('Coupon code has expired');
    }
  }
}
