import { Module } from '@nestjs/common';
import { BannersController } from './banners.controller.js';
import { BannersService } from './banners.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
