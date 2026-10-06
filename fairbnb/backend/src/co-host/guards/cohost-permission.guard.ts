import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CoHostPermissionEnum } from '@prisma/client';
import { COHOST_PERMISSIONS_KEY } from '../decorators/co-host-permission.decorator.js';

@Injectable()
export class CoHostPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      CoHostPermissionEnum[]
    >(COHOST_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    if (user.role === 'ADMIN' || String(user.role).toUpperCase() === 'ADMIN') {
      return true;
    }

    const params = request.params;
    const propertyId = params.propertyId || params.id;

    if (!propertyId) {
      // If endpoint is not property-specific, pass to default handling
      return true;
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { hostId: true, ownerId: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Owner check
    if (property.hostId === user.id || (property.ownerId && property.ownerId === user.id)) {
      return true;
    }

    // Co-Host check
    const coHostRel = await this.prisma.coHostRelationship.findUnique({
      where: {
        propertyId_coHostUserId: {
          propertyId,
          coHostUserId: user.id,
        },
      },
      include: {
        permissions: true,
      },
    });

    if (!coHostRel || coHostRel.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Access denied: You are not an active co-host for this property',
      );
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const grantedPermissions = new Set(
      coHostRel.permissions.map((p) => p.permission),
    );

    const hasAllPermissions = requiredPermissions.every((perm) =>
      grantedPermissions.has(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Access denied: Missing required co-host permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
