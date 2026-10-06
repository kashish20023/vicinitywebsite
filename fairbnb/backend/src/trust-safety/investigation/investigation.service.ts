import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InMemoryTrustSafetyRepository } from '../persistence/in-memory-trust-safety.repository.js';
import { TrustSafetyService } from '../trust-safety.service.js';

export interface UserInvestigationView {
  userId: string;
  email: string | null;
  globalRole: string;
  isActive: boolean;
  propertiesOwned: Array<{
    propertyId: string;
    title: string;
    role: 'OWNER';
  }>;
  coHostAssignments: Array<{
    propertyId: string;
    title: string;
    role: 'COHOST';
    status: string;
    permissionLevel?: string;
  }>;
  stats: {
    totalAttempts: number;
    confirmedBreaches: number;
    dismissedCases: number;
    appealedCases: number;
  };
  provenanceNotice: string;
  events: any[];
}

export interface PropertyInvestigationView {
  propertyId: string;
  title: string;
  status: string;
  owner: {
    userId: string;
    email?: string | null;
  };
  coHosts: Array<{
    userId: string;
    status: string;
    permissionLevel?: string;
  }>;
  relatedCases: any[];
  provenanceNotice: string;
  events: any[];
}

@Injectable()
export class InvestigationService {
  private prisma: PrismaClient;

  constructor(private readonly trustSafetyService: TrustSafetyService) {
    this.prisma = new PrismaClient();
  }

  /**
   * Section 7.1: User Profile View with Property Role Resolution & Segregated Stats
   */
  public async getUserProfile(userId: string): Promise<UserInvestigationView> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // 1. Resolve owned properties
    const owned = await this.prisma.property.findMany({
      where: { hostId: userId },
      select: { id: true, title: true },
    });

    // 2. Resolve co-host relationships
    const coHostRels = await this.prisma.coHostRelationship.findMany({
      where: { coHostUserId: userId },
      include: { property: { select: { id: true, title: true } } },
    });

    // 3. Resolve segregated moderation stats from trust-safety repo
    const stats = await this.trustSafetyService.getUserStats(userId);

    // 4. Resolve server-authoritative audit events
    const repo = this.trustSafetyService.getRepository();
    const events = await repo.queryEvents({ actorId: userId, limit: 50 });

    return {
      userId: user.id,
      email: user.email,
      globalRole: user.role,
      isActive: user.isActive,
      propertiesOwned: owned.map(p => ({
        propertyId: p.id,
        title: p.title,
        role: 'OWNER' as const,
      })),
      coHostAssignments: coHostRels.map(c => ({
        propertyId: c.propertyId,
        title: c.property?.title || 'Unknown Property',
        role: 'COHOST' as const,
        status: String(c.status),
        permissionLevel: c.permissionLevel || undefined,
      })),
      stats,
      provenanceNotice: 'History unavailable before 2026-10-01T00:00:00.000Z',
      events,
    };
  }

  /**
   * Section 7.2: Property View with Scoped Casework & Isolation
   */
  public async getPropertyView(propertyId: string): Promise<PropertyInvestigationView> {
    const prop = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        host: { select: { id: true, email: true } },
        coHostRelationships: { select: { coHostUserId: true, status: true, permissionLevel: true } },
      },
    });

    if (!prop) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    // Related cases scoped STRICTLY to this property
    const repo = this.trustSafetyService.getRepository();
    const caseList = await repo.listCases({ propertyId, limit: 50 });

    // Property-scoped audit events
    const events = await repo.queryEvents({ targetEntity: 'PROPERTY', targetId: propertyId, limit: 50 });

    return {
      propertyId: prop.id,
      title: prop.title,
      status: prop.status,
      owner: {
        userId: prop.hostId,
        email: prop.host?.email,
      },
      coHosts: prop.coHostRelationships.map(c => ({
        userId: c.coHostUserId,
        status: String(c.status),
        permissionLevel: c.permissionLevel || undefined,
      })),
      relatedCases: caseList.items,
      provenanceNotice: 'History unavailable before 2026-10-01T00:00:00.000Z',
      events,
    };
  }

  /**
   * Section 7.3: Append-Only Server Timeline Query
   */
  public async getTimeline(filters: {
    targetEntity?: string;
    targetId?: string;
    actorId?: string;
    limit?: number;
  }) {
    const repo = this.trustSafetyService.getRepository();
    const events = await repo.queryEvents(filters);
    return {
      provenanceNotice: 'History unavailable before 2026-10-01T00:00:00.000Z',
      total: events.length,
      events,
    };
  }
}
