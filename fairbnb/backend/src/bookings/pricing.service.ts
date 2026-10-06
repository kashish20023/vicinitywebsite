import { Injectable, BadRequestException } from '@nestjs/common';

export interface PricingInput {
  basePrice: number;
  checkIn: Date | string;
  checkOut: Date | string;
  cleaningFee?: number;
  serviceFeeRate?: number;
  taxRate?: number;
  discountAmount?: number;
}

export interface PricingBreakdown {
  nights: number;
  basePricePerNight: number;
  baseAmount: number;
  cleaningFee: number;
  serviceFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

@Injectable()
export class PricingService {
  calculatePricing(input: PricingInput): PricingBreakdown {
    const start = new Date(input.checkIn);
    const end = new Date(input.checkOut);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(
        'Invalid date format for checkIn or checkOut',
      );
    }

    const diffTime = end.getTime() - start.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new BadRequestException(
        'checkOut date must be strictly after checkIn date',
      );
    }

    const basePricePerNight = input.basePrice;
    const baseAmount = Number((basePricePerNight * nights).toFixed(2));

    const cleaningFee = Number((input.cleaningFee || 0).toFixed(2));
    const serviceFeeRate = input.serviceFeeRate ?? 0.1; // 10% default platform service fee
    const taxRate = input.taxRate ?? 0.18; // 18% GST tax rate

    const serviceFee = Number((baseAmount * serviceFeeRate).toFixed(2));
    const taxableSubtotal = baseAmount + cleaningFee + serviceFee;
    const taxAmount = Number((taxableSubtotal * taxRate).toFixed(2));

    const discountAmount = Number((input.discountAmount ?? 0).toFixed(2));
    const rawTotal =
      baseAmount + cleaningFee + serviceFee + taxAmount - discountAmount;
    const totalAmount = Number(Math.max(0, rawTotal).toFixed(2));

    return {
      nights,
      basePricePerNight,
      baseAmount,
      cleaningFee,
      serviceFee,
      taxAmount,
      discountAmount,
      totalAmount,
      currency: 'INR',
    };
  }
}
