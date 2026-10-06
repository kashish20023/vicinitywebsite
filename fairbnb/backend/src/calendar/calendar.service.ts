import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockDatesDto, CreateCustomPricingRuleDto } from './calendar.dto.js';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getPropertyCalendar(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        customPricingRules: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] } },
          select: { id: true, checkIn: true, checkOut: true, status: true, guestId: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return {
      propertyId: property.id,
      basePrice: property.basePrice,
      unavailableDates: property.unavailableDates,
      customPricingRules: property.customPricingRules,
      bookings: property.bookings,
    };
  }

  async blockDates(userId: string, userRole: string, dto: BlockDatesDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only property host or admin can block dates');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const datesToBlock: Date[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      datesToBlock.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    const existingDates = property.unavailableDates || [];
    const updatedDates = [...existingDates, ...datesToBlock];

    return this.prisma.property.update({
      where: { id: dto.propertyId },
      data: { unavailableDates: updatedDates },
    });
  }

  async createPricingRule(userId: string, userRole: string, dto: CreateCustomPricingRuleDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only property host or admin can set custom pricing');
    }

    return this.prisma.customPricingRule.create({
      data: {
        propertyId: dto.propertyId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        pricePerNight: dto.pricePerNight,
        note: dto.note || null,
      },
    });
  }
}
