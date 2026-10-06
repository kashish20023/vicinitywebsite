import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuditLogService } from '../audit-logs/audit-logs.service.js';
import { InviteCoHostDto } from './dto/invite-cohost.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { PayoutSettingsDto } from './dto/payout-settings.dto.js';
import {
  PERMISSION_PRESETS,
  ALL_ALLOWED_PERMISSIONS,
} from './enums/co-host-presets.js';
import { CoHostPermissionEnum, CoHostStatus, CoHostInvitationStatus, PayoutRuleStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CoHostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
  ) { }

  // INVITATIONS

  async inviteCoHost(
    hostUserId: string,
    propertyId: string,
    dto: InviteCoHostDto,
  ) {
    // 1. Verify property ownership
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.hostId !== hostUserId) {
      throw new ForbiddenException(
        'Access denied: Only the property owner can invite co-hosts',
      );
    }

    // 2. Resolve requested permissions
    let permissionsToGrant: CoHostPermissionEnum[] = [];
    if (dto.permissionLevel && PERMISSION_PRESETS[dto.permissionLevel]) {
      permissionsToGrant = PERMISSION_PRESETS[dto.permissionLevel];
    } else if (dto.permissions && dto.permissions.length > 0) {
      // Validate every requested permission is platform-allowed
      const invalid = dto.permissions.filter(
        (p) => !ALL_ALLOWED_PERMISSIONS.includes(p),
      );
      if (invalid.length > 0) {
        throw new BadRequestException(
          `Invalid permission codes: ${invalid.join(', ')}`,
        );
      }
      permissionsToGrant = dto.permissions;
    } else {
      permissionsToGrant = PERMISSION_PRESETS.FULL_ACCESS;
    }

    // 3. Validate Payout Configuration & India Scope Rule (Max 1 paid Co-Host)
    if (dto.payoutConfig) {
      await this.validateMaxOnePaidCoHostRule(propertyId);
    }

    // 4. Generate secure invitation token and token hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.coHostInvitation.create({
      data: {
        propertyId,
        invitedById: hostUserId,
        email: dto.email || null,
        phone: dto.phone || null,
        tokenHash,
        requestedPermissions: permissionsToGrant,
        permissionLevel: dto.permissionLevel || 'CUSTOM',
        payoutConfig: dto.payoutConfig ? JSON.parse(JSON.stringify(dto.payoutConfig)) : undefined,
        status: CoHostInvitationStatus.PENDING,
        expiresAt,
      },
      include: {
        property: {
          select: { id: true, title: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 5. Notify invited user if account already exists
    let targetUser: any = null;
    if (dto.email) {
      targetUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    } else if (dto.phone) {
      targetUser = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
    }

    let generatedPassword: string | null = null;

    if (targetUser) {
      await this.notificationsService.createNotification({
        userId: targetUser.id,
        title: 'Co-Host Invitation',
        message: `${invitation.invitedBy.name} invited you to co-host "${property.title}"`,
        type: 'SYSTEM',
        metadata: {
          invitationId: invitation.id,
          propertyId,
          rawToken,
        },
      });
    } else {
      // Auto-provision new user account
      const newPassword = crypto.randomBytes(4).toString('hex'); // 8 char random string
      generatedPassword = newPassword;
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      const phoneNum = dto.phone || `+00${Date.now()}`;

      targetUser = await this.prisma.user.create({
        data: {
          name: dto.email ? dto.email.split('@')[0] : (dto.phone || 'New Co-Host'),
          email: dto.email || null,
          phone: phoneNum,
          passwordHash,
          role: 'HOST',
        },
      });

      // Auto-accept the invitation for the newly provisioned user
      await this.acceptInvitation(rawToken, targetUser.id);
    }

    // 6. Create Audit Log
    await this.auditLogService.logAction({
      actorId: hostUserId,
      actorRole: 'HOST',
      action: 'COHOST_INVITED',
      entityType: 'CoHostInvitation',
      entityId: invitation.id,
      details: {
        propertyId,
        email: dto.email,
        phone: dto.phone,
        permissionLevel: dto.permissionLevel,
      },
    });

    return {
      invitation,
      inviteToken: rawToken, // Returned so Host can share invitation link directly
      generatedPassword, // Returned ONLY if a new account was auto-provisioned
    };
  }

  async getInvitationByToken(token: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const invitation = await this.prisma.coHostInvitation.findUnique({
      where: { tokenHash },
      include: {
        property: {
          select: { id: true, title: true, city: true, images: true, coverImage: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    if (invitation.status !== CoHostInvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation is no longer valid (Status: ${invitation.status})`,
      );
    }

    if (new Date() > invitation.expiresAt) {
      await this.prisma.coHostInvitation.update({
        where: { id: invitation.id },
        data: { status: CoHostInvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.getInvitationByToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Security Check: Target Invitee Email/Phone Verification
    if (
      invitation.email &&
      (!user.email || user.email.toLowerCase() !== invitation.email.toLowerCase())
    ) {
      throw new ForbiddenException(
        'Access denied: This invitation was sent to a different email address',
      );
    }
    if (invitation.phone && user.phone !== invitation.phone) {
      throw new ForbiddenException(
        'Access denied: This invitation was sent to a different phone number',
      );
    }

    // Check duplicate relationship
    const existingRel = await this.prisma.coHostRelationship.findUnique({
      where: {
        propertyId_coHostUserId: {
          propertyId: invitation.propertyId,
          coHostUserId: userId,
        },
      },
    });

    if (existingRel && existingRel.status === CoHostStatus.ACTIVE) {
      throw new BadRequestException(
        'You are already an active co-host for this property',
      );
    }

    // Set active status upon accepting invitation
    const initialStatus: CoHostStatus = CoHostStatus.ACTIVE;

    const now = new Date();

    // Create or update CoHostRelationship
    const coHostRel = await this.prisma.coHostRelationship.upsert({
      where: {
        propertyId_coHostUserId: {
          propertyId: invitation.propertyId,
          coHostUserId: userId,
        },
      },
      create: {
        propertyId: invitation.propertyId,
        hostUserId: invitation.invitedById,
        coHostUserId: userId,
        status: initialStatus,
        permissionLevel: invitation.permissionLevel,
        invitedAt: invitation.createdAt,
        acceptedAt: now,
        verifiedAt: initialStatus === CoHostStatus.ACTIVE ? now : null,
      },
      update: {
        hostUserId: invitation.invitedById,
        status: initialStatus,
        permissionLevel: invitation.permissionLevel,
        acceptedAt: now,
        verifiedAt: initialStatus === CoHostStatus.ACTIVE ? now : null,
      },
    });

    // Replace permissions
    await this.prisma.coHostPermission.deleteMany({
      where: { coHostRelationshipId: coHostRel.id },
    });

    if (
      invitation.requestedPermissions &&
      invitation.requestedPermissions.length > 0
    ) {
      await this.prisma.coHostPermission.createMany({
        data: invitation.requestedPermissions.map((perm) => ({
          coHostRelationshipId: coHostRel.id,
          permission: perm,
        })),
      });
    }

    // If Payout config was included in invitation, create PayoutRule
    if (invitation.payoutConfig) {
      const pConfig = invitation.payoutConfig as any;
      await this.prisma.payoutRule.create({
        data: {
          propertyId: invitation.propertyId,
          recipientUserId: userId,
          coHostRelationshipId: coHostRel.id,
          type: pConfig.type,
          percentage: pConfig.percentage ? parseFloat(pConfig.percentage) : null,
          fixedAmount: pConfig.fixedAmount ? parseFloat(pConfig.fixedAmount) : null,
          status: PayoutRuleStatus.PENDING_CONFIRMATION,
        },
      });
    }

    // Update Invitation record status
    await this.prisma.coHostInvitation.update({
      where: { id: invitation.id },
      data: {
        status: CoHostInvitationStatus.ACCEPTED,
        acceptedAt: now,
      },
    });

    // Audit Log
    await this.auditLogService.logAction({
      actorId: userId,
      actorRole: user.role,
      action: 'COHOST_ACCEPTED',
      entityType: 'CoHostRelationship',
      entityId: coHostRel.id,
      details: {
        propertyId: invitation.propertyId,
        status: initialStatus,
      },
    });

    // Notify Host
    await this.notificationsService.createNotification({
      userId: invitation.invitedById,
      title: 'Co-Host Invitation Accepted',
      message: `${user.name} accepted your co-host invitation for property.`,
      type: 'SYSTEM',
      metadata: {
        coHostRelationshipId: coHostRel.id,
        propertyId: invitation.propertyId,
        coHostUserId: userId,
      },
    });

    return this.getCoHostById(coHostRel.id);
  }

  async declineInvitation(token: string, userId?: string) {
    const invitation = await this.getInvitationByToken(token);
    const now = new Date();

    await this.prisma.coHostInvitation.update({
      where: { id: invitation.id },
      data: {
        status: CoHostInvitationStatus.DECLINED,
        declinedAt: now,
      },
    });

    await this.auditLogService.logAction({
      actorId: userId || invitation.invitedById,
      actorRole: 'USER',
      action: 'COHOST_DECLINED',
      entityType: 'CoHostInvitation',
      entityId: invitation.id,
      details: {
        propertyId: invitation.propertyId,
      },
    });

    await this.notificationsService.createNotification({
      userId: invitation.invitedById,
      title: 'Co-Host Invitation Declined',
      message: `An invitation for your property was declined.`,
      type: 'SYSTEM',
      metadata: {
        invitationId: invitation.id,
        propertyId: invitation.propertyId,
      },
    });

    return { message: 'Invitation declined successfully' };
  }

  async revokeInvitation(invitationId: string, hostUserId: string) {
    const invitation = await this.prisma.coHostInvitation.findUnique({
      where: { id: invitationId },
      include: { property: true }
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.invitedById !== hostUserId && invitation.property.hostId !== hostUserId) {
      throw new ForbiddenException('Only property owner or inviter can revoke this invitation');
    }

    await this.prisma.coHostInvitation.delete({
      where: { id: invitationId }
    });

    return { message: 'Invitation revoked successfully' };
  }

  async getSentInvitations(hostUserId: string) {
    return this.prisma.coHostInvitation.findMany({
      where: { invitedById: hostUserId },
      include: {
        property: {
          select: { id: true, title: true, coverImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // CO-HOST RELATIONSHIP MANAGEMENT

  async getPropertyCoHosts(propertyId: string) {
    const relationships = await this.prisma.coHostRelationship.findMany({
      where: {
        propertyId,
        status: { not: CoHostStatus.REMOVED },
      },
      include: {
        coHostUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            kycStatus: true,
          },
        },
        permissions: true,
        payoutRules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const invitations = await this.prisma.coHostInvitation.findMany({
      where: { propertyId, status: CoHostInvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });

    const mappedInvitations = invitations.map(inv => ({
      id: inv.id,
      isInvitation: true,
      status: 'PENDING_INVITE',
      permissionLevel: inv.permissionLevel,
      permissions: inv.requestedPermissions.map(p => ({ permission: p })),
      payoutRules: inv.payoutConfig ? [inv.payoutConfig] : [],
      coHostUser: {
        name: 'Pending Invite',
        email: inv.email,
        phone: inv.phone,
      }
    }));

    return [...relationships, ...mappedInvitations];
  }

  async getCoHostById(coHostId: string) {
    const coHost = await this.prisma.coHostRelationship.findUnique({
      where: { id: coHostId },
      include: {
        property: {
          select: { id: true, title: true, hostId: true },
        },
        coHostUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            kycStatus: true,
          },
        },
        permissions: true,
        payoutRules: true,
      },
    });

    if (!coHost) {
      throw new NotFoundException('Co-Host relationship not found');
    }

    return coHost;
  }

  async updatePermissions(
    coHostId: string,
    hostUserId: string,
    dto: UpdatePermissionDto,
  ) {
    const coHost = await this.getCoHostById(coHostId);

    // Verify host authority
    if (coHost.property.hostId !== hostUserId && coHost.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only property owner can update permissions');
    }

    let newPermissions: CoHostPermissionEnum[] = [];
    if (dto.permissionLevel && PERMISSION_PRESETS[dto.permissionLevel]) {
      newPermissions = PERMISSION_PRESETS[dto.permissionLevel];
    } else if (dto.permissions && dto.permissions.length > 0) {
      const invalid = dto.permissions.filter(
        (p) => !ALL_ALLOWED_PERMISSIONS.includes(p),
      );
      if (invalid.length > 0) {
        throw new BadRequestException(
          `Invalid permission codes: ${invalid.join(', ')}`,
        );
      }
      newPermissions = dto.permissions;
    } else {
      throw new BadRequestException('Please provide permissionLevel or permissions list');
    }

    // Replace permissions
    await this.prisma.coHostPermission.deleteMany({
      where: { coHostRelationshipId: coHostId },
    });

    await this.prisma.coHostPermission.createMany({
      data: newPermissions.map((p) => ({
        coHostRelationshipId: coHostId,
        permission: p,
      })),
    });

    const updated = await this.prisma.coHostRelationship.update({
      where: { id: coHostId },
      data: {
        permissionLevel: dto.permissionLevel || 'CUSTOM',
      },
      include: {
        permissions: true,
      },
    });

    // Audit log & notification
    await this.auditLogService.logAction({
      actorId: hostUserId,
      actorRole: 'HOST',
      action: 'PERMISSION_UPDATED',
      entityType: 'CoHostRelationship',
      entityId: coHostId,
      details: {
        permissionLevel: updated.permissionLevel,
        permissionCount: newPermissions.length,
      },
    });

    await this.notificationsService.createNotification({
      userId: coHost.coHostUserId,
      title: 'Co-Host Permissions Updated',
      message: `Your co-host permissions for property "${coHost.property.title}" have been updated.`,
      type: 'SYSTEM',
      metadata: {
        propertyId: coHost.propertyId,
        coHostId,
      },
    });

    return updated;
  }

  async configurePayoutRule(
    coHostId: string,
    hostUserId: string,
    dto: PayoutSettingsDto,
  ) {
    const coHost = await this.getCoHostById(coHostId);

    if (coHost.property.hostId !== hostUserId && coHost.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only property owner can configure payout settings');
    }

    // Enforce India Rule: Max 1 paid co-host per listing
    await this.validateMaxOnePaidCoHostRule(coHost.propertyId, coHostId);

    // Upsert Payout Rule with consistent Property row locking
    const { rule, isUpdate } = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Property" WHERE "id" = ${coHost.propertyId} FOR UPDATE;`;

      const existingRule = await tx.payoutRule.findFirst({
        where: {
          coHostRelationshipId: coHostId,
        },
      });

      if (existingRule) {
        const updatedRule = await tx.payoutRule.update({
          where: { id: existingRule.id },
          data: {
            type: dto.type,
            percentage: dto.percentage !== undefined ? dto.percentage : null,
            fixedAmount: dto.fixedAmount !== undefined ? dto.fixedAmount : null,
            status: PayoutRuleStatus.PENDING_CONFIRMATION,
          },
        });
        return { rule: updatedRule, isUpdate: true };
      } else {
        const createdRule = await tx.payoutRule.create({
          data: {
            propertyId: coHost.propertyId,
            recipientUserId: coHost.coHostUserId,
            coHostRelationshipId: coHostId,
            type: dto.type,
            percentage: dto.percentage !== undefined ? dto.percentage : null,
            fixedAmount: dto.fixedAmount !== undefined ? dto.fixedAmount : null,
            status: PayoutRuleStatus.PENDING_CONFIRMATION,
          },
        });
        return { rule: createdRule, isUpdate: false };
      }
    });

    await this.auditLogService.logAction({
      actorId: hostUserId,
      actorRole: 'HOST',
      action: isUpdate ? 'PAYOUT_RULE_UPDATED' : 'PAYOUT_RULE_CREATED',
      entityType: 'PayoutRule',
      entityId: rule.id,
      details: {
        propertyId: coHost.propertyId,
        type: dto.type,
        percentage: dto.percentage,
        fixedAmount: dto.fixedAmount,
      },
    });

    await this.notificationsService.createNotification({
      userId: coHost.coHostUserId,
      title: 'Co-Host Payout Rule Proposed',
      message: `A new payout rule was configured for property "${coHost.property.title}". Please confirm it.`,
      type: 'SYSTEM',
      metadata: {
        payoutRuleId: rule.id,
        propertyId: coHost.propertyId,
      },
    });

    return rule;
  }

  async confirmPayoutRule(ruleId: string, coHostUserId: string) {
    const rule = await this.prisma.payoutRule.findUnique({
      where: { id: ruleId },
      include: {
        property: { select: { id: true, title: true, hostId: true } },
      },
    });

    if (!rule) {
      throw new NotFoundException('Payout rule not found');
    }

    if (rule.recipientUserId !== coHostUserId) {
      throw new ForbiddenException(
        'Only the specified recipient can confirm this payout rule',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Property" WHERE "id" = ${rule.propertyId} FOR UPDATE;`;

      return tx.payoutRule.update({
        where: { id: ruleId },
        data: {
          status: PayoutRuleStatus.ACTIVE,
        },
      });
    });

    await this.auditLogService.logAction({
      actorId: coHostUserId,
      actorRole: 'USER',
      action: 'PAYOUT_RULE_CONFIRMED',
      entityType: 'PayoutRule',
      entityId: ruleId,
      details: {
        propertyId: rule.propertyId,
      },
    });

    await this.notificationsService.createNotification({
      userId: rule.property.hostId,
      title: 'Co-Host Payout Rule Confirmed',
      message: `The co-host payout arrangement for "${rule.property.title}" has been confirmed.`,
      type: 'SYSTEM',
      metadata: {
        payoutRuleId: ruleId,
        propertyId: rule.propertyId,
      },
    });

    return updated;
  }

  async suspendCoHost(coHostId: string, hostUserId: string) {
    const coHost = await this.getCoHostById(coHostId);

    if (coHost.property.hostId !== hostUserId && coHost.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only property owner can suspend a co-host');
    }

    const updated = await this.prisma.coHostRelationship.update({
      where: { id: coHostId },
      data: {
        status: CoHostStatus.SUSPENDED,
        suspendedAt: new Date(),
      },
    });

    await this.auditLogService.logAction({
      actorId: hostUserId,
      actorRole: 'HOST',
      action: 'COHOST_SUSPENDED',
      entityType: 'CoHostRelationship',
      entityId: coHostId,
      details: { propertyId: coHost.propertyId },
    });

    await this.notificationsService.createNotification({
      userId: coHost.coHostUserId,
      title: 'Co-Host Access Suspended',
      message: `Your co-host access for "${coHost.property.title}" has been suspended.`,
      type: 'SYSTEM',
      metadata: { propertyId: coHost.propertyId },
    });

    return updated;
  }

  async reactivateCoHost(coHostId: string, hostUserId: string) {
    const coHost = await this.getCoHostById(coHostId);

    if (coHost.property.hostId !== hostUserId && coHost.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only property owner can reactivate a co-host');
    }

    const updated = await this.prisma.coHostRelationship.update({
      where: { id: coHostId },
      data: {
        status: CoHostStatus.ACTIVE,
        suspendedAt: null,
      },
    });

    await this.auditLogService.logAction({
      actorId: hostUserId,
      actorRole: 'HOST',
      action: 'COHOST_REACTIVATED',
      entityType: 'CoHostRelationship',
      entityId: coHostId,
      details: { propertyId: coHost.propertyId },
    });

    await this.notificationsService.createNotification({
      userId: coHost.coHostUserId,
      title: 'Co-Host Access Reactivated',
      message: `Your co-host access for "${coHost.property.title}" has been reactivated.`,
      type: 'SYSTEM',
      metadata: { propertyId: coHost.propertyId },
    });

    return updated;
  }

  async removeCoHost(coHostId: string, hostUserId: string) {
    const coHost = await this.getCoHostById(coHostId);

    if (coHost.property.hostId !== hostUserId && coHost.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only property owner can remove a co-host');
    }

    // Revoke relationship (Set status to REMOVED) and deactivate payout rules under Property row lock
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Property" WHERE "id" = ${coHost.propertyId} FOR UPDATE;`;

      await tx.coHostRelationship.update({
        where: { id: coHostId },
        data: {
          status: CoHostStatus.REMOVED,
          removedAt: new Date(),
        },
      });

      await tx.payoutRule.updateMany({
        where: { coHostRelationshipId: coHostId },
        data: { status: PayoutRuleStatus.INACTIVE },
      });
    });

    await this.auditLogService.logAction({
      actorId: hostUserId,
      actorRole: 'HOST',
      action: 'COHOST_REMOVED',
      entityType: 'CoHostRelationship',
      entityId: coHostId,
      details: { propertyId: coHost.propertyId },
    });

    await this.notificationsService.createNotification({
      userId: coHost.coHostUserId,
      title: 'Co-Host Access Removed',
      message: `You have been removed as a co-host for property "${coHost.property.title}". Existing bookings remain unaffected.`,
      type: 'SYSTEM',
      metadata: { propertyId: coHost.propertyId },
    });

    return { message: 'Co-Host removed successfully' };
  }

  // CO-HOST VIEWS & DASHBOARD

  async getCoHostProperties(userId: string, page?: number, limit?: number) {
    const where = {
      coHostUserId: userId,
      status: CoHostStatus.ACTIVE,
    };

    const total = await this.prisma.coHostRelationship.count({ where });

    const isPaginated = page !== undefined && limit !== undefined;
    const take = isPaginated ? limit : undefined;
    const skip = isPaginated ? (page - 1) * limit : undefined;

    const relationships = await this.prisma.coHostRelationship.findMany({
      where,
      take,
      skip,
      include: {
        property: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
            bookings: {
              include: {
                guest: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { checkIn: 'asc' },
            },
          },
        },
        hostUser: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        permissions: true,
        payoutRules: {
          where: { status: PayoutRuleStatus.ACTIVE },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = relationships.map((rel) => ({
      relationshipId: rel.id,
      permissionLevel: rel.permissionLevel,
      permissions: rel.permissions.map((p) => p.permission),
      payoutRule: rel.payoutRules[0] || null,
      hostUser: rel.hostUser || rel.property.host,
      property: rel.property,
    }));

    if (isPaginated) {
      return {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return items;
  }

  async getCoHostDashboard(propertyId: string, userId: string) {
    const rel = await this.prisma.coHostRelationship.findUnique({
      where: {
        propertyId_coHostUserId: { propertyId, coHostUserId: userId },
      },
      include: {
        permissions: true,
        property: true,
      },
    });

    if (!rel || rel.status !== CoHostStatus.ACTIVE) {
      throw new ForbiddenException('Active co-host relationship required');
    }

    const permissions = new Set(rel.permissions.map((p) => p.permission));

    const result: any = {
      property: rel.property,
      permissionLevel: rel.permissionLevel,
      grantedPermissions: Array.from(permissions),
    };

    if (permissions.has(CoHostPermissionEnum.VIEW_BOOKINGS)) {
      result.recentBookings = await this.prisma.booking.findMany({
        where: { propertyId },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      result.totalBookingsCount = await this.prisma.booking.count({
        where: { propertyId },
      });
    }

    if (permissions.has(CoHostPermissionEnum.MANAGE_MAINTENANCE)) {
      result.pendingMaintenance = await this.prisma.maintenanceRequest.findMany({
        where: { propertyId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (permissions.has(CoHostPermissionEnum.VIEW_REVIEWS)) {
      result.recentReviews = await this.prisma.review.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    }

    return result;
  }

  // HELPER RULES & LEDGER

  private async validateMaxOnePaidCoHostRule(
    propertyId: string,
    currentCoHostId?: string,
  ) {
    const activePaidRules = await this.prisma.payoutRule.findMany({
      where: {
        propertyId,
        status: { in: [PayoutRuleStatus.ACTIVE, PayoutRuleStatus.PENDING_CONFIRMATION] },
        coHostRelationshipId: currentCoHostId
          ? { not: currentCoHostId }
          : { not: null },
      },
    });

    if (activePaidRules.length >= 1) {
      throw new BadRequestException(
        'India scope business rule: Maximum 1 paid Co-Host is allowed per property listing.',
      );
    }
  }

  async recordFinancialTransaction(data: {
    bookingId?: string;
    propertyId?: string;
    type: string;
    amount: number;
    currency?: string;
    recipientId?: string;
    metadata?: any;
  }) {
    return this.prisma.financialTransaction.create({
      data: {
        bookingId: data.bookingId || null,
        propertyId: data.propertyId || null,
        type: data.type,
        amount: data.amount,
        currency: data.currency || 'INR',
        recipientId: data.recipientId || null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }

  async getCoHostPropertyBookings(propertyId: string) {
    return this.prisma.booking.findMany({
      where: { propertyId },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
