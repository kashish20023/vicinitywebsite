import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HostsService {
  constructor(private prisma: PrismaService) {}

  async getPublicHostProfile(hostId: string) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      include: {
        hostedWorkspaces: {
          where: { isPublished: true },
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            address: true,
          },
        },
      },
    });

    if (!host || (host.role !== 'HOST' && host.role !== 'ADMIN')) {
      throw new NotFoundException('Host profile not found');
    }

    const workspaceIds = host.hostedWorkspaces.map((w: any) => w.id);
    const reviews = await this.prisma.review.aggregate({
      where: { workspaceId: { in: workspaceIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      host: {
        id: host.id,
        name: host.name,
        avatarUrl: host.avatarUrl,
        companyName: host.companyName,
        joinedAt: host.createdAt,
      },
      stats: {
        totalWorkspaces: host.hostedWorkspaces.length,
        averageRating: reviews._avg.rating ? parseFloat(reviews._avg.rating.toFixed(2)) : 5.0,
        totalReviews: reviews._count.rating,
      },
      workspaces: host.hostedWorkspaces,
    };
  }

  async getHostDashboardStats(hostId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: { hostId },
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                zones: {
                  include: {
                    units: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const workspaceIds = workspaces.map((w) => w.id);

    let totalUnits = 0;
    workspaces.forEach((w) => {
      w.buildings.forEach((b) => {
        b.floors.forEach((f) => {
          f.zones.forEach((z) => {
            totalUnits += z.units.length;
          });
        });
      });
    });

    const totalBookingsCount = await this.prisma.booking.count({
      where: { workspaceId: { in: workspaceIds } },
    });

    const confirmedBookings = await this.prisma.booking.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        status: { in: ['CONFIRMED', 'COMPLETED', 'ACTIVE'] },
      },
      select: {
        id: true,
        bookingNumber: true,
        totalAmountPaise: true,
        status: true,
        startDateTime: true,
        endDateTime: true,
        user: { select: { name: true, email: true } },
        unit: { select: { name: true, unitType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const totalEarningsPaise = confirmedBookings.reduce(
      (sum, b) => sum + BigInt(b.totalAmountPaise || 0),
      BigInt(0),
    );

    const now = new Date();
    const upcomingBookingsCount = await this.prisma.booking.count({
      where: {
        workspaceId: { in: workspaceIds },
        startDateTime: { gte: now },
        status: 'CONFIRMED',
      },
    });

    const activeBookingsCount = await this.prisma.booking.count({
      where: {
        workspaceId: { in: workspaceIds },
        status: 'ACTIVE',
      },
    });

    const cohostsCount = await this.prisma.cohostPermission.count({
      where: { workspaceId: { in: workspaceIds } },
    });

    const pendingInvitesCount = await this.prisma.cohostInvitation.count({
      where: { hostId, status: 'PENDING' },
    });

    const recentCoHosts = await this.prisma.cohostPermission.findMany({
      where: { workspaceId: { in: workspaceIds } },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        workspace: { select: { id: true, name: true, city: true } },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      workspacesCount: workspaces.length,
      totalUnits,
      totalBookingsCount,
      totalEarningsPaise: totalEarningsPaise.toString(),
      totalEarningsRupees: Number(totalEarningsPaise) / 100,
      upcomingBookingsCount,
      activeBookingsCount,
      cohostsCount,
      pendingInvitesCount,
      recentCoHosts,
      recentBookings: confirmedBookings.map((b) => ({
        ...b,
        totalAmountPaise: b.totalAmountPaise.toString(),
      })),
    };
  }

  async getHostWorkspaces(hostId: string) {
    return this.prisma.workspace.findMany({
      where: { hostId },
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                zones: {
                  include: {
                    units: true,
                  },
                },
              },
            },
          },
        },
        cohostPermissions: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });
  }

  async getHostPayouts(hostId: string) {
    const payouts = await this.prisma.payoutRequest.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
    });

    return payouts.map((p) => ({
      ...p,
      amountPaise: p.amountPaise.toString(),
      amountRupees: Number(p.amountPaise) / 100,
    }));
  }

  async requestPayout(hostId: string, dto: { amountRupees: number; bankAccount?: string; notes?: string }) {
    if (!dto.amountRupees || dto.amountRupees <= 0) {
      throw new BadRequestException('Payout amount must be greater than zero');
    }
    const amountPaise = BigInt(Math.round(dto.amountRupees * 100));

    const payout = await this.prisma.payoutRequest.create({
      data: {
        hostId,
        amountPaise,
        bankAccount: dto.bankAccount || null,
        notes: dto.notes || null,
        status: 'PENDING',
      },
    });

    return {
      message: 'Payout request submitted successfully',
      payout: {
        ...payout,
        amountPaise: payout.amountPaise.toString(),
        amountRupees: Number(payout.amountPaise) / 100,
      },
    };
  }
}
