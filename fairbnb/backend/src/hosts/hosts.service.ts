import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicHostProfile(hostId: string) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        isSuperhost: true,
        role: true,
        createdAt: true,
        properties: {
          where: {
            status: 'PUBLISHED',
            verificationStatus: 'APPROVED',
          },
          select: {
            id: true,
            title: true,
            slug: true,
            city: true,
            state: true,
            basePrice: true,
            coverImage: true,
            images: true,
            category: true,
          },
        },
      },
    });

    if (!host || (host.role !== 'HOST' && host.role !== 'ADMIN')) {
      throw new NotFoundException('Host profile not found');
    }

    // Compute average host rating across properties
    const propertyIds = host.properties.map((p) => p.id);
    const reviews = await this.prisma.review.aggregate({
      where: { propertyId: { in: propertyIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      host: {
        id: host.id,
        name: host.name,
        avatarUrl: host.avatarUrl,
        bio: host.bio,
        isSuperhost: host.isSuperhost,
        joinedAt: host.createdAt,
      },
      stats: {
        totalListings: host.properties.length,
        averageRating: reviews._avg.rating ? parseFloat(reviews._avg.rating.toFixed(2)) : 5.0,
        totalReviews: reviews._count.rating,
      },
      listings: host.properties,
    };
  }

  async getHostDashboardStats(hostId: string) {
    const properties = await this.prisma.property.findMany({
      where: { hostId },
      select: { id: true, title: true, basePrice: true },
    });

    const propertyIds = properties.map((p) => p.id);

    const totalBookingsCount = await this.prisma.booking.count({
      where: { propertyId: { in: propertyIds } },
    });

    const paidBookings = await this.prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
        paymentStatus: 'PAID',
      },
      select: { totalAmount: true, baseAmount: true, createdAt: true, checkIn: true, checkOut: true },
    });

    const totalEarnings = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const now = new Date();
    const upcomingBookingsCount = await this.prisma.booking.count({
      where: {
        propertyId: { in: propertyIds },
        checkIn: { gte: now },
        status: 'CONFIRMED',
      },
    });

    const pendingRequestsCount = await this.prisma.booking.count({
      where: {
        propertyId: { in: propertyIds },
        status: 'PENDING',
      },
    });

    return {
      propertiesCount: properties.length,
      totalBookingsCount,
      totalEarnings,
      upcomingBookingsCount,
      pendingRequestsCount,
      recentBookings: paidBookings.slice(-5),
    };
  }
}
