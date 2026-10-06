import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { COHOST_PERMISSION_KEY } from '../decorators/co-host-permission.decorator';

@Injectable()
export class CohostPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      COHOST_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admins have universal access
    if (user.role === Role.ADMIN) {
      return true;
    }

    const workspaceId =
      request.params.workspaceId ||
      request.body?.workspaceId ||
      request.query?.workspaceId;

    if (!workspaceId) {
      return true; // No workspace context to guard
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, hostId: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Direct Host owner has full access
    if (workspace.hostId === user.id) {
      return true;
    }

    // Check delegated Co-host permission
    const permission = await this.prisma.cohostPermission.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!permission) {
      throw new ForbiddenException('Access denied: You have no co-host delegation for this workspace');
    }

    if (requiredPermission) {
      const hasSpecific = (permission as any)[requiredPermission];
      if (!hasSpecific) {
        throw new ForbiddenException(
          `Access denied: Missing delegated permission '${requiredPermission}' for this workspace`,
        );
      }
    }

    return true;
  }
}
