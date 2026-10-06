import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBannerDto, UpdateBannerDto, SubmitLeadDto } from './banners.dto.js';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveBanners(page?: string) {
    const now = new Date();
    const banners = await this.prisma.banner.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      include: {
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!page) {
      return banners;
    }

    // Exclude system, authentication, and management portal routes by default
    const isExcludedRoute = ['/login', '/register', '/forgot-password', '/admin', '/co-host', '/host'].some(
      (prefix) => page === prefix || page.startsWith(prefix),
    );

    return banners.filter((b) => {
      // If targetPages is explicitly configured by Admin, respect exact match
      if (b.targetPages && b.targetPages.length > 0) {
        return b.targetPages.some((p) => p === '*' || p === page || (p !== '/' && page.startsWith(p)));
      }
      // If no targetPages specified, show only on general guest browsing pages, never on excluded auth/portal routes
      return !isExcludedRoute;
    });
  }

  async recordImpression(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    return this.prisma.banner.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
    });
  }

  async submitLead(id: string, dto: SubmitLeadDto) {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
      include: { coupon: true },
    });

    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    const couponCode = banner.coupon ? banner.coupon.code : null;

    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email || null,
        bannerId: id,
        couponCode,
      },
    });

    await this.prisma.banner.update({
      where: { id },
      data: {
        submissions: { increment: 1 },
      },
    });

    return {
      message: 'Lead recorded successfully',
      lead,
      couponCode,
      coupon: banner.coupon || null,
    };
  }

  async createBanner(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        couponId: dto.couponId || null,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        triggerType: dto.triggerType || 'delay',
        triggerValue: dto.triggerValue ?? 5,
        actionType: dto.actionType || 'form',
        targetPages: dto.targetPages || [],
      },
      include: {
        coupon: true,
      },
    });
  }

  async getBanners() {
    return this.prisma.banner.findMany({
      include: {
        coupon: true,
        _count: {
          select: { leads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeads(bannerId?: string) {
    const where = bannerId ? { bannerId } : {};
    return this.prisma.lead.findMany({
      where,
      include: {
        banner: {
          select: {
            title: true,
            actionType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.linkUrl !== undefined) data.linkUrl = dto.linkUrl;
    if (dto.couponId !== undefined) data.couponId = dto.couponId || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.triggerType !== undefined) data.triggerType = dto.triggerType;
    if (dto.triggerValue !== undefined) data.triggerValue = dto.triggerValue;
    if (dto.actionType !== undefined) data.actionType = dto.actionType;
    if (dto.targetPages !== undefined) data.targetPages = dto.targetPages;

    return this.prisma.banner.update({
      where: { id },
      data,
      include: { coupon: true },
    });
  }

  async deleteBanner(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
