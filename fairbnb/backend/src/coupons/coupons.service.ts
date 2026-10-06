import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCouponDto, ValidateCouponDto } from './coupons.dto.js';
import {
  runCouponRules,
  FULL_VALIDATION_CHAIN,
  REDEMPTION_CHAIN,
} from './rules/index.js';
import { DISCOUNT_STRATEGIES } from './strategies/index.js';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount || 0,
        maxDiscountAmount: dto.maxDiscountAmount || null,
        validUntil: new Date(dto.validUntil),
        usageLimit: dto.usageLimit || 100,
      },
    });
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid or expired coupon code');
    }

    runCouponRules(
      coupon,
      { orderAmount: dto.orderAmount },
      FULL_VALIDATION_CHAIN,
    );

    const strategy = DISCOUNT_STRATEGIES[coupon.discountType];
    if (!strategy) {
      throw new BadRequestException(
        `Unsupported discount type: ${coupon.discountType}`,
      );
    }

    const discountAmount = strategy.calculate(coupon, dto.orderAmount);
    const finalAmount = Math.max(0, dto.orderAmount - discountAmount);

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    };
  }

  async redeemCoupon(tx: Prisma.TransactionClient, code: string) {
    const uppercaseCode = code.trim().toUpperCase();
    const coupon = await tx.coupon.findUnique({
      where: { code: uppercaseCode },
    });

    if (!coupon) {
      throw new BadRequestException('Coupon code is invalid or inactive');
    }

    runCouponRules(coupon, { orderAmount: Infinity }, REDEMPTION_CHAIN);

    const result = await tx.coupon.updateMany({
      where: {
        code: uppercaseCode,
        timesUsed: { lt: coupon.usageLimit },
      },
      data: { timesUsed: { increment: 1 } },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'Coupon usage limit reached — this coupon just reached its usage limit, please retry without it or with a different code.',
      );
    }

    return result;
  }

  async releaseCoupon(tx: Prisma.TransactionClient, code: string, amount = 1) {
    if (!code) return;
    await tx.coupon.updateMany({
      where: {
        code: code.trim().toUpperCase(),
        timesUsed: { gte: amount },
      },
      data: { timesUsed: { decrement: amount } },
    });
  }

  async listCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
