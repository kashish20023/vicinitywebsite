import { CouponData } from '../rules/coupon-rule.interface.js';

export interface DiscountStrategy {
  calculate(coupon: CouponData, orderAmount: number): number;
}
