import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class CoHostService {
  constructor(private prisma: PrismaService) {}

  // HOST DELEGATION MANAGEMENT

  async inviteCoHost(
    hostId: string,
    workspaceId: string,
    dto: {
      email: string;
      name?: string;         // Optional: display name the host provides for the invitee
      mobileNo?: string;     // Optional: mobile number the host provides for the invitee
      permissions?: {
        canManageListing?: boolean;
        canViewFinances?: boolean;
        canManageBookings?: boolean;
        canManageCalendar?: boolean;
        canManageMaintenance?: boolean;
        canMessageGuests?: boolean;
      };
    },
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.hostId !== hostId) {
      throw new ForbiddenException('Only the workspace host can invite co-hosts');
    }

    const inviteeEmail = dto.email.toLowerCase().trim();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const defaultPermissions = {
      canManageListing: dto.permissions?.canManageListing ?? true,
      canViewFinances: dto.permissions?.canViewFinances ?? false,
      canManageBookings: dto.permissions?.canManageBookings ?? true,
      canManageCalendar: dto.permissions?.canManageCalendar ?? true,
      canManageMaintenance: dto.permissions?.canManageMaintenance ?? true,
      canMessageGuests: dto.permissions?.canMessageGuests ?? true,
    };

    let targetUser = await this.prisma.user.findUnique({
      where: { email: inviteeEmail },
    });

    let tempPassword: string | null = null;
    let isNewUser = false;

    // Case B: Auto-Provisioning a Brand New Co-Host (FairBnb Architecture)
    if (!targetUser) {
      isNewUser = true;
      tempPassword = crypto.randomBytes(4).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Auto-create User account with role 'HOST' so they have portal privileges
      targetUser = await this.prisma.user.create({
        data: {
          name: inviteeEmail.split('@')[0],
          email: inviteeEmail,
          passwordHash,
          role: Role.HOST,
        },
      });
    }

    // Resolve contact details: DTO fields take priority → fall back to User record
    const resolvedName    = dto.name     || targetUser?.name    || inviteeEmail.split('@')[0];
    const resolvedMobile  = dto.mobileNo || targetUser?.phone   || null;
    const resolvedEmail   = inviteeEmail;

    const invitation = await this.prisma.cohostInvitation.create({
      data: {
        workspaceId,
        hostId,
        inviteeEmail:    resolvedEmail,
        inviteeName:     resolvedName,
        inviteeMobileNo: resolvedMobile,
        token,
        permissions: defaultPermissions,
        expiresAt,
        status: isNewUser ? 'ACCEPTED' : 'PENDING',
      },
    });

    // If auto-provisioned, immediately activate the co-host relationship
    if (isNewUser && targetUser) {
      await this.prisma.cohostPermission.upsert({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: targetUser.id,
          },
        },
        update: {
          ...defaultPermissions,
          name:     resolvedName,
          email:    resolvedEmail,
          mobileNo: resolvedMobile,
        },
        create: {
          workspaceId,
          userId: targetUser.id,
          ...defaultPermissions,
          name:     resolvedName,
          email:    resolvedEmail,
          mobileNo: resolvedMobile,
        },
      });
    }

    return {
      message: isNewUser
        ? 'Brand new co-host auto-provisioned with HOST role and active permissions'
        : 'Co-host invitation created successfully for existing user',
      isNewUser,
      userRole: targetUser.role,
      tempPassword: tempPassword || undefined,
      invitation: {
        id:              invitation.id,
        inviteeEmail:    invitation.inviteeEmail,
        inviteeName:     invitation.inviteeName,
        inviteeMobileNo: invitation.inviteeMobileNo,
        token:           invitation.token,
        status:          invitation.status,
        permissions:     invitation.permissions,
        expiresAt:       invitation.expiresAt,
      },
    };
  }

  async getWorkspaceCoHosts(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const cohosts = await this.prisma.cohostPermission.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      },
    });

    const pendingInvitations = await this.prisma.cohostInvitation.findMany({
      where: { workspaceId, status: 'PENDING' },
      select: { id: true, inviteeEmail: true, permissions: true, expiresAt: true, token: true },
    });

    return {
      workspaceId,
      cohosts,
      pendingInvitations,
    };
  }

  async updatePermissions(
    permissionId: string,
    hostId: string,
    dto: {
      canManageListing?: boolean;
      canViewFinances?: boolean;
      canManageBookings?: boolean;
      canManageCalendar?: boolean;
      canManageMaintenance?: boolean;
      canMessageGuests?: boolean;
    },
  ) {
    const existing = await this.prisma.cohostPermission.findUnique({
      where: { id: permissionId },
      include: { workspace: true },
    });
    if (!existing) throw new NotFoundException('Co-host permission not found');
    if (existing.workspace.hostId !== hostId) {
      throw new ForbiddenException('Only the workspace host can modify co-host permissions');
    }

    return this.prisma.cohostPermission.update({
      where: { id: permissionId },
      data: {
        ...(dto.canManageListing !== undefined && { canManageListing: dto.canManageListing }),
        ...(dto.canViewFinances !== undefined && { canViewFinances: dto.canViewFinances }),
        ...(dto.canManageBookings !== undefined && { canManageBookings: dto.canManageBookings }),
        ...(dto.canManageCalendar !== undefined && { canManageCalendar: dto.canManageCalendar }),
        ...(dto.canManageMaintenance !== undefined && { canManageMaintenance: dto.canManageMaintenance }),
        ...(dto.canMessageGuests !== undefined && { canMessageGuests: dto.canMessageGuests }),
      },
    });
  }

  async removeCoHost(permissionId: string, hostId: string) {
    const existing = await this.prisma.cohostPermission.findUnique({
      where: { id: permissionId },
      include: { workspace: true },
    });
    if (!existing) throw new NotFoundException('Co-host permission not found');
    if (existing.workspace.hostId !== hostId) {
      throw new ForbiddenException('Only the workspace host can remove a co-host');
    }

    await this.prisma.cohostPermission.delete({
      where: { id: permissionId },
    });

    return { message: 'Co-host removed successfully' };
  }

  // INVITATIONS CONSUMPTION

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.cohostInvitation.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true, city: true, address: true } },
        host: { select: { id: true, name: true, email: true } },
      },
    });
    if (!invitation) throw new NotFoundException('Invitation not found or invalid token');
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}`);
    }
    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.getInvitationByToken(token);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const perms = (invitation.permissions as any) || {};

    // Sync contact details from User record into CohostPermission for direct lookups
    const permission = await this.prisma.cohostPermission.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
      update: {
        // Contact details — always sync from the actual User record on accept
        name:     user.name    || (invitation as any).inviteeName    || null,
        email:    user.email   || invitation.inviteeEmail,
        mobileNo: user.phone   || (invitation as any).inviteeMobileNo || null,
        // Permission flags from invitation
        canManageListing:     perms.canManageListing     ?? true,
        canViewFinances:      perms.canViewFinances      ?? false,
        canManageBookings:    perms.canManageBookings    ?? true,
        canManageCalendar:    perms.canManageCalendar    ?? true,
        canManageMaintenance: perms.canManageMaintenance ?? true,
        canMessageGuests:     perms.canMessageGuests     ?? true,
      },
      create: {
        workspaceId: invitation.workspaceId,
        userId,
        // Contact details stored alongside permissions for fast queries
        name:     user.name    || (invitation as any).inviteeName    || null,
        email:    user.email   || invitation.inviteeEmail,
        mobileNo: user.phone   || (invitation as any).inviteeMobileNo || null,
        // Permission flags
        canManageListing:     perms.canManageListing     ?? true,
        canViewFinances:      perms.canViewFinances      ?? false,
        canManageBookings:    perms.canManageBookings    ?? true,
        canManageCalendar:    perms.canManageCalendar    ?? true,
        canManageMaintenance: perms.canManageMaintenance ?? true,
        canMessageGuests:     perms.canMessageGuests     ?? true,
      },
    });

    await this.prisma.cohostInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    return {
      message: `Invitation accepted. You are now a co-host of ${(invitation.workspace as any)?.name || 'the workspace'}.`,
      permission,
    };
  }

  async declineInvitation(token: string, userId: string) {
    const invitation = await this.getInvitationByToken(token);
    await this.prisma.cohostInvitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' },
    });
    return { message: 'Invitation declined' };
  }

  // CO-HOST DELEGATED VIEWS

  async getMyCoHostWorkspaces(userId: string) {
    return this.prisma.cohostPermission.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            host: { select: { id: true, name: true, email: true } },
            buildings: {
              include: {
                floors: {
                  include: {
                    zones: {
                      include: {
                        units: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getCoHostDashboard(workspaceId: string, userId: string) {
    const permission = await this.prisma.cohostPermission.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!permission) {
      throw new ForbiddenException('You do not co-host this workspace');
    }

    const bookingsCount = await this.prisma.booking.count({
      where: { workspaceId },
    });

    const activeBookings = await this.prisma.booking.count({
      where: { workspaceId, status: 'ACTIVE' },
    });

    return {
      workspace: permission.workspace,
      permissions: {
        canManageListing: permission.canManageListing,
        canViewFinances: permission.canViewFinances,
        canManageBookings: permission.canManageBookings,
        canManageCalendar: permission.canManageCalendar,
        canManageMaintenance: permission.canManageMaintenance,
        canMessageGuests: permission.canMessageGuests,
      },
      stats: {
        totalBookings: bookingsCount,
        activeBookings,
      },
    };
  }

  async getCoHostBookings(workspaceId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        unit: { select: { id: true, name: true, unitType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return bookings.map((b) => ({
      ...b,
      totalAmountPaise: b.totalAmountPaise.toString(),
    }));
  }
}
