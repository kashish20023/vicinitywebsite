import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ActiveRule,
  ExpiryRule,
  UsageLimitRule,
  MinOrderAmountRule,
  CouponRule,
  CouponRuleContext,
  runCouponRules,
  FULL_VALIDATION_CHAIN,
  REDEMPTION_CHAIN,
} from './index.js';

describe('Coupon Validation Rules (Chain-of-Responsibility)', () => {
  describe('ActiveRule', () => {
    const rule = new ActiveRule();
    const context: CouponRuleContext = { orderAmount: 1000 };

    it('should pass when coupon is active', () => {
      expect(() => rule.check({ isActive: true }, context)).not.toThrow();
    });

    it('should throw NotFoundException when coupon is inactive', () => {
      expect(() => rule.check({ isActive: false }, context)).toThrow(
        NotFoundException,
      );
      expect(() => rule.check({ isActive: false }, context)).toThrow(
        'Invalid or expired coupon code',
      );
    });
  });

  describe('ExpiryRule', () => {
    const rule = new ExpiryRule();
    const context: CouponRuleContext = { orderAmount: 1000 };

    it('should pass when coupon validUntil is in the future', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60);
      expect(() => rule.check({ validUntil: future }, context)).not.toThrow();
    });

    it('should throw BadRequestException when coupon validUntil is in the past', () => {
      const past = new Date(Date.now() - 1000 * 60 * 60);
      expect(() => rule.check({ validUntil: past }, context)).toThrow(
        BadRequestException,
      );
      expect(() => rule.check({ validUntil: past }, context)).toThrow(
        'Coupon code has expired',
      );
    });
  });

  describe('UsageLimitRule', () => {
    const rule = new UsageLimitRule();
    const context: CouponRuleContext = { orderAmount: 1000 };

    it('should pass when timesUsed is less than usageLimit', () => {
      expect(() =>
        rule.check({ timesUsed: 4, usageLimit: 5 }, context),
      ).not.toThrow();
    });

    it('should throw BadRequestException when timesUsed equals usageLimit', () => {
      expect(() =>
        rule.check({ timesUsed: 5, usageLimit: 5 }, context),
      ).toThrow(BadRequestException);
      expect(() =>
        rule.check({ timesUsed: 5, usageLimit: 5 }, context),
      ).toThrow('Coupon code usage limit exceeded');
    });

    it('should throw BadRequestException when timesUsed exceeds usageLimit', () => {
      expect(() =>
        rule.check({ timesUsed: 6, usageLimit: 5 }, context),
      ).toThrow(BadRequestException);
    });
  });

  describe('MinOrderAmountRule', () => {
    const rule = new MinOrderAmountRule();

    it('should pass when orderAmount is greater than or equal to minOrderAmount', () => {
      expect(() =>
        rule.check({ minOrderAmount: 500 }, { orderAmount: 500 }),
      ).not.toThrow();
      expect(() =>
        rule.check({ minOrderAmount: 500 }, { orderAmount: 1000 }),
      ).not.toThrow();
    });

    it('should throw BadRequestException when orderAmount is less than minOrderAmount', () => {
      expect(() =>
        rule.check({ minOrderAmount: 500 }, { orderAmount: 499 }),
      ).toThrow(BadRequestException);
      expect(() =>
        rule.check({ minOrderAmount: 500 }, { orderAmount: 499 }),
      ).toThrow('Minimum order amount of ₹500 required for this coupon');
    });
  });

  describe('runCouponRules & Chain Execution', () => {
    const validCoupon = {
      isActive: true,
      validUntil: new Date(Date.now() + 1000 * 60 * 60),
      timesUsed: 1,
      usageLimit: 5,
      minOrderAmount: 500,
    };

    it('should run FULL_VALIDATION_CHAIN successfully on valid coupon', () => {
      expect(() =>
        runCouponRules(
          validCoupon,
          { orderAmount: 1000 },
          FULL_VALIDATION_CHAIN,
        ),
      ).not.toThrow();
    });

    it('should run REDEMPTION_CHAIN successfully on valid coupon', () => {
      expect(() =>
        runCouponRules(
          validCoupon,
          { orderAmount: Infinity },
          REDEMPTION_CHAIN,
        ),
      ).not.toThrow();
    });

    it('should demonstrate extensibility with custom AlwaysFailRule without modifying CouponsService', () => {
      class AlwaysFailRule implements CouponRule {
        check(): void {
          throw new BadRequestException(
            'Custom validation rule failed: promo restriction',
          );
        }
      }

      const customChain: CouponRule[] = [
        new ActiveRule(),
        new AlwaysFailRule(),
      ];

      expect(() =>
        runCouponRules(validCoupon, { orderAmount: 1000 }, customChain),
      ).toThrow(BadRequestException);
      expect(() =>
        runCouponRules(validCoupon, { orderAmount: 1000 }, customChain),
      ).toThrow('Custom validation rule failed: promo restriction');
    });
  });
});
