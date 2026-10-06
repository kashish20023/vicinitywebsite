import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Database-enforced atomic availability check and hold creation.
   * Uses PostgreSQL row locking (SELECT ... FOR UPDATE) to ensure
   * serialized isolation across concurrent requests and processes.
   */
  async acquireUnitHold(dto: {
    userId: string;
    unitId: string;
    startDateTime: Date;
    endDateTime: Date;
    ttlMinutes?: number;
  }) {
    const ttlMinutes = dto.ttlMinutes || 10;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    if (dto.startDateTime >= dto.endDateTime) {
      throw new BadRequestException('Start time must be strictly before end time');
    }
    if (dto.startDateTime < new Date(Date.now() - 5 * 60 * 1000)) {
      throw new BadRequestException('Cannot book a time slot in the past');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Anti-hoarding check: max 5 active holds per user
      const userActiveHolds = await tx.inventoryHold.count({
        where: {
          userId: dto.userId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
      });
      if (userActiveHolds >= 5) {
        throw new BadRequestException('Hold limit reached: Maximum 5 concurrent active holds allowed per user');
      }

      // 2. Lock the target unit row for update
      const unitRows: any[] = await tx.$queryRawUnsafe(
        'SELECT id, "status" FROM "Unit" WHERE id = $1 FOR UPDATE',
        dto.unitId,
      );
      if (!unitRows || unitRows.length === 0) {
        throw new ConflictException('Unit not found');
      }
      const unit = unitRows[0];
      if (unit.status !== 'ACTIVE') {
        throw new ConflictException(`Unit is currently unavailable (${unit.status})`);
      }

      // 3. Check overlapping confirmed bookings on this exact unit
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          unitId: dto.unitId,
          status: { in: ['CONFIRMED', 'ACTIVE'] },
          startDateTime: { lt: dto.endDateTime },
          endDateTime: { gt: dto.startDateTime },
        },
      });
      if (conflictingBooking) {
        throw new ConflictException('Unit is already booked for the selected schedule interval');
      }

      // 4. Check active, non-expired inventory holds on this exact unit
      const conflictingHold = await tx.inventoryHold.findFirst({
        where: {
          unitId: dto.unitId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
          startDateTime: { lt: dto.endDateTime },
          endDateTime: { gt: dto.startDateTime },
          userId: { not: dto.userId }, // Allow same user to renew their hold
        },
      });
      if (conflictingHold) {
        throw new ConflictException('Unit is temporarily held by another customer at checkout. Try again in a few minutes.');
      }

      // 5. Release any previous hold for this user on this unit
      await tx.inventoryHold.updateMany({
        where: {
          userId: dto.userId,
          unitId: dto.unitId,
          status: 'ACTIVE',
        },
        data: { status: 'RELEASED' },
      });

      // 6. Create the authoritative hold record
      const hold = await tx.inventoryHold.create({
        data: {
          userId: dto.userId,
          unitId: dto.unitId,
          startDateTime: dto.startDateTime,
          endDateTime: dto.endDateTime,
          expiresAt,
          status: 'ACTIVE',
        },
      });

      return {
        holdId: hold.id,
        unitId: hold.unitId,
        expiresAt: hold.expiresAt,
        ttlSeconds: ttlMinutes * 60,
      };
    });
  }
}
