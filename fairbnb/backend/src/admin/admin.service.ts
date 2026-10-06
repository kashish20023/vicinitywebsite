import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole, Prisma } from '@prisma/client';
import { AdminVerifyPropertyDto, AdminPropertyAction } from './dto/admin-verify-property.dto.js';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto.js';
import { AdminVerifyUserDto } from './dto/admin-verify-user.dto.js';
import { AdminKycVerifyDto } from './dto/admin-kyc-verify.dto.js';
import { AdminSendMessageDto } from './dto/admin-send-message.dto.js';
import { AuditLogService } from '../audit-logs/audit-logs.service.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async logAdminAction(actorId: string, action: string, entityType: string, entityId?: string, details?: any) {
    try {
      if (this.auditLogService) {
        await this.auditLogService.logAction({
          actorId,
          actorRole: 'ADMIN',
          action,
          entityType,
          entityId,
          details,
        });
      }
    } catch (e) {
      // Non-blocking audit log catch
    }
  }

  /**
   * Safe sanitizer for User objects omitting password and token hashes.
   */
  private sanitizeUser(user: any) {
    if (!user) return null;
    const {
      passwordHash,
      phoneOtpHash,
      resetTokenHash,
      resetTokenExpiresAt,
      phoneOtpExpiresAt,
      otpFailedAttempts,
      otpLockUntil,
      ...safeUser
    } = user;
    return safeUser;
  }

  // ============================================================================
  // 1. OVERVIEW DASHBOARD METRICS
  // ============================================================================
  async getOverviewMetrics() {
    const [
      totalUsers,
      totalHosts,
      totalGuests,
      totalAdmins,
      verifiedUsersCount,
      blockedUsersCount,
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      publishedProperties,
      draftProperties,
      categoryGroup,
      recentUsers,
      recentProperties,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.HOST } }),
      this.prisma.user.count({ where: { role: UserRole.USER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { phoneVerified: true, emailVerified: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.property.count(),
      this.prisma.property.count({
        where: {
          OR: [
            { verificationStatus: 'PENDING' },
            { status: 'PENDING_APPROVAL' },
          ],
        },
      }),
      this.prisma.property.count({ where: { verificationStatus: 'APPROVED' } }),
      this.prisma.property.count({ where: { verificationStatus: 'REJECTED' } }),
      this.prisma.property.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.property.count({ where: { status: 'DRAFT' } }),
      this.prisma.property.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const unverifiedUsersCount = totalUsers - verifiedUsersCount;

    // Attach host details to recent properties
    const hostIds = [...new Set(recentProperties.map((p) => p.hostId))];
    const hosts = await this.prisma.user.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, name: true, email: true, phone: true },
    });
    const hostMap = new Map(hosts.map((h) => [h.id, h]));

    const recentPropertiesWithHosts = recentProperties.map((p) => ({
      ...p,
      host: hostMap.get(p.hostId) || null,
    }));

    return {
      overview: {
        users: {
          total: totalUsers,
          hosts: totalHosts,
          guests: totalGuests,
          admins: totalAdmins,
          verified: verifiedUsersCount,
          unverified: unverifiedUsersCount,
          blocked: blockedUsersCount,
        },
        properties: {
          total: totalProperties,
          pending: pendingProperties,
          approved: approvedProperties,
          rejected: rejectedProperties,
          published: publishedProperties,
          draft: draftProperties,
          categories: categoryGroup.map((c) => ({
            category: c.category,
            count: c._count.id,
          })),
        },
      },
      recentUsers: recentUsers.map((u) => this.sanitizeUser(u)),
      recentProperties: recentPropertiesWithHosts,
    };
  }

  // ============================================================================
  // 2. USERS MANAGEMENT
  // ============================================================================

  /**
   * Get all users with optional filtering by role, active status, or text search.
   */
  async getAllUsers(filters?: { role?: UserRole; search?: string; isActive?: boolean }) {
    const where: Prisma.UserWhereInput = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (typeof filters?.isActive === 'boolean') {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.sanitizeUser(u));
  }

  /**
   * Get all Hosts along with their property listing counts.
   */
  async getHosts() {
    const hosts = await this.prisma.user.findMany({
      where: { role: UserRole.HOST },
      orderBy: { createdAt: 'desc' },
    });

    const hostIds = hosts.map((h) => h.id);
    const propertyCounts = await this.prisma.property.groupBy({
      by: ['hostId'],
      where: { hostId: { in: hostIds } },
      _count: { id: true },
    });

    const countMap = new Map(propertyCounts.map((pc) => [pc.hostId, pc._count.id]));

    return hosts.map((h) => ({
      ...this.sanitizeUser(h),
      totalPropertiesCount: countMap.get(h.id) || 0,
    }));
  }

  /**
   * Get users pending verification (either phone or email unverified).
   */
  async getUsersPendingVerification() {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [{ phoneVerified: false }, { emailVerified: false }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.sanitizeUser(u));
  }

  /**
   * Update user verification flags (phoneVerified, emailVerified).
   */
  async verifyUser(id: string, dto: AdminVerifyUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        phoneVerified: dto.phoneVerified ?? user.phoneVerified,
        emailVerified: dto.emailVerified ?? user.emailVerified,
      },
    });

    await this.logAdminAction('system_admin', 'USER_VERIFY', 'USER', id, {
      phoneVerified: dto.phoneVerified,
      emailVerified: dto.emailVerified,
    });

    return this.sanitizeUser(updated);
  }

  /**
   * Get all blocked / suspended users (isActive = false).
   */
  async getBlockedUsers() {
    const users = await this.prisma.user.findMany({
      where: { isActive: false },
      orderBy: { updatedAt: 'desc' },
    });

    return users.map((u) => this.sanitizeUser(u));
  }

  /**
   * Block or unblock a user (isActive: false / true).
   */
  async updateUserStatus(id: string, dto: AdminUpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
    });

    await this.logAdminAction('system_admin', dto.isActive ? 'USER_ACTIVATE' : 'USER_SUSPEND', 'USER', id, {
      userName: user.name,
      email: user.email,
    });

    return this.sanitizeUser(updated);
  }

  // ============================================================================
  // 3. PROPERTIES MANAGEMENT
  // ============================================================================

  /**
   * Helper to attach host info to properties list.
   */
  private async attachHostsToProperties(properties: any[]) {
    if (!properties.length) return [];

    const hostIds = [...new Set(properties.map((p) => p.hostId))];
    const hosts = await this.prisma.user.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    const hostMap = new Map(hosts.map((h) => [h.id, h]));

    return properties.map((p) => ({
      ...p,
      host: hostMap.get(p.hostId) || null,
    }));
  }

  /**
   * Get all properties with optional filters.
   */
  async getAllProperties(filters?: {
    status?: string;
    verificationStatus?: string;
    city?: string;
    category?: string;
    search?: string;
  }) {
    const where: Prisma.PropertyWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.verificationStatus) {
      where.verificationStatus = filters.verificationStatus;
    }

    if (filters?.city) {
      where.city = { equals: filters.city, mode: 'insensitive' };
    }

    if (filters?.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const properties = await this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return this.attachHostsToProperties(properties);
  }

  /**
   * Get properties pending admin review.
   */
  async getPendingProperties() {
    const properties = await this.prisma.property.findMany({
      where: {
        OR: [
          { verificationStatus: 'PENDING' },
          { status: 'PENDING_APPROVAL' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.attachHostsToProperties(properties);
  }

  /**
   * Get approved properties.
   */
  async getApprovedProperties() {
    const properties = await this.prisma.property.findMany({
      where: { verificationStatus: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });

    return this.attachHostsToProperties(properties);
  }

  /**
   * Get rejected properties.
   */
  async getRejectedProperties() {
    const properties = await this.prisma.property.findMany({
      where: {
        OR: [
          { verificationStatus: 'REJECTED' },
          { status: 'REJECTED' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.attachHostsToProperties(properties);
  }

  /**
   * Verify property action (Approve / Reject).
   */
  async verifyProperty(id: string, dto: AdminVerifyPropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException(`Property with ID '${id}' not found`);
    }

    if (dto.action === AdminPropertyAction.APPROVE) {
      const updated = await this.prisma.property.update({
        where: { id },
        data: {
          verificationStatus: 'APPROVED',
          status: 'PUBLISHED',
          verificationNote: dto.verificationNote || 'Approved by Admin',
          rejectionReason: null,
        },
      });

      await this.logAdminAction('system_admin', 'PROPERTY_APPROVE', 'PROPERTY', id, { title: property.title });
      return (await this.attachHostsToProperties([updated]))[0];
    } else if (dto.action === AdminPropertyAction.REJECT) {
      const updated = await this.prisma.property.update({
        where: { id },
        data: {
          verificationStatus: 'REJECTED',
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason || 'Rejected by Admin',
          verificationNote: dto.verificationNote || null,
        },
      });

      await this.logAdminAction('system_admin', 'PROPERTY_REJECT', 'PROPERTY', id, { title: property.title, reason: dto.rejectionReason });
      return (await this.attachHostsToProperties([updated]))[0];
    } else {
      throw new BadRequestException('Invalid verification action. Use APPROVE or REJECT');
    }
  }

  // ============================================================================
  // 4. GUESTS MANAGEMENT HUB (USER ROLE = GUEST)
  // ============================================================================

  /**
   * Get list of all Guests (role = USER) with trip counts, lifetime bookings, total spent, and block status.
   */
  async getGuestsList(search?: string) {
    const where: Prisma.UserWhereInput = {
      role: UserRole.USER,
    };

    if (search) {
      const query = search.trim().toLowerCase();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ];
    }

    const guests = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        bookings: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            checkIn: true,
            checkOut: true,
          },
        },
        reviewsGiven: {
          select: { rating: true },
        },
      },
    });

    return guests.map((g) => {
      const totalBookingsCount = g.bookings.length;
      const completedTrips = g.bookings.filter((b) => b.status === 'COMPLETED');
      const paidBookings = g.bookings.filter((b) => b.paymentStatus === 'PAID');
      const totalSpent = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);

      const lastStay = completedTrips.length > 0
        ? completedTrips.sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime())[0].checkOut
        : null;

      const reviewsGiven = g.reviewsGiven || [];
      const avgRating = reviewsGiven.length > 0
        ? Number((reviewsGiven.reduce((s, r) => s + r.rating, 0) / reviewsGiven.length).toFixed(1))
        : 0;

      const sanitized = this.sanitizeUser(g);
      return {
        ...sanitized,
        isBlocked: !g.isActive,
        blockReason: g.blockReason || null,
        verificationBadge: g.kycStatus === 'VERIFIED' || (g.phoneVerified && g.emailVerified) ? 'Verified' : 'Unverified',
        rating: avgRating,
        lastStayDate: lastStay,
        metrics: {
          totalBookingsCount,
          completedTripsCount: completedTrips.length,
          totalSpent: Number(totalSpent.toFixed(2)),
        },
      };
    });
  }

  async blockUnblockGuest(guestId: string, isBlocked: boolean, reason?: string) {
    const guest = await this.prisma.user.findUnique({ where: { id: guestId } });
    if (!guest) {
      throw new NotFoundException(`Guest user with ID '${guestId}' not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: guestId },
      data: {
        isActive: !isBlocked,
        blockReason: isBlocked ? (reason || 'Blocked by Admin') : null,
      },
    });

    await this.logAdminAction('system_admin', isBlocked ? 'GUEST_BLOCK' : 'GUEST_UNBLOCK', 'USER', guestId, {
      reason,
      guestName: guest.name,
    });

    return {
      message: isBlocked ? 'Guest account blocked successfully' : 'Guest account unblocked successfully',
      guest: this.sanitizeUser(updated),
    };
  }

  // ============================================================================
  // 5. HOSTS MANAGEMENT HUB & IMPERSONATION
  // ============================================================================

  /**
   * Get list of all Hosts with active listings count, total properties, revenue, rating, and Superhost indicator.
   */
  async getHostsList(search?: string) {
    const where: Prisma.UserWhereInput = {
      role: UserRole.HOST,
    };

    if (search) {
      const query = search.trim().toLowerCase();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ];
    }

    const hosts = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        properties: {
          select: {
            id: true,
            status: true,
            verificationStatus: true,
            bookings: {
              select: {
                totalAmount: true,
                paymentStatus: true,
              },
            },
            reviews: {
              select: { rating: true },
            },
          },
        },
      },
    });

    return hosts.map((h) => {
      const totalPropertiesCount = h.properties.length;
      const activePropertiesCount = h.properties.filter(
        (p) => p.status === 'PUBLISHED' && p.verificationStatus === 'APPROVED',
      ).length;

      let totalRevenue = 0;
      let allRatings: number[] = [];

      h.properties.forEach((p) => {
        p.bookings.forEach((b) => {
          if (b.paymentStatus === 'PAID') {
            totalRevenue += b.totalAmount;
          }
        });
        (p.reviews || []).forEach((r) => allRatings.push(r.rating));
      });

      const avgRating = allRatings.length > 0
        ? Number((allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1))
        : 0;

      const sanitized = this.sanitizeUser(h);
      return {
        ...sanitized,
        isSuperhost: h.isSuperhost || false,
        verificationBadge: h.kycStatus === 'VERIFIED' || (h.phoneVerified && h.emailVerified) ? 'VERIFIED' : 'UNVERIFIED',
        rating: avgRating,
        joinedDate: h.createdAt,
        metrics: {
          totalPropertiesCount,
          activePropertiesCount,
          totalRevenue: Number(totalRevenue.toFixed(2)),
        },
      };
    });
  }

  /**
   * Generate Host Impersonation Context for Admin preview.
   */
  async impersonateHost(hostId: string) {
    const host = await this.prisma.user.findUnique({
      where: { id: hostId },
      include: {
        properties: true,
      },
    });

    if (!host) {
      throw new NotFoundException(`Host with ID '${hostId}' not found`);
    }

    if (host.role !== UserRole.HOST && host.role !== UserRole.ADMIN) {
      throw new BadRequestException(`User with ID '${hostId}' is not a HOST`);
    }

    return {
      impersonationContext: {
        adminContext: true,
        impersonatedHostId: host.id,
        hostName: host.name,
        hostEmail: host.email,
        hostPhone: host.phone,
        role: host.role,
        isSuperhost: host.isSuperhost,
        propertiesCount: host.properties.length,
        impersonatedAt: new Date().toISOString(),
      },
      host: this.sanitizeUser(host),
    };
  }

  // ============================================================================
  // 6. PROPERTY OWNERSHIP TRANSFER
  // ============================================================================

  /**
   * Transfer property ownership from current host to a new host ID.
   */
  async transferPropertyOwnership(propertyId: string, newHostId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID '${propertyId}' not found`);
    }

    const newHost = await this.prisma.user.findUnique({
      where: { id: newHostId },
    });

    if (!newHost) {
      throw new NotFoundException(`Target host user with ID '${newHostId}' not found`);
    }

    if (newHost.role !== UserRole.HOST && newHost.role !== UserRole.ADMIN) {
      throw new BadRequestException(`Target user with ID '${newHostId}' does not have HOST or ADMIN role`);
    }

    const previousHostId = property.hostId;

    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        hostId: newHostId,
      },
    });

    await this.logAdminAction('system_admin', 'PROPERTY_TRANSFER', 'PROPERTY', propertyId, {
      propertyTitle: property.title,
      previousHostId,
      newHostId,
    });

    const attached = await this.attachHostsToProperties([updatedProperty]);

    return {
      message: `Property '${property.title}' successfully transferred from host '${previousHostId}' to host '${newHostId}'`,
      transferRecord: {
        propertyId: property.id,
        propertyTitle: property.title,
        previousHostId,
        newHostId,
        transferredAt: new Date().toISOString(),
      },
      property: attached[0],
    };
  }

  // ============================================================================
  // 7. PLATFORM STATS & FINANCIAL ANALYTICS
  // ============================================================================

  /**
   * GET /admin/stats
   * Unified platform-wide operational stats.
   */
  async getPlatformStats() {
    const [
      pendingVerificationsCount,
      pendingPropertiesCount,
      totalUsers,
      totalHosts,
      totalGuests,
      totalProperties,
      publishedProperties,
      totalBookingsCount,
      revenueResult,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          OR: [{ kycStatus: 'PENDING' }, { phoneVerified: false }, { emailVerified: false }],
        },
      }),
      this.prisma.property.count({
        where: {
          OR: [{ verificationStatus: 'PENDING' }, { status: 'PENDING_APPROVAL' }],
        },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.HOST } }),
      this.prisma.user.count({ where: { role: UserRole.USER } }),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.booking.count(),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
    ]);

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    return {
      stats: {
        pendingVerificationsCount,
        pendingPropertiesCount,
        totalUsers,
        totalHosts,
        totalGuests,
        totalProperties,
        publishedProperties,
        totalBookingsCount,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      },
    };
  }

  /**
   * GET /admin/analytics/overview?range=7d|30d|90d&mode=stayed|booked
   * Time-series revenue progression, GBV, ADR, and Occupancy Rate.
   */
  async getAnalyticsOverview(rangeParam: string = '30d', modeParam: string = 'booked') {
    const days = parseInt(rangeParam.replace(/\D/g, ''), 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bookingWhere: Prisma.BookingWhereInput = {
      createdAt: { gte: startDate },
    };

    if (modeParam === 'stayed') {
      bookingWhere.status = 'COMPLETED';
    } else {
      bookingWhere.paymentStatus = 'PAID';
    }

    const bookings = await this.prisma.booking.findMany({
      where: bookingWhere,
      select: {
        id: true,
        createdAt: true,
        checkIn: true,
        checkOut: true,
        nights: true,
        baseAmount: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const publishedPropertiesCount = await this.prisma.property.count({
      where: { status: 'PUBLISHED' },
    });

    let grossBookingVolume = 0;
    let totalNightsBooked = 0;
    let totalBaseRevenue = 0;
    const dailyMap = new Map<string, { revenue: number; bookingsCount: number }>();

    bookings.forEach((b) => {
      grossBookingVolume += b.totalAmount;
      const nights = b.nights || 1;
      totalNightsBooked += nights;
      totalBaseRevenue += b.baseAmount || (b.totalAmount * 0.7);

      const dateKey = b.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { revenue: 0, bookingsCount: 0 };
      dailyMap.set(dateKey, {
        revenue: Number((existing.revenue + b.totalAmount).toFixed(2)),
        bookingsCount: existing.bookingsCount + 1,
      });
    });

    const totalCompletedReservations = bookings.length;
    const averageDailyRate = totalNightsBooked > 0 ? totalBaseRevenue / totalNightsBooked : 0;
    const maxCapacityNights = (publishedPropertiesCount || 1) * days;
    const occupancyRate = maxCapacityNights > 0 ? (totalNightsBooked / maxCapacityNights) * 100 : 0;

    const timeSeries = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      revenue: val.revenue,
      bookings: val.bookingsCount,
    }));

    return {
      timeframe: `${days} Days`,
      mode: modeParam,
      kpis: {
        grossBookingVolume: Number(grossBookingVolume.toFixed(2)),
        totalCompletedReservations,
        averageDailyRate: Number(averageDailyRate.toFixed(2)),
        occupancyRatePercentage: Number(occupancyRate.toFixed(1)),
      },
      timeSeries,
    };
  }

  // ============================================================================
  // 8. IDENTITY & KYC VERIFICATION QUEUE
  // ============================================================================

  /**
   * GET /admin/verifications/pending
   * Returns list of users awaiting KYC identity verification review.
   */
  async getPendingVerifications() {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { kycStatus: 'PENDING' },
          { phoneVerified: false },
          { emailVerified: false },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => {
      const sanitized = this.sanitizeUser(u);
      return {
        ...sanitized,
        kycStatus: u.kycStatus || 'PENDING',
        kycDocumentUrl: u.kycDocumentUrl || null,
        kycNote: u.kycNote || null,
      };
    });
  }

  /**
   * PATCH /admin/users/:id/verify or PUT /admin/users/:id/verify
   * Updates user KYC verification status and saves optional feedback notes.
   */
  async verifyUserKyc(userId: string, dto: AdminKycVerifyDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const isVerified = dto.status === 'VERIFIED';

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: dto.status,
        kycNote: dto.feedbackNote || null,
        phoneVerified: isVerified ? true : user.phoneVerified,
        emailVerified: isVerified ? true : user.emailVerified,
      },
    });

    await this.logAdminAction('system_admin', `KYC_${dto.status}`, 'USER', userId, {
      userName: user.name,
      kycNote: dto.feedbackNote,
    });

    return {
      message: `User KYC verification updated to '${dto.status}'`,
      user: this.sanitizeUser(updated),
    };
  }

  // ============================================================================
  // 9. FINANCIAL COLLECTIONS & DIRECT ADMIN MESSAGING
  // ============================================================================

  /**
   * GET /admin/collections
   * Summary of platform financial collections, invoices, service fees, and payouts.
   */
  async getFinancialCollections() {
    const [invoices, totalCollectedResult, payoutPendingResult, payoutApprovedResult] = await Promise.all([
      this.prisma.invoice.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              guestId: true,
              propertyId: true,
              totalAmount: true,
              serviceFee: true,
            },
          },
        },
      }),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true, serviceFee: true },
        where: { paymentStatus: 'PAID' },
      }),
      this.prisma.payoutRequest.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      }),
      this.prisma.payoutRequest.aggregate({
        _sum: { amount: true },
        where: { status: 'APPROVED' },
      }),
    ]);

    const totalCollectedVolume = totalCollectedResult._sum.totalAmount || 0;
    const totalPlatformServiceFees = totalCollectedResult._sum.serviceFee || (totalCollectedVolume * 0.10);
    const totalPayoutsPending = payoutPendingResult._sum.amount || 0;
    const totalPayoutsApproved = payoutApprovedResult._sum.amount || 0;

    return {
      financialSummary: {
        totalCollectedVolume: Number(totalCollectedVolume.toFixed(2)),
        totalPlatformServiceFees: Number(totalPlatformServiceFees.toFixed(2)),
        totalPayoutsPending: Number(totalPayoutsPending.toFixed(2)),
        totalPayoutsApproved: Number(totalPayoutsApproved.toFixed(2)),
        invoicesCount: invoices.length,
      },
      recentInvoices: invoices,
    };
  }

  /**
   * POST /admin/messages/send
   * Direct Admin Message dispatcher to any registered user or host.
   */
  async sendAdminMessage(senderId: string, dto: AdminSendMessageDto) {
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException(`Recipient user with ID '${dto.recipientId}' not found`);
    }

    const message = await this.prisma.adminMessage.create({
      data: {
        senderId,
        recipientId: dto.recipientId,
        subject: dto.subject,
        content: dto.content,
      },
      include: {
        recipient: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await this.logAdminAction(senderId, 'ADMIN_MESSAGE_SEND', 'AdminMessage', message.id, {
      recipientId: dto.recipientId,
      subject: dto.subject,
    });

    return {
      success: true,
      message: `Direct administrative message sent successfully to ${recipient.name} (${recipient.email || recipient.phone})`,
      messageRecord: message,
    };
  }

  async getPayoutRequests(status?: string) {
    const where: Prisma.PayoutRequestWhereInput = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    return this.prisma.payoutRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
  }

  async approvePayoutRequest(payoutId: string, adminUserId: string) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { host: true },
    });

    if (!payout) {
      throw new NotFoundException(`Payout request with ID '${payoutId}' not found`);
    }

    if (payout.status === 'APPROVED') {
      return payout;
    }

    const updated = await this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: { status: 'APPROVED' },
    });

    // Record automated PAYOUT_COMPLETED financial ledger entry
    await this.prisma.financialTransaction.create({
      data: {
        recipientId: payout.hostId,
        type: 'PAYOUT_COMPLETED',
        amount: payout.amount,
        currency: 'INR',
        status: 'COMPLETED',
        metadata: { payoutRequestId: payout.id },
      },
    });

    await this.logAdminAction(adminUserId, 'PAYOUT_APPROVE', 'PayoutRequest', payoutId, {
      hostId: payout.hostId,
      hostName: payout.host.name,
      amount: payout.amount,
    });

    return updated;
  }

  // ============================================================================
  // 11. ADMIN CO-HOST SUPERVISION HUB
  // ============================================================================

  /**
   * GET /admin/co-hosts
   * List all property co-host relationships with Host details, Co-Host details, Property info, permissions, and payout splits.
   */
  async getAllCoHosts(search?: string, status?: string) {
    const where: Prisma.CoHostRelationshipWhereInput = {};

    if (status && status !== 'ALL') {
      where.status = status as any;
    }

    if (search) {
      const query = search.trim().toLowerCase();
      where.OR = [
        { hostUser: { name: { contains: query, mode: 'insensitive' } } },
        { coHostUser: { name: { contains: query, mode: 'insensitive' } } },
        { property: { title: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const relationships = await this.prisma.coHostRelationship.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        hostUser: { select: { id: true, name: true, email: true, phone: true } },
        coHostUser: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, title: true, city: true, state: true, coverImage: true } },
        permissions: { select: { permission: true } },
        payoutRules: { select: { id: true, type: true, percentage: true, fixedAmount: true, status: true } },
      },
    });

    const activeCount = relationships.filter((r) => r.status === 'ACTIVE' || r.status === 'ACCEPTED').length;
    const suspendedCount = relationships.filter((r) => r.status === 'SUSPENDED').length;

    return {
      summary: {
        totalRelationships: relationships.length,
        activeCount,
        suspendedCount,
      },
      relationships: relationships.map((r) => ({
        ...r,
        grantedPermissionsCount: r.permissions.length,
        grantedPermissions: r.permissions.map((p) => p.permission),
      })),
    };
  }

  /**
   * PATCH /admin/co-hosts/:id/status
   * Administrative override to suspend or reactivate a Co-Host relationship.
   */
  async updateCoHostStatus(relationshipId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const rel = await this.prisma.coHostRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!rel) {
      throw new NotFoundException(`Co-Host relationship with ID '${relationshipId}' not found`);
    }

    const updated = await this.prisma.coHostRelationship.update({
      where: { id: relationshipId },
      data: {
        status: status as any,
        suspendedAt: status === 'SUSPENDED' ? new Date() : null,
      },
      include: {
        hostUser: { select: { name: true } },
        coHostUser: { select: { name: true } },
        property: { select: { title: true } },
      },
    });

    await this.logAdminAction('system_admin', `COHOST_${status}`, 'CoHostRelationship', relationshipId, {
      host: updated.hostUser.name,
      coHost: updated.coHostUser.name,
      property: updated.property.title,
    });

    return {
      message: `Co-Host relationship status updated to '${status}'`,
      relationship: updated,
    };
  }

  /**
   * GET /admin/co-hosts/:id
   * Detailed Co-Host profile overview with real DB relations, booking counts, permissions mapping & audit log.
   */
  async getCoHostProfileDetail(idParam: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: idParam },
          { coHostCode: idParam },
          { coHostRelationships: { some: { id: idParam } } },
        ],
      },
      include: {
        coHostRelationships: {
          include: {
            hostUser: { select: { id: true, name: true, email: true, phone: true } },
            property: {
              select: {
                id: true,
                title: true,
                city: true,
                state: true,
                coverImage: true,
                propertyType: true,
                maxGuests: true,
                status: true,
                _count: { select: { bookings: true } },
              },
            },
            permissions: { select: { permission: true } },
          },
        },
      },
    });

    if (!user) {
      const rel = await this.prisma.coHostRelationship.findUnique({
        where: { id: idParam },
        include: { coHostUser: true },
      });
      if (rel) {
        user = await this.prisma.user.findUnique({
          where: { id: rel.coHostUserId },
          include: {
            coHostRelationships: {
              include: {
                hostUser: { select: { id: true, name: true, email: true, phone: true } },
                property: {
                  select: {
                    id: true,
                    title: true,
                    city: true,
                    state: true,
                    coverImage: true,
                    propertyType: true,
                    maxGuests: true,
                    status: true,
                    _count: { select: { bookings: true } },
                  },
                },
                permissions: { select: { permission: true } },
              },
            },
          },
        });
      }
    }

    if (!user) {
      throw new NotFoundException(`Co-Host profile with ID '${idParam}' not found`);
    }

    const assignedProperties = (user.coHostRelationships || []).map((rel, idx) => {
      const permsArray = rel.permissions.map((p) => p.permission);
      const permMap: Record<string, boolean> = {
        manageBookings: permsArray.includes('MANAGE_BOOKINGS') || permsArray.includes('VIEW_BOOKINGS'),
        guestMessages: permsArray.includes('MESSAGE_GUESTS') || permsArray.includes('VIEW_GUESTS'),
        checkIn: permsArray.includes('MANAGE_BOOKINGS'),
        checkOut: permsArray.includes('MANAGE_BOOKINGS'),
        calendarManagement: permsArray.includes('MANAGE_CALENDAR') || permsArray.includes('VIEW_CALENDAR'),
        cleaning: permsArray.includes('MANAGE_CLEANING'),
        pricing: permsArray.includes('MANAGE_PRICING') || permsArray.includes('VIEW_PRICING'),
        propertyEditing: permsArray.includes('EDIT_LISTING'),
        payoutManagement: permsArray.includes('MANAGE_PAYOUT_SETTINGS') || permsArray.includes('VIEW_PAYOUTS'),
      };

      return {
        id: rel.id,
        propertyId: rel.property.id,
        propertyCode: `PR-${2048 + idx}`,
        title: rel.property.title,
        coverImage: rel.property.coverImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        location: `${rel.property.city || 'Jaipur'}, ${rel.property.state || 'Rajasthan'}`,
        propertyType: rel.property.propertyType || 'Villa',
        maxGuests: rel.property.maxGuests || 6,
        status: rel.property.status || 'APPROVED',
        bookingCount: rel.property._count?.bookings || 0,
        assignedByHost: {
          id: rel.hostUser.id,
          name: rel.hostUser.name,
          email: rel.hostUser.email || '',
          role: 'Host',
        },
        assignedOn: new Date(rel.acceptedAt || rel.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        assignmentStatus: rel.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
        permissions: permMap,
      };
    });

    const connectedHostsMap = new Map<string, any>();
    (user.coHostRelationships || []).forEach((rel) => {
      const hId = rel.hostUser.id;
      if (!connectedHostsMap.has(hId)) {
        connectedHostsMap.set(hId, {
          id: rel.hostUser.id,
          name: rel.hostUser.name,
          email: rel.hostUser.email || '',
          phone: rel.hostUser.phone || '',
          assignedPropertyCount: 1,
          status: 'ACTIVE',
        });
      } else {
        connectedHostsMap.get(hId).assignedPropertyCount += 1;
      }
    });

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { actorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => []);

    const activities = auditLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      timeAgo: `${Math.round((Date.now() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60))} hours ago`,
      title: log.action.replace(/_/g, ' '),
      targetTitle: log.entityType,
      type: log.action.includes('SUSPEND') ? 'SECURITY' : 'SYSTEM',
      performedBy: 'System Admin',
    }));

    return {
      id: user.id,
      coHostIdCode: user.coHostCode || `CH-${user.id.slice(0, 4).toUpperCase()}`,
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      location: 'India',
      status: user.isActive ? 'ACTIVE' : 'SUSPENDED',
      kycStatus: user.kycStatus || 'VERIFIED',
      joinedAt: new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastActiveAt: new Date(user.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      stats: {
        totalProperties: assignedProperties.length,
        activeAssignments: assignedProperties.filter((p) => p.assignmentStatus === 'ACTIVE').length,
        connectedHostsCount: connectedHostsMap.size,
        managedBookingsCount: assignedProperties.reduce((sum, p) => sum + p.bookingCount, 0),
        pendingTasksCount: 0,
      },
      connectedHosts: Array.from(connectedHostsMap.values()),
      assignedProperties,
      recentActivities: activities,
    };
  }

  /**
   * GET /admin/hosts/:id
   * Detailed Host profile overview with real DB relations, booking counts, co-hosts list & audit log.
   */
  async getHostProfileDetail(hostIdParam: string) {
    const host = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: hostIdParam }, { email: hostIdParam }, { phone: hostIdParam }],
      },
      include: {
        properties: {
          include: {
            _count: { select: { bookings: true } },
            coHostRelationships: {
              include: {
                coHostUser: { select: { id: true, name: true, coHostCode: true } },
              },
            },
          },
        },
      },
    });

    if (!host) {
      throw new NotFoundException(`Host profile with ID '${hostIdParam}' not found`);
    }

    const properties = host.properties.map((prop, idx) => {
      const coHostRel = prop.coHostRelationships?.[0];
      return {
        id: prop.id,
        propertyCode: `PR-${2048 + idx}`,
        title: prop.title,
        coverImage: prop.coverImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        city: prop.city,
        state: prop.state,
        locality: prop.locality || prop.city,
        propertyType: prop.propertyType || 'Villa',
        bookingCount: prop._count?.bookings || 0,
        status: prop.status || 'APPROVED',
        assignedCoHost: coHostRel
          ? {
              id: coHostRel.coHostUser.id,
              name: coHostRel.coHostUser.name,
              coHostCode: coHostRel.coHostUser.coHostCode || `CH-${coHostRel.coHostUser.id.slice(0, 4).toUpperCase()}`,
              assignedOn: new Date(coHostRel.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: coHostRel.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
            }
          : undefined,
      };
    });

    const coHostsMap = new Map<string, any>();
    host.properties.forEach((prop) => {
      (prop.coHostRelationships || []).forEach((rel) => {
        const chId = rel.coHostUser.id;
        if (!coHostsMap.has(chId)) {
          coHostsMap.set(chId, {
            id: rel.coHostUser.id,
            name: rel.coHostUser.name,
            coHostCode: rel.coHostUser.coHostCode || `CH-${rel.coHostUser.id.slice(0, 4).toUpperCase()}`,
            assignedPropertiesCount: 1,
            status: rel.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
          });
        } else {
          coHostsMap.get(chId).assignedPropertiesCount += 1;
        }
      });
    });

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { actorId: host.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => []);

    const activities = auditLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      timeAgo: `${Math.round((Date.now() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60))} hours ago`,
      title: log.action.replace(/_/g, ' '),
      targetTitle: log.entityType,
      type: log.action.includes('SUSPEND') ? 'SECURITY' : 'SYSTEM',
      performedBy: 'System Admin',
    }));

    return {
      id: host.id,
      name: host.name,
      email: host.email || '',
      phone: host.phone || '',
      avatar: host.avatarUrl || undefined,
      kycStatus: host.kycStatus || 'VERIFIED',
      joinedAt: new Date(host.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: host.isActive ? 'ACTIVE' : 'SUSPENDED',
      stats: {
        totalListings: properties.length,
        activeBookings: properties.reduce((sum, p) => sum + p.bookingCount, 0),
        totalCoHosts: coHostsMap.size,
        totalEarnings: 0,
      },
      properties,
      coHostsList: Array.from(coHostsMap.values()),
      activities,
      verification: {
        identityStatus: host.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
        emailStatus: host.emailVerified ? 'VERIFIED' : 'PENDING',
        phoneStatus: host.phoneVerified ? 'VERIFIED' : 'PENDING',
        kycStatus: host.kycStatus || 'APPROVED',
        verifiedOn: new Date(host.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        verifiedBy: 'Admin Team',
      },
    };
  }
}


