import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AmenitiesService } from './amenities.service.js';
import { CreateAmenityDto, UpdateAmenityDto, AttachAmenitiesDto } from './amenities.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  async getAll(@Query('category') category?: string) {
    return this.amenitiesService.getAll(category);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateAmenityDto) {
    return this.amenitiesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateAmenityDto) {
    return this.amenitiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return this.amenitiesService.delete(id);
  }

  @Post('property/:propertyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HOST)
  async attachToProperty(
    @Param('propertyId') propertyId: string,
    @Body() dto: AttachAmenitiesDto,
  ) {
    return this.amenitiesService.attachToProperty(propertyId, dto);
  }

  @Get('property/:propertyId')
  async getPropertyAmenities(@Param('propertyId') propertyId: string) {
    return this.amenitiesService.getPropertyAmenities(propertyId);
  }
}
