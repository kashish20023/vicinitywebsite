import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async calculateQuote(dto: {
    unitId: string;
    planId: string;
    startDateTime?: Date;
    endDateTime?: Date;
    holdId?: string;
    couponCode?: string;
    addOnIds?: string[];
    userId?: string;
  }) {
    let start = dto.startDateTime;
    let end = dto.endDateTime;

    if ((!start || isNaN(start.getTime())) && dto.holdId) {
      const hold = await this.prisma.inventoryHold.findUnique({
        where: { id: dto.holdId },
      });
      if (hold) {
        start = hold.startDateTime;
        end = hold.endDateTime;
      }
    }

    if (!start || isNaN(start.getTime())) {
      start = new Date();
      start.setHours(9, 0, 0, 0);
    }
    if (!end || isNaN(end.getTime()) || end <= start) {
      end = new Date(start.getTime() + 8 * 3600000);
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
      include: { floor: { include: { building: { include: { workspace: true } } } } },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const plan = await this.prisma.bookingPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.isActive) {
      throw new NotFoundException('Active booking plan not found');
    }

    // 1. Calculate duration and slot units
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationDays = durationHours / 24;

    let multiplier = 1;
    if (plan.planType === 'HOURLY') {
      multiplier = Math.max(plan.minDurationSlots, Math.ceil(durationHours));
    } else if (plan.planType === 'DAILY') {
      multiplier = Math.max(plan.minDurationSlots, Math.ceil(durationDays));
    } else if (plan.planType === 'WEEKLY') {
      multiplier = Math.max(plan.minDurationSlots, Math.ceil(durationDays / 7));
    } else if (plan.planType === 'MONTHLY') {
      const approxMonths = Math.max(1, Math.ceil(durationDays / 30));
      // Enforce 2-month commitment for dedicated desk / private cabin monthly plans
      if (
        (unit.unitType === 'DEDICATED_DESK' || unit.unitType === 'PRIVATE_CABIN') &&
        approxMonths < 2
      ) {
        throw new BadRequestException(
          'Minimum commitment of 2 calendar months is required for dedicated desks and private cabins',
        );
      }
      multiplier = Math.max(plan.minCommitmentMonths || 1, approxMonths);
    }

    const baseAmountPaise = BigInt(plan.ratePaise) * BigInt(multiplier);
    const subtotalBeforeDiscount = baseAmountPaise;

    // 2. Coupon evaluation
    let discountAmountPaise = 0n;
    let appliedCoupon: any = null;

    if (dto.couponCode) {
      const code = dto.couponCode.trim().toUpperCase();
      const coupon = await this.prisma.coupon.findUnique({
        where: { code },
      });

      if (!coupon || !coupon.isActive) {
        throw new BadRequestException('Invalid or inactive coupon code');
      }

      const now = new Date();
      if (coupon.expiresAt && now > coupon.expiresAt) {
        throw new BadRequestException('Coupon code has expired');
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new BadRequestException('Coupon usage limit reached');
      }

      if (coupon.minOrderPaise && subtotalBeforeDiscount < BigInt(coupon.minOrderPaise)) {
        throw new BadRequestException(
          `Minimum order value for coupon ${code} is ₹${Number(coupon.minOrderPaise) / 100}`,
        );
      }

      const calculatedDiscount =
        (Number(subtotalBeforeDiscount) * coupon.discountPercent) / 100;
      let discountPaise = BigInt(Math.round(calculatedDiscount));
      if (coupon.maxDiscountPaise && discountPaise > BigInt(coupon.maxDiscountPaise)) {
        discountPaise = BigInt(coupon.maxDiscountPaise);
      }
      discountAmountPaise = discountPaise;

      if (discountAmountPaise > subtotalBeforeDiscount) {
        discountAmountPaise = subtotalBeforeDiscount;
      }

      appliedCoupon = {
        id: coupon.id,
        code: coupon.code,
        discountPaise: discountAmountPaise.toString(),
      };
    }

    const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmountPaise;

    // 3. Tax calculation (18% GST: 9% CGST + 9% SGST)
    const taxPaise = BigInt(Math.round(Number(subtotalAfterDiscount) * 0.18));

    // 4. Security Deposit (for Monthly commitments: 1 month rent deposit)
    let securityDepositPaise = 0n;
    if (plan.planType === 'MONTHLY' && (unit.unitType === 'DEDICATED_DESK' || unit.unitType === 'PRIVATE_CABIN')) {
      securityDepositPaise = BigInt(plan.ratePaise); // 1 month deposit
    }

    const totalPayablePaise = subtotalAfterDiscount + taxPaise + securityDepositPaise;

    return {
      unit: {
        id: unit.id,
        unitCode: unit.unitCode,
        unitType: unit.unitType,
        workspaceName: unit.floor.building.workspace.name,
        city: unit.floor.building.workspace.city,
      },
      plan: {
        id: plan.id,
        title: plan.title,
        planType: plan.planType,
        multiplier,
      },
      schedule: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      pricing: {
        baseRatePaise: baseAmountPaise.toString(),
        discountPaise: discountAmountPaise.toString(),
        subtotalPaise: subtotalAfterDiscount.toString(),
        taxPaise: taxPaise.toString(),
        securityDepositPaise: securityDepositPaise.toString(),
        totalPayablePaise: totalPayablePaise.toString(),
        currency: 'INR',
      },
      appliedCoupon,
    };
  }
}
