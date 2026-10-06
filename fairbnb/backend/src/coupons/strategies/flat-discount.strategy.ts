import { DiscountStrategy } from './discount-strategy.interface.js';
import { CouponData } from '../rules/coupon-rule.interface.js';

export class FlatDiscountStrategy implements DiscountStrategy {
  calculate(coupon: CouponData, orderAmount: number): number {
    return Math.min(coupon.discountValue ?? 0, orderAmount);
  }
}
