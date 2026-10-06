import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, PassStatus } from '@prisma/client';

@Injectable()
export class DigitalPassService {
  constructor(private prisma: PrismaService) {}

  async getPassByBooking(bookingId: string, userId: string) {
    const pass = await this.prisma.digitalPass.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            workspace: true,
            unit: true,
          },
        },
      },
    });

    if (!pass) {
      throw new NotFoundException('Digital pass not generated for this booking');
    }
    if (pass.userId !== userId) {
      throw new ForbiddenException('Access denied to this digital pass');
    }

    return pass;
  }

  async checkIn(dto: { qrToken: string; scannerAdminId?: string; terminalId?: string }) {
    const pass = await this.prisma.digitalPass.findUnique({
      where: { qrToken: dto.qrToken },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            workspace: { select: { id: true, name: true } },
            unit: true,
          },
        },
      },
    });

    if (!pass) {
      throw new NotFoundException('Invalid digital pass QR token');
    }
    if (pass.status !== PassStatus.ACTIVE) {
      throw new BadRequestException(`Pass is inactive (${pass.status})`);
    }

    const now = new Date();
    if (now < pass.validFrom) {
      throw new BadRequestException(`Access not yet open. Pass becomes active at ${pass.validFrom.toISOString()}`);
    }
    if (now > pass.validUntil) {
      await this.prisma.digitalPass.update({
        where: { id: pass.id },
        data: { status: PassStatus.EXPIRED },
      });
      throw new BadRequestException('Pass has expired');
    }

    // Check if currently checked in
    const activeSession = await this.prisma.accessSession.findFirst({
      where: { passId: pass.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (activeSession) {
      return {
        success: true,
        alreadyCheckedIn: true,
        message: 'User is already checked in',
        session: activeSession,
        user: pass.booking.user,
        unit: pass.booking.unit,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.accessSession.create({
        data: {
          passId: pass.id,
          userId: pass.userId,
          checkInAt: now,
          terminalId: dto.terminalId || 'RECEPTION_GATE_01',
          operatorName: dto.scannerAdminId || 'Reception Scanner',
        },
      });

      if (pass.booking.status === BookingStatus.CONFIRMED) {
        await tx.booking.update({
          where: { id: pass.bookingId },
          data: { status: BookingStatus.ACTIVE },
        });
      }

      return {
        success: true,
        message: 'Check-in successful. Welcome to Studio I!',
        session,
        user: pass.booking.user,
        unit: pass.booking.unit,
      };
    });
  }

  async checkOut(dto: { qrToken: string }) {
    const pass = await this.prisma.digitalPass.findUnique({
      where: { qrToken: dto.qrToken },
    });
    if (!pass) {
      throw new NotFoundException('Invalid digital pass');
    }

    const activeSession = await this.prisma.accessSession.findFirst({
      where: { passId: pass.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });

    if (!activeSession) {
      return { message: 'No active check-in session found to close' };
    }

    const updated = await this.prisma.accessSession.update({
      where: { id: activeSession.id },
      data: { checkOutAt: new Date() },
    });

    return {
      success: true,
      message: 'Check-out successful. Have a productive day!',
      session: updated,
    };
  }
}
