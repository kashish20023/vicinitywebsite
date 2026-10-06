import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CoHostPermissionEnum } from '@prisma/client';

export interface PublicListingContextDto {
  id: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  neighborhoodDescription?: string | null;
  category: string;
  propertyType: string;
  locality?: string | null;
  city: string;
  state: string;
  country: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  basePrice: number;
  cleaningFee: number;
  serviceFeeRate: number;
  taxRate: number;
  minNights: number;
  cancellationPolicy: string;
  houseRules: string[];
  amenities: string[];
  tags: string[];
  coverImage?: string | null;
  images: string[];
  aiKnowledgeBasePublic?: string | null;
}

export interface HostPrivateListingContextDto extends PublicListingContextDto {
  hostId: string;
  aiKnowledgeBasePrivate?: string | null;
  checkInInstructions?: string | null;
  status: string;
  verificationStatus: string;
  actorRole: 'OWNER' | 'COHOST' | 'ADMIN';
  grantedPermissions: string[];
}

@Injectable()
export class ListingContextAdapter {
  private readonly logger = new Logger(ListingContextAdapter.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Safe, sanitized public listing facts.
   * Strictly omits: wifi passwords, private codes, exact street addresses, host KYC and bank accounts.
   */
  async getPublicListingContext(propertyId: string): Promise<PublicListingContextDto> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        amenities: {
          include: {
            amenity: { select: { name: true, category: true } },
          },
        },
      },
    });

    if (!property || property.status !== 'PUBLISHED' || property.verificationStatus !== 'APPROVED') {
      throw new NotFoundException(`Published listing with ID '${propertyId}' was not found.`);
    }

    const amenityNames = (property.amenities || [])
      .map((a) => a.amenity?.name)
      .filter((name): name is string => Boolean(name));

    const tagNames = Array.isArray(property.adminTags) ? property.adminTags : [];

    return {
      id: property.id,
      title: property.title,
      description: property.description,
      shortDescription: property.shortDescription,
      neighborhoodDescription: property.neighborhoodDescription,
      category: property.category,
      propertyType: property.propertyType,
      locality: property.locality,
      city: property.city,
      state: property.state,
      country: property.country,
      maxGuests: property.maxGuests,
      bedrooms: property.bedrooms,
      beds: property.beds,
      bathrooms: property.bathrooms,
      basePrice: property.basePrice,
      cleaningFee: property.cleaningFee,
      serviceFeeRate: property.serviceFeeRate,
      taxRate: property.taxRate,
      minNights: property.minNights,
      cancellationPolicy: property.cancellationPolicy,
      houseRules: Array.isArray(property.houseRules) ? property.houseRules : [],
      amenities: amenityNames,
      tags: tagNames,
      coverImage: property.coverImage,
      images: Array.isArray(property.images) ? property.images : [],
      aiKnowledgeBasePublic: property.aiKnowledgeBasePublic,
    };
  }

  /**
   * Host/Co-host listing context with strict authorization verification.
   * Strips bank details, payout tokens, or unrelated account credentials.
   */
  async getHostPrivateListingContext(
    propertyId: string,
    actorUserId: string,
    actorRole?: string,
    requiredPermission?: CoHostPermissionEnum,
  ): Promise<HostPrivateListingContextDto> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        amenities: {
          include: {
            amenity: { select: { name: true } },
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Listing with ID '${propertyId}' not found.`);
    }

    let resolvedActorRole: 'OWNER' | 'COHOST' | 'ADMIN';
    const grantedPermissions: string[] = [];

    if (!actorUserId && actorRole !== 'ADMIN') {
      throw new ForbiddenException('Access denied: Authentication required.');
    }

    if (actorRole === 'ADMIN') {
      resolvedActorRole = 'ADMIN';
      grantedPermissions.push('ALL');
    } else if (property.hostId === actorUserId || (property.ownerId && property.ownerId === actorUserId)) {
      resolvedActorRole = 'OWNER';
      grantedPermissions.push('ALL');
    } else {
      // Check active co-host relationship
      const coHostRel = await this.prisma.coHostRelationship.findUnique({
        where: {
          propertyId_coHostUserId: {
            propertyId,
            coHostUserId: actorUserId,
          },
        },
        include: {
          permissions: true,
        },
      });

      const activeStatuses = ['ACCEPTED', 'ACTIVE', 'VERIFIED'];
      const isActive =
        coHostRel &&
        activeStatuses.includes(coHostRel.status as any) &&
        !coHostRel.revokedById &&
        !coHostRel.removedAt &&
        !coHostRel.suspendedAt;

      if (!isActive) {
        throw new ForbiddenException(
          'Access denied: You do not have an active host or co-host relationship for this listing.',
        );
      }

      resolvedActorRole = 'COHOST';
      coHostRel.permissions.forEach((p) => grantedPermissions.push(p.permission));

      if (requiredPermission && !grantedPermissions.includes(requiredPermission)) {
        throw new ForbiddenException(
          `Access denied: Co-host lacks required permission '${requiredPermission}'.`,
        );
      }
    }

    const amenityNames = (property.amenities || [])
      .map((a) => a.amenity?.name)
      .filter((name): name is string => Boolean(name));

    const tagNames = Array.isArray(property.adminTags) ? property.adminTags : [];

    return {
      id: property.id,
      title: property.title,
      description: property.description,
      shortDescription: property.shortDescription,
      neighborhoodDescription: property.neighborhoodDescription,
      category: property.category,
      propertyType: property.propertyType,
      locality: property.locality,
      city: property.city,
      state: property.state,
      country: property.country,
      maxGuests: property.maxGuests,
      bedrooms: property.bedrooms,
      beds: property.beds,
      bathrooms: property.bathrooms,
      basePrice: property.basePrice,
      cleaningFee: property.cleaningFee,
      serviceFeeRate: property.serviceFeeRate,
      taxRate: property.taxRate,
      minNights: property.minNights,
      cancellationPolicy: property.cancellationPolicy,
      houseRules: Array.isArray(property.houseRules) ? property.houseRules : [],
      amenities: amenityNames,
      tags: tagNames,
      coverImage: property.coverImage,
      images: Array.isArray(property.images) ? property.images : [],
      aiKnowledgeBasePublic: property.aiKnowledgeBasePublic,
      hostId: property.hostId,
      aiKnowledgeBasePrivate: property.aiKnowledgeBasePrivate,
      checkInInstructions: property.checkInInstructions,
      status: property.status,
      verificationStatus: property.verificationStatus,
      actorRole: resolvedActorRole,
      grantedPermissions,
    };
  }
}
