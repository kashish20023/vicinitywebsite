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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PropertiesService } from './properties.service.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  /**
   * Public Catalog View: Only returns APPROVED & PUBLISHED properties.
   */
  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('country') country?: string,
    @Query('category') category?: string,
    @Query('propertyType') propertyType?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('maxGuests') maxGuests?: number,
    @Query('minLat') minLat?: number,
    @Query('maxLat') maxLat?: number,
    @Query('minLng') minLng?: number,
    @Query('maxLng') maxLng?: number,
    @Query('instantBook') instantBook?: boolean,
    @Query('superhostOnly') superhostOnly?: boolean,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.propertiesService.findAll({
      city,
      state,
      country,
      category,
      propertyType,
      minPrice,
      maxPrice,
      maxGuests,
      minLat,
      maxLat,
      minLng,
      maxLng,
      instantBook,
      superhostOnly,
      sortBy,
    });
  }

  /**
   * Host View: Returns all properties belonging to the authenticated host.
   */
  @Get('my-properties')
  @UseGuards(JwtAuthGuard)
  async findMyProperties(@CurrentUser() user: any) {
    return this.propertiesService.findMyProperties(user.id);
  }

  /**
   * Admin View: Returns all properties across all hosts with status filter.
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAdminProperties(
    @Query('verificationStatus') verificationStatus?: string,
    @Query('status') status?: string,
  ) {
    return this.propertiesService.findAdminProperties({
      verificationStatus,
      status,
    });
  }

  /**
   * Single Property Lookup by ID or Slug.
   */
  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.propertiesService.findOne(idOrSlug);
  }

  /**
   * Create Property: HOST properties get status PENDING_APPROVAL; ADMIN properties are auto-approved.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN)
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(user.id, user.role, dto);
  }

  /**
   * Admin Action: Approve a property for public listing.
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string) {
    return this.propertiesService.approve(id);
  }

  /**
   * Admin Action: Reject a property with optional reason.
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.propertiesService.reject(id, rejectionReason);
  }

  /**
   * Update Property: Owner host or ADMIN. Updating by host sends property back to PENDING_APPROVAL.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, user.id, user.role, dto);
  }

  /**
   * Delete Property: Owner host or ADMIN.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.remove(id, user.id, user.role);
  }
}
