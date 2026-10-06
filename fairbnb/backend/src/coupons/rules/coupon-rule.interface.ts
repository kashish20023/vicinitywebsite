export interface CouponRuleContext {
  orderAmount: number;
}

export interface CouponData {
  isActive?: boolean;
  validUntil?: Date;
  timesUsed?: number;
  usageLimit?: number;
  minOrderAmount?: number | null;
  discountType?: string;
  discountValue?: number;
  maxDiscountAmount?: number | null;
}

export interface CouponRule {
  check(coupon: CouponData, context: CouponRuleContext): void; // throws on failure
}
