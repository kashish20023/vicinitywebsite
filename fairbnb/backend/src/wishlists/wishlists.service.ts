import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWishlistDto } from './wishlists.dto.js';

@Injectable()
export class WishlistsService {
  constructor(private readonly prisma: PrismaService) {}

  async createWishlist(userId: string, dto: CreateWishlistDto) {
    return this.prisma.wishlist.create({
      data: {
        name: dto.name,
        userId,
      },
      include: {
        properties: true,
      },
    });
  }

  async getUserWishlists(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        properties: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            country: true,
            basePrice: true,
            coverImage: true,
            images: true,
            category: true,
            propertyType: true,
            maxGuests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addPropertyToWishlist(userId: string, wishlistId: string, propertyId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }
    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Access denied to this wishlist');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.wishlist.update({
      where: { id: wishlistId },
      data: {
        properties: {
          connect: { id: propertyId },
        },
      },
      include: {
        properties: true,
      },
    });
  }

  async removePropertyFromWishlist(userId: string, wishlistId: string, propertyId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }
    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Access denied to this wishlist');
    }

    return this.prisma.wishlist.update({
      where: { id: wishlistId },
      data: {
        properties: {
          disconnect: { id: propertyId },
        },
      },
      include: {
        properties: true,
      },
    });
  }

  async deleteWishlist(userId: string, wishlistId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }
    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Access denied to this wishlist');
    }

    await this.prisma.wishlist.delete({
      where: { id: wishlistId },
    });

    return { message: 'Wishlist deleted successfully' };
  }
}
