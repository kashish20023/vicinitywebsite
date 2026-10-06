import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication required for ownership check');
    }

    if (user.role === 'ADMIN' || String(user.role).toUpperCase() === 'ADMIN') {
      return true;
    }

    const params = request.params;
    const propertyId = params.propertyId || params.id;
    const bookingId = params.bookingId;

    if (propertyId && request.url.includes('/properties')) {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { hostId: true, ownerId: true },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      const isOwner = property.hostId === user.id || (property.ownerId && property.ownerId === user.id);

      if (!isOwner) {
        // Check active co-host relationship
        const coHostRel = await this.prisma.coHostRelationship.findUnique({
          where: {
            propertyId_coHostUserId: {
              propertyId,
              coHostUserId: user.id,
            },
          },
        });

        if (!coHostRel || coHostRel.status !== 'ACTIVE') {
          throw new ForbiddenException('Access denied: You do not own this property nor are you an active co-host');
        }
      }
    }

    if (bookingId && request.url.includes('/bookings')) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { propertyId: true, guestId: true, property: { select: { hostId: true, ownerId: true } } },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const isGuest = booking.guestId === user.id;
      const isOwner = booking.property.hostId === user.id || (booking.property.ownerId && booking.property.ownerId === user.id);

      if (!isGuest && !isOwner) {
        const coHostRel = await this.prisma.coHostRelationship.findUnique({
          where: {
            propertyId_coHostUserId: {
              propertyId: booking.propertyId,
              coHostUserId: user.id,
            },
          },
        });

        if (!coHostRel || coHostRel.status !== 'ACTIVE') {
          throw new ForbiddenException('Access denied: You do not have permission for this booking');
        }
      }
    }

    return true;
  }
}
