import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${baseSlug}-${randomSuffix}`;
  }

  async create(hostId: string, userRole: UserRole, dto: CreatePropertyDto) {
    const slug = this.generateSlug(dto.title);

    // Approval logic: Admin listings are auto-approved. Host listings require Admin approval.
    const isApproved = userRole === UserRole.ADMIN;
    const status = isApproved ? 'PUBLISHED' : 'PENDING_APPROVAL';
    const verificationStatus = isApproved ? 'APPROVED' : 'PENDING';

    return this.prisma.property.create({
      data: {
        title: dto.title,
        description: dto.description,
        shortDescription: dto.shortDescription || null,
        neighborhoodDescription: dto.neighborhoodDescription || null,
        aiKnowledgeBasePublic: dto.aiKnowledgeBasePublic || null,
        aiKnowledgeBasePrivate: dto.aiKnowledgeBasePrivate || null,
        category: dto.category,
        propertyType: dto.propertyType,
        listingPurpose: dto.listingPurpose,

        // Location fields
        address: dto.address || null,
        locality: dto.locality || null,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        pincode: dto.pincode || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,

        // Capacity & Pricing
        maxGuests: dto.maxGuests,
        bedrooms: dto.bedrooms,
        beds: dto.beds,
        bathrooms: dto.bathrooms,
        basePrice: dto.basePrice,
        cleaningFee: dto.cleaningFee ?? 0,
        serviceFeeRate: dto.serviceFeeRate ?? 0.10,
        taxRate: dto.taxRate ?? 0.18,
        instantBook: dto.instantBook ?? false,
        totalStock: dto.totalStock ?? 1,
        minNights: dto.minNights ?? 1,
        cancellationPolicy: dto.cancellationPolicy || 'FLEXIBLE',

        // Stay Guide
        wifiNetwork: dto.wifiNetwork || null,
        wifiPassword: dto.wifiPassword || null,
        checkInInstructions: dto.checkInInstructions || null,
        houseRules: dto.houseRules || [],

        // Media & JSON Extras
        images: dto.images || [],
        gallery: dto.gallery || {},
        coverImage: dto.coverImage || (dto.images && dto.images.length > 0 ? dto.images[0] : null),
        listingExtras: dto.listingExtras || {},
        ownershipProofDocs: dto.ownershipProofDocs || [],
        pointOfContact: dto.pointOfContact ? (dto.pointOfContact as any) : undefined,

        // Operational Defaults & Approval Status
        status,
        verificationStatus,
        slug,
        adminTags: [],
        unavailableDates: [],
        hostId,
      },
    });
  }

  /**
   * Public Catalog View: Only returns APPROVED & PUBLISHED properties.
   * Supports Map Bounding Box, Superhost filter, Instant Book filter, and Sorting.
   */
  async findAll(query?: {
    city?: string;
    state?: string;
    country?: string;
    category?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    maxGuests?: number;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
    instantBook?: boolean;
    superhostOnly?: boolean;
    sortBy?: string;
  }) {
    const where: any = {
      verificationStatus: 'APPROVED',
      status: 'PUBLISHED',
    };

    if (query?.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }
    if (query?.state) {
      where.state = { contains: query.state, mode: 'insensitive' };
    }
    if (query?.country) {
      where.country = { contains: query.country, mode: 'insensitive' };
    }
    if (query?.category) {
      where.category = query.category;
    }
    if (query?.propertyType) {
      where.propertyType = query.propertyType;
    }
    if (query?.minPrice !== undefined || query?.maxPrice !== undefined) {
      where.basePrice = {};
      if (query?.minPrice !== undefined) where.basePrice.gte = Number(query.minPrice);
      if (query?.maxPrice !== undefined) where.basePrice.lte = Number(query.maxPrice);
    }
    if (query?.maxGuests !== undefined) {
      where.maxGuests = { gte: Number(query.maxGuests) };
    }

    // Bounding Box Map Search
    if (query?.minLat !== undefined && query?.maxLat !== undefined) {
      where.latitude = { gte: Number(query.minLat), lte: Number(query.maxLat) };
    }
    if (query?.minLng !== undefined && query?.maxLng !== undefined) {
      where.longitude = { gte: Number(query.minLng), lte: Number(query.maxLng) };
    }

    if (query?.instantBook !== undefined) {
      where.instantBook = Boolean(query.instantBook);
    }

    if (query?.superhostOnly) {
      where.host = { isSuperhost: true };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query?.sortBy === 'price_asc') {
      orderBy = { basePrice: 'asc' };
    } else if (query?.sortBy === 'price_desc') {
      orderBy = { basePrice: 'desc' };
    } else if (query?.sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    return this.prisma.property.findMany({
      where,
      orderBy,
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true, isSuperhost: true },
        },
      },
    });
  }

  /**
   * Host View: Returns all properties belonging to the current host regardless of approval status.
   */
  async findMyProperties(hostId: string) {
    return this.prisma.property.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true, isSuperhost: true },
        },
      },
    });
  }

  /**
   * Admin Workspace View: Returns all properties across all hosts, filterable by status.
   */
  async findAdminProperties(query?: { verificationStatus?: string; status?: string }) {
    const where: any = {};
    if (query?.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }
    if (query?.status) {
      where.status = query.status;
    }

    return this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true, isSuperhost: true },
        },
      },
    });
  }

  async findOne(idOrSlug: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeBookings = await this.prisma.booking.findMany({
      where: {
        propertyId: property.id,
        checkOut: { gte: today },
        OR: [
          { status: 'CONFIRMED' },
          { status: 'COMPLETED' },
          {
            status: 'PENDING',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
      },
      orderBy: { checkIn: 'asc' },
    });

    const bookedRanges = activeBookings.map((b) => {
      const inDate = b.checkIn instanceof Date ? b.checkIn : new Date(b.checkIn);
      const outDate = b.checkOut instanceof Date ? b.checkOut : new Date(b.checkOut);
      const inStr = inDate.toISOString().split('T')[0];
      const outStr = outDate.toISOString().split('T')[0];
      return { checkIn: inStr, checkOut: outStr };
    });

    return {
      ...property,
      bookedRanges,
    };
  }

  /**
   * Admin Action: Approve property for public viewing.
   */
  async approve(id: string) {
    const existing = await this.prisma.property.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED',
        status: 'PUBLISHED',
        verificationNote: 'Approved by Admin',
        rejectionReason: null,
      },
    });
  }

  /**
   * Admin Action: Reject property with reason.
   */
  async reject(id: string, rejectionReason?: string) {
    const existing = await this.prisma.property.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        verificationStatus: 'REJECTED',
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Property does not meet platform criteria',
      },
    });
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    dto: UpdatePropertyDto,
  ) {
    const existing = await this.prisma.property.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    // Host owner or ADMIN can update
    if (existing.hostId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to modify this property',
      );
    }

    // If a Host updates their property, send back for Admin re-approval unless Admin updated it
    const updateData: any = { ...dto };
    if (userRole !== UserRole.ADMIN) {
      updateData.verificationStatus = 'PENDING';
      updateData.status = 'PENDING_APPROVAL';
    }

                                           
    return this.prisma.property.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const existing = await this.prisma.property.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    if (existing.hostId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this property',
      );
    }

    await this.prisma.property.delete({ where: { id } });

    return { message: 'Property deleted successfully' };
  }
}
