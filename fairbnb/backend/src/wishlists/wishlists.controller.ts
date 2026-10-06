import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WishlistsService } from './wishlists.service.js';
import { CreateWishlistDto } from './wishlists.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  async createWishlist(
    @CurrentUser() user: any,
    @Body() dto: CreateWishlistDto,
  ) {
    return this.wishlistsService.createWishlist(user.id, dto);
  }

  @Get()
  async getUserWishlists(@CurrentUser() user: any) {
    return this.wishlistsService.getUserWishlists(user.id);
  }

  @Post(':id/properties/:propertyId')
  async addPropertyToWishlist(
    @CurrentUser() user: any,
    @Param('id') wishlistId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.wishlistsService.addPropertyToWishlist(user.id, wishlistId, propertyId);
  }

  @Delete(':id/properties/:propertyId')
  async removePropertyFromWishlist(
    @CurrentUser() user: any,
    @Param('id') wishlistId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.wishlistsService.removePropertyFromWishlist(user.id, wishlistId, propertyId);
  }

  @Delete(':id')
  async deleteWishlist(
    @CurrentUser() user: any,
    @Param('id') wishlistId: string,
  ) {
    return this.wishlistsService.deleteWishlist(user.id, wishlistId);
  }
}
