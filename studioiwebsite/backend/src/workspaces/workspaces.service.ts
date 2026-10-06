import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { city?: string; isFeatured?: boolean }) {
    const where: any = { isPublished: true };
    if (query?.city) {
      where.city = { equals: query.city, mode: 'insensitive' };
    }
    if (query?.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    return this.prisma.workspace.findMany({
      where,
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        bookingPlans: { where: { isActive: true } },
        buildings: {
          include: {
            floors: {
              include: {
                units: { where: { status: 'ACTIVE' } },
              },
            },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
    });
  }

  async findBySlug(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        bookingPlans: { where: { isActive: true } },
        buildings: {
          include: {
            floors: {
              include: {
                units: { where: { status: 'ACTIVE' } },
                zones: true,
                layoutVersions: { where: { isLive: true }, take: 1 },
              },
            },
          },
        },
        reviews: {
          where: { isPublished: true },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace not found for slug: ${slug}`);
    }

    return workspace;
  }

  async getFeatured() {
    return this.findAll({ isFeatured: true });
  }

  async getFloorAvailability(floorId: string, startDateTime: string, endDateTime: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        units: {
          where: { status: 'ACTIVE' },
          include: {
            bookings: {
              where: {
                status: { in: ['CONFIRMED', 'ACTIVE'] },
                startDateTime: { lt: new Date(endDateTime) },
                endDateTime: { gt: new Date(startDateTime) },
              },
            },
            holds: {
              where: {
                status: 'ACTIVE',
                expiresAt: { gt: new Date() },
                startDateTime: { lt: new Date(endDateTime) },
                endDateTime: { gt: new Date(startDateTime) },
              },
            },
          },
        },
        layoutVersions: { where: { isLive: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!floor) {
      throw new NotFoundException(`Floor not found for id: ${floorId}`);
    }

    const unitsWithContext = floor.units.map((unit) => {
      const isBooked = unit.bookings.length > 0;
      const isHeld = unit.holds.length > 0;

      let contextualStatus = 'AVAILABLE';
      if (isBooked) contextualStatus = 'BOOKED';
      else if (isHeld) contextualStatus = 'HELD';

      return {
        id: unit.id,
        unitCode: unit.unitCode,
        name: unit.name,
        unitType: unit.unitType,
        capacity: unit.capacity,
        status: contextualStatus,
        x: unit.x,
        y: unit.y,
        width: unit.width,
        height: unit.height,
        rotation: unit.rotation,
        chairSide: unit.chairSide,
      };
    });

    return {
      floorId: floor.id,
      floorName: floor.name,
      schedule: { start: startDateTime, end: endDateTime },
      activeLayout: floor.layoutVersions[0] || null,
      units: unitsWithContext,
    };
  }
}
