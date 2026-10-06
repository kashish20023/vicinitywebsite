import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMaintenanceRequestDto, UpdateMaintenanceStatusDto } from './maintenance.dto.js';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(userId: string, dto: CreateMaintenanceRequestDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.maintenanceRequest.create({
      data: {
        propertyId: dto.propertyId,
        bookingId: dto.bookingId || null,
        reportedById: userId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
      },
      include: {
        property: { select: { id: true, title: true } },
        reportedBy: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  async getTicketsForUser(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      return this.prisma.maintenanceRequest.findMany({
        include: {
          property: { select: { id: true, title: true, city: true } },
          reportedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (userRole === 'HOST') {
      const myProperties = await this.prisma.property.findMany({
        where: { hostId: userId },
        select: { id: true },
      });
      const propertyIds = myProperties.map((p) => p.id);

      return this.prisma.maintenanceRequest.findMany({
        where: {
          OR: [
            { propertyId: { in: propertyIds } },
            { reportedById: userId },
          ],
        },
        include: {
          property: { select: { id: true, title: true, city: true } },
          reportedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.maintenanceRequest.findMany({
      where: { reportedById: userId },
      include: {
        property: { select: { id: true, title: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTicketStatus(ticketId: string, dto: UpdateMaintenanceStatusDto) {
    const ticket = await this.prisma.maintenanceRequest.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Maintenance ticket not found');
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        resolutionNote: dto.resolutionNote !== undefined ? dto.resolutionNote : ticket.resolutionNote,
      },
    });
  }
}
