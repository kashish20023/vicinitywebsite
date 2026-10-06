import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAuditLogDto } from './audit-logs.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        actorId: dto.actorId,
        actorRole: dto.actorRole,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId || null,
        ipAddress: dto.ipAddress || null,
        details: dto.details ? (dto.details as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async getAuditLogs(query: {
    actorId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ? Number(query.limit) : 100,
    });
  }
}
