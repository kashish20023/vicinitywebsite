import { Module } from '@nestjs/common';
import { ReelsController } from './reels.controller.js';
import { ReelsService } from './reels.service.js';
import { CloudinaryService } from './cloudinary.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module.js';
import { ReelsFeatureGuard } from './guards/reels-feature.guard.js';

@Module({
  imports: [PrismaModule, AdminSettingsModule],
  controllers: [ReelsController],
  providers: [ReelsService, CloudinaryService, ReelsFeatureGuard],
  exports: [ReelsService, CloudinaryService, ReelsFeatureGuard],
})
export class ReelsModule {}
