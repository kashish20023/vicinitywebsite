import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // CHAT & MESSAGING
  // -------------------------------------------------------------
  async getChatHistory(userId: string, partnerId: string) {
    return [];
  }

  async sendChatMessage(senderId: string, dto: { receiverId: string; workspaceId?: string; message: string }) {
    if (!dto.message || !dto.message.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }
    return {
      id: 'msg-' + Date.now(),
      senderId,
      receiverId: dto.receiverId,
      message: dto.message.trim(),
      createdAt: new Date(),
    };
  }

  // -------------------------------------------------------------
  // MAINTENANCE ISSUES
  // -------------------------------------------------------------
  async reportMaintenanceIssue(userId: string, dto: {
    workspaceId: string;
    unitId?: string;
    category?: string;
    title: string;
    description: string;
    priority?: string;
  }) {
    return this.prisma.maintenanceIssue.create({
      data: {
        workspaceId: dto.workspaceId,
        unitId: dto.unitId || null,
        category: dto.category || 'FACILITIES',
        reportedById: userId,
        title: dto.title,
        description: dto.description,
        priority: (dto.priority as any) || 'MEDIUM',
        status: 'OPEN',
      },
    });
  }

  async getMaintenanceIssues(workspaceId?: string) {
    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;

    return this.prisma.maintenanceIssue.findMany({
      where,
      include: {
        workspace: { select: { id: true, name: true } },
        unit: { select: { id: true, unitCode: true, name: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateIssueStatus(issueId: string, status: string) {
    return this.prisma.maintenanceIssue.update({
      where: { id: issueId },
      data: { status: status as any },
    });
  }

  // -------------------------------------------------------------
  // DISPUTES & SUPPORT TICKETS
  // -------------------------------------------------------------
  async fileDispute(userId: string, dto: { bookingId: string; reason: string; description?: string }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.supportTicket.create({
      data: {
        userId,
        bookingId: dto.bookingId,
        subject: dto.reason,
        category: 'DISPUTE',
        status: 'OPEN',
        messages: {
          create: {
            senderId: userId,
            message: dto.description || dto.reason,
            isAdminReply: false,
          },
        },
      },
    });
  }

  async getAllDisputes() {
    return this.prisma.supportTicket.findMany({
      include: {
        booking: {
          include: {
            workspace: { select: { name: true } },
            user: { select: { name: true, email: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveDispute(ticketId: string, resolutionNotes: string, status: string = 'RESOLVED') {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: status as any,
      },
    });
  }

  // -------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------
  async createReview(userId: string, dto: { workspaceId: string; rating: number; comment?: string }) {
    const review = await this.prisma.review.create({
      data: {
        userId,
        workspaceId: dto.workspaceId,
        rating: dto.rating,
        comment: dto.comment || null,
        isPublished: true,
      },
    });

    const agg = await this.prisma.review.aggregate({
      where: { workspaceId: dto.workspaceId, isPublished: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.workspace.update({
      where: { id: dto.workspaceId },
      data: {
        rating: agg._avg.rating ? parseFloat(agg._avg.rating.toFixed(1)) : 4.8,
        reviewCount: agg._count.rating,
      },
    });

    return review;
  }

  async getWorkspaceReviews(workspaceId: string) {
    return this.prisma.review.findMany({
      where: { workspaceId, isPublished: true },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -------------------------------------------------------------
  // BANNERS
  // -------------------------------------------------------------
  async getActiveBanners() {
    return [
      {
        id: 'ban-jaipur-launch',
        title: 'Grand Jaipur Coworking Launch',
        subtitle: 'Use code JAIPUR20 for flat 20% off all day passes and private cabins',
        couponCode: 'JAIPUR20',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        isActive: true,
        priority: 1,
        linkUrl: '/explore',
      },
      {
        id: 'ban-enterprise',
        title: 'Custom Enterprise Suites',
        subtitle: 'Dedicated executive wings for teams of 10 to 50 members at Tonk Road',
        couponCode: 'ENTERPRISE',
        imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
        isActive: true,
        priority: 2,
        linkUrl: '/contact',
      },
    ];
  }

  // -------------------------------------------------------------
  // WISHLIST
  // -------------------------------------------------------------
  async getUserWishlist(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            address: true,
            rating: true,
            reviewCount: true,
            media: { where: { isHero: true }, take: 1 },
          },
        },
      },
    });
    return items.map((i) => i.workspace);
  }

  async toggleWishlist(userId: string, workspaceId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { inWishlist: false, message: 'Removed from wishlist' };
    } else {
      await this.prisma.wishlist.create({
        data: { userId, workspaceId },
      });
      return { inWishlist: true, message: 'Added to wishlist' };
    }
  }
}
