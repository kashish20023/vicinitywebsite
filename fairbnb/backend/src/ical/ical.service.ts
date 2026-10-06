import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterExternalIcalFeedDto } from './ical.dto.js';

@Injectable()
export class IcalService {
  constructor(private readonly prisma: PrismaService) {}

  async generateIcalFeed(propertyId: string): Promise<string> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] } },
          select: { id: true, checkIn: true, checkOut: true, status: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Fairbnb//Calendar Sync 1.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:Fairbnb - ${property.title.replace(/[\r\n]+/g, ' ')}`,
    ];

    for (const booking of property.bookings) {
      const dtStart = this.formatIcalDate(booking.checkIn);
      const dtEnd = this.formatIcalDate(booking.checkOut);
      const now = this.formatIcalDate(new Date());

      lines.push(
        'BEGIN:VEVENT',
        `UID:booking-${booking.id}@fairbnb.com`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        'SUMMARY:Fairbnb Reservation (Blocked)',
        `DESCRIPTION:Booking ID ${booking.id} - Status: ${booking.status}`,
        'END:VEVENT',
      );
    }

    // Add manually blocked dates
    let index = 1;
    for (const unavailDate of property.unavailableDates || []) {
      const dtStart = this.formatIcalDate(unavailDate);
      const nextDay = new Date(unavailDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const dtEnd = this.formatIcalDate(nextDay);
      const now = this.formatIcalDate(new Date());

      lines.push(
        'BEGIN:VEVENT',
        `UID:blocked-${property.id}-${index++}@fairbnb.com`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        'SUMMARY:Host Blocked Date',
        'DESCRIPTION:Manually blocked by host',
        'END:VEVENT',
      );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  async registerExternalFeed(userId: string, userRole: string, dto: RegisterExternalIcalFeedDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only property host or admin can register iCal sync');
    }

    return this.prisma.externalIcalFeed.create({
      data: {
        propertyId: dto.propertyId,
        name: dto.name,
        url: dto.url,
      },
    });
  }

  async listExternalFeeds(propertyId: string) {
    return this.prisma.externalIcalFeed.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async triggerSyncNow(userId: string, userRole: string, feedId: string) {
    const feed = await this.prisma.externalIcalFeed.findUnique({
      where: { id: feedId },
      include: { property: true },
    });

    if (!feed) {
      throw new NotFoundException('iCal feed not found');
    }

    if (feed.property.hostId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only host or admin can sync calendar');
    }

    return this.prisma.externalIcalFeed.update({
      where: { id: feedId },
      data: { lastSyncedAt: new Date() },
    });
  }

  private formatIcalDate(date: Date): string {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}
