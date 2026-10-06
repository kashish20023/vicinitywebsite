import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAutomatedMessageRuleDto } from './automated-messages.dto.js';

@Injectable()
export class AutomatedMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRule(hostId: string, dto: CreateAutomatedMessageRuleDto) {
    if (dto.propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
      });
      if (!property) {
        throw new NotFoundException('Property not found');
      }
      if (property.hostId !== hostId) {
        throw new ForbiddenException('Property does not belong to host');
      }
    }

    return this.prisma.automatedMessageRule.create({
      data: {
        hostId,
        propertyId: dto.propertyId || null,
        triggerEvent: dto.triggerEvent,
        templateText: dto.templateText,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        property: { select: { id: true, title: true } },
      },
    });
  }

  async getHostRules(hostId: string) {
    return this.prisma.automatedMessageRule.findMany({
      where: { hostId },
      include: {
        property: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleRuleStatus(hostId: string, ruleId: string, isActive: boolean) {
    const rule = await this.prisma.automatedMessageRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.hostId !== hostId) {
      throw new NotFoundException('Automated message rule not found');
    }

    return this.prisma.automatedMessageRule.update({
      where: { id: ruleId },
      data: { isActive },
    });
  }

  async deleteRule(hostId: string, ruleId: string) {
    const rule = await this.prisma.automatedMessageRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.hostId !== hostId) {
      throw new NotFoundException('Automated message rule not found');
    }

    await this.prisma.automatedMessageRule.delete({
      where: { id: ruleId },
    });

    return { message: 'Rule deleted successfully' };
  }
}
