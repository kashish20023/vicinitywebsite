import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAmenityDto, UpdateAmenityDto, AttachAmenitiesDto } from './amenities.dto.js';

@Injectable()
export class AmenitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(category?: string) {
    const where = category ? { category: { equals: category, mode: 'insensitive' as const } } : {};
    return this.prisma.amenity.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateAmenityDto) {
    const existing = await this.prisma.amenity.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Amenity with name "${dto.name}" already exists`);
    }

    return this.prisma.amenity.create({
      data: {
        name: dto.name,
        icon: dto.icon || null,
        category: dto.category || 'Essentials',
      },
    });
  }

  async update(id: string, dto: UpdateAmenityDto) {
    const existing = await this.prisma.amenity.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Amenity with ID "${id}" not found`);
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.amenity.findUnique({ where: { name: dto.name } });
      if (duplicate) {
        throw new ConflictException(`Amenity with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.amenity.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.category !== undefined && { category: dto.category }),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.amenity.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Amenity with ID "${id}" not found`);
    }

    return this.prisma.amenity.delete({ where: { id } });
  }

  async attachToProperty(propertyId: string, dto: AttachAmenitiesDto) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException(`Property with ID "${propertyId}" not found`);
    }

    // Atomic sync of property amenities join table
    await this.prisma.$transaction([
      this.prisma.propertyAmenity.deleteMany({ where: { propertyId } }),
      this.prisma.propertyAmenity.createMany({
        data: dto.amenityIds.map((amenityId) => ({
          propertyId,
          amenityId,
        })),
      }),
    ]);

    return this.getPropertyAmenities(propertyId);
  }

  async getPropertyAmenities(propertyId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException(`Property with ID "${propertyId}" not found`);
    }

    const relations = await this.prisma.propertyAmenity.findMany({
      where: { propertyId },
      include: {
        amenity: true,
      },
    });

    return relations.map((r) => r.amenity);
  }
}
