import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { FileDisputeDto, ResolveDisputeDto } from './disputes.dto.js';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async fileDispute(userId: string, dto: FileDisputeDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { property: { select: { hostId: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestId !== userId && booking.property.hostId !== userId) {
      throw new ForbiddenException('Only the booking guest or property host can file a dispute');
    }

    return this.prisma.dispute.create({
      data: {
        bookingId: dto.bookingId,
        raisedById: userId,
        reason: dto.reason,
        evidenceUrls: dto.evidenceUrls || [],
        status: 'OPEN',
      },
      include: {
        booking: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            property: { select: { title: true } },
          },
        },
        raisedBy: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async getDisputes(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      return this.prisma.dispute.findMany({
        include: {
          booking: { include: { property: { select: { title: true, hostId: true } }, guest: { select: { name: true } } } },
          raisedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.dispute.findMany({
      where: {
        OR: [
          { raisedById: userId },
          { booking: { property: { hostId: userId } } },
          { booking: { guestId: userId } },
        ],
      },
      include: {
        booking: { include: { property: { select: { title: true } } } },
        raisedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveDispute(disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status,
        adminNotes: dto.adminNotes !== undefined ? dto.adminNotes : dispute.adminNotes,
        payoutAdjustment: dto.payoutAdjustment !== undefined ? dto.payoutAdjustment : dispute.payoutAdjustment,
      },
      include: {
        booking: true,
        raisedBy: { select: { id: true, name: true } },
      },
    });
  }
}
