import { BadRequestException } from '@nestjs/common';
import {
  CouponRule,
  CouponData,
  CouponRuleContext,
} from './coupon-rule.interface.js';

export class UsageLimitRule implements CouponRule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  check(coupon: CouponData, _context?: CouponRuleContext): void {
    if ((coupon.timesUsed ?? 0) >= (coupon.usageLimit ?? 0)) {
      throw new BadRequestException('Coupon code usage limit exceeded');
    }
  }
}
