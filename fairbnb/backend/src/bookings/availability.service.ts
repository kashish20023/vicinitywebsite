import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AvailabilityResult {
  available: boolean;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  reason?: string;
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAvailability(
    propertyId: string,
    checkInStr: string,
    checkOutStr: string,
    guests: number = 1,
    txPrisma?: any,
  ): Promise<AvailabilityResult> {
    const client = txPrisma || this.prisma;

    const property = await client.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found`);
    }

    if (property.verificationStatus !== 'APPROVED' || property.status !== 'PUBLISHED') {
      return {
        available: false,
        propertyId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights: 0,
        reason: 'PROPERTY_NOT_AVAILABLE',
      };
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);
    const now = new Date();
    // Normalize to beginning of today's date for checkIn validation
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new BadRequestException('Invalid checkIn or checkOut date format');
    }

    if (checkIn < today) {
      return {
        available: false,
        propertyId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights: 0,
        reason: 'CHECKIN_DATE_IN_PAST',
      };
    }

    if (checkOut <= checkIn) {
      return {
        available: false,
        propertyId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights: 0,
        reason: 'CHECKOUT_MUST_BE_AFTER_CHECKIN',
      };
    }

    const diffTime = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (guests > property.maxGuests) {
      return {
        available: false,
        propertyId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights,
        reason: `GUEST_LIMIT_EXCEEDED (Max ${property.maxGuests} guests allowed)`,
      };
    }

    if (nights < property.minNights) {
      return {
        available: false,
        propertyId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights,
        reason: `MINIMUM_NIGHTS_NOT_MET (Minimum ${property.minNights} night stay required)`,
      };
    }

    // 1. Check host blocked dates
    if (property.unavailableDates && property.unavailableDates.length > 0) {
      const isBlocked = property.unavailableDates.some((blockedDate: Date) => {
        const bd = new Date(blockedDate);
        return bd >= checkIn && bd < checkOut;
      });

      if (isBlocked) {
        return {
          available: false,
          propertyId,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          nights,
          reason: 'HOST_BLOCKED_DATES',
        };
      }
    }

    // 2. Check overlapping active bookings
    // Standard overlap formula: checkIn < existingCheckOut AND checkOut > existingCheckIn
    const overlappingBookings = await client.booking.findMany({
      where: {
        propertyId,
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
        OR: [
          { status: 'CONFIRMED' },
          { status: 'CHECKED_IN' },
          { status: 'COMPLETED' },
          {
            status: 'PENDING',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return {
        available: false,
        propertyId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights,
        reason: 'PROPERTY_ALREADY_BOOKED',
      };
    }

    return {
      available: true,
      propertyId,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      nights,
    };
  }
}
