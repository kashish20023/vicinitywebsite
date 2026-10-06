import { Module } from '@nestjs/common';
import { WishlistsController } from './wishlists.controller.js';
import { WishlistsService } from './wishlists.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [WishlistsController],
  providers: [WishlistsService],
  exports: [WishlistsService],
})
export class WishlistsModule {}
