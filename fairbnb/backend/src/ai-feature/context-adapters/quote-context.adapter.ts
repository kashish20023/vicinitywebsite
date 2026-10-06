import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AvailabilityService } from '../../bookings/availability.service.js';
import { PricingService } from '../../bookings/pricing.service.js';

export interface GroundedQuoteResultDto {
  propertyId: string;
  isAvailable: boolean;
  isCapacityEligible: boolean;
  isMinNightsEligible: boolean;
  nights: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  maxGuests: number;
  minNights: number;
  pricing: {
    nights: number;
    basePricePerNight: number;
    basePriceTotal: number;
    cleaningFee: number;
    serviceFee: number;
    tax: number;
    total: number;
    currency: string;
  };
  cancellationPolicy: string;
  quoteTimestamp: string;
}

@Injectable()
export class QuoteContextAdapter {
  private readonly logger = new Logger(QuoteContextAdapter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Pure, side-effect-free quote calculation wrapping AvailabilityService and PricingService.
   * Never initiates bookings, holds, lead generation, or audit records.
   */
  async calculateGroundedQuote(
    propertyId: string,
    checkIn: string,
    checkOut: string,
    guestCount: number,
  ): Promise<GroundedQuoteResultDto> {
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      throw new BadRequestException('Dates must be in valid YYYY-MM-DD format.');
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime()) || inDate >= outDate) {
      throw new BadRequestException('checkIn date must strictly precede checkOut date.');
    }

    const diffDays = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      throw new BadRequestException('Invalid duration: minimum 1 night required.');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        basePrice: true,
        cleaningFee: true,
        serviceFeeRate: true,
        taxRate: true,
        minNights: true,
        maxGuests: true,
        cancellationPolicy: true,
        status: true,
        verificationStatus: true,
      },
    });

    if (!property || property.status !== 'PUBLISHED' || property.verificationStatus !== 'APPROVED') {
      throw new NotFoundException(`Listing '${propertyId}' is not an active published property.`);
    }

    const isCapacityEligible = guestCount <= property.maxGuests;
    const isMinNightsEligible = diffDays >= property.minNights;

    // Check calendar availability without side effects
    let isAvailable = false;
    try {
      const availCheck = await this.availabilityService.checkAvailability(
        propertyId,
        checkIn,
        checkOut,
      );
      isAvailable = Boolean(availCheck && availCheck.available);
    } catch (err: any) {
      this.logger.warn(`Availability check failed for property ${propertyId}: ${err.message}`);
      isAvailable = false;
    }

    // Pure arithmetic breakdown using standard Fairbnb calculation
    const pricingBreakdown = this.pricingService.calculatePricing({
      basePrice: property.basePrice,
      checkIn,
      checkOut,
      cleaningFee: property.cleaningFee,
      serviceFeeRate: property.serviceFeeRate,
      taxRate: property.taxRate,
    });

    return {
      propertyId: property.id,
      isAvailable,
      isCapacityEligible,
      isMinNightsEligible,
      nights: pricingBreakdown.nights,
      checkIn,
      checkOut,
      guestCount,
      maxGuests: property.maxGuests,
      minNights: property.minNights,
      pricing: {
        nights: pricingBreakdown.nights,
        basePricePerNight: pricingBreakdown.basePricePerNight,
        basePriceTotal: pricingBreakdown.baseAmount,
        cleaningFee: pricingBreakdown.cleaningFee,
        serviceFee: pricingBreakdown.serviceFee,
        tax: pricingBreakdown.taxAmount,
        total: pricingBreakdown.totalAmount,
        currency: pricingBreakdown.currency || 'INR',
      },
      cancellationPolicy: property.cancellationPolicy,
      quoteTimestamp: new Date().toISOString(),
    };
  }
}
