import { Module } from '@nestjs/common';
import { AmenitiesController } from './amenities.controller.js';
import { AmenitiesService } from './amenities.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AmenitiesController],
  providers: [AmenitiesService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}
