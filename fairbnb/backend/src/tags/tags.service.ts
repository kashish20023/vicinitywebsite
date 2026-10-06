import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTagDto, UpdateTagDto } from './tags.dto.js';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Tag with name "${dto.name}" already exists`);
    }

    return this.prisma.tag.create({
      data: {
        name: dto.name,
        icon: dto.icon || null,
        color: dto.color || '#EF4444',
        description: dto.description || null,
        propertyOrder: dto.propertyOrder || [],
      },
    });
  }

  async update(id: string, dto: UpdateTagDto) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.tag.findUnique({ where: { name: dto.name } });
      if (duplicate) {
        throw new ConflictException(`Tag with name "${dto.name}" already exists`);
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.propertyOrder !== undefined && { propertyOrder: dto.propertyOrder }),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    return this.prisma.tag.delete({ where: { id } });
  }
}
