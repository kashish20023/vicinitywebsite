import { DiscountStrategy } from './discount-strategy.interface.js';
import { CouponData } from '../rules/coupon-rule.interface.js';

export class PercentageDiscountStrategy implements DiscountStrategy {
  calculate(coupon: CouponData, orderAmount: number): number {
    const discountValue = coupon.discountValue ?? 0;
    let amount = (orderAmount * discountValue) / 100;
    if (coupon.maxDiscountAmount != null && amount > coupon.maxDiscountAmount) {
      amount = coupon.maxDiscountAmount;
    }
    return amount;
  }
}
