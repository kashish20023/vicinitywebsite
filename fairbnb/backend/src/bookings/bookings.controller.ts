import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { AvailabilityService } from './availability.service.js';
import { PricingService } from './pricing.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CheckAvailabilityDto } from './dto/check-availability.dto.js';
import { CreateBookingQuoteDto } from './dto/create-booking-quote.dto.js';
import { CreateGuestBookingDto } from './dto/create-guest-booking.dto.js';
import { CancelGuestBookingDto } from './dto/cancel-guest-booking.dto.js';
import { BookingFilterDto } from './dto/booking-filter.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly availabilityService: AvailabilityService,
    private readonly pricingService: PricingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /properties/:propertyId/availability
   * Public endpoint to check property availability for a date range.
   */
  @Get('properties/:propertyId/availability')
  async checkAvailability(
    @Param('propertyId') propertyId: string,
    @Query() query: CheckAvailabilityDto,
  ) {
    return this.availabilityService.checkAvailability(
      propertyId,
      query.checkIn,
      query.checkOut,
      query.guests,
    );
  }

  /**
   * POST /bookings/quote
   * Public / Guest endpoint to generate booking price quote without creating a booking.
   */
  @Post('bookings/quote')
  @HttpCode(HttpStatus.OK)
  async getBookingQuote(@Body() dto: CreateBookingQuoteDto) {
    return this.bookingsService.getBookingQuote(dto);
  }

  /**
   * POST /bookings
   * Authenticated Guest endpoint to create a new booking with transaction-based double-booking protection.
   */
  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBooking(
    @CurrentUser() user: any,
    @Body() dto: CreateGuestBookingDto,
  ) {
    return this.bookingsService.createGuestBooking(user.id, dto);
  }

  /**
   * GET /bookings/my-bookings
   * Authenticated Guest endpoint to view own bookings list.
   */
  @Get('bookings/my-bookings')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(
    @CurrentUser() user: any,
    @Query() query: BookingFilterDto,
  ) {
    return this.bookingsService.findMyBookings(user.id, query);
  }

  /**
   * GET /bookings/my-trips
   * Authenticated Guest Trips Portal endpoint (enriched with check-in instructions, Wi-Fi info & host contact card).
   */
  @Get('bookings/my-trips')
  @UseGuards(JwtAuthGuard)
  async getMyTrips(@CurrentUser() user: any) {
    return this.bookingsService.findMyTrips(user.id);
  }

  /**
   * POST /bookings/checkout-preview
   * Endpoint for dedicated checkout UI (/book/stays/{id}) supporting trip review & pricing preview.
   */
  @Post('bookings/checkout-preview')
  @HttpCode(HttpStatus.OK)
  async getCheckoutPreview(@Body() dto: CreateBookingQuoteDto) {
    return this.bookingsService.getCheckoutPreview(dto);
  }

  /**
   * GET /bookings/:id
   * Authenticated Guest / Host / Admin endpoint to view single booking details with RBAC ownership check.
   */
  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard)
  async getBookingById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.findGuestBookingById(id, user.id, user.role);
  }

  /**
   * POST /bookings/:id/cancel
   * Authenticated Guest endpoint to cancel own booking according to cancellation policy.
   */
  @Post('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelMyBooking(
    @Param('id') id: string,
    @Body() dto: CancelGuestBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.cancelBookingByGuest(id, dto, user.id);
  }

  @Post('bookings/cleanup-expired')
  @HttpCode(HttpStatus.OK)
  async autoExpirePendingBookings() {
    return this.bookingsService.autoExpirePendingBookings();
  }

  @Post('bookings/:id/host-cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async hostCancelBooking(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.hostCancelBooking(user.id, id, reason);
  }

  @Patch('bookings/:id/no-show')
  @UseGuards(JwtAuthGuard)
  async markNoShow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.markNoShow(user.id, user.role, id);
  }

  @Post('bookings/:id/reschedule-request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async requestReschedule(
    @Param('id') id: string,
    @Body() dto: { newCheckIn: string; newCheckOut: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.requestReschedule(user.id, id, dto);
  }

  @Patch('bookings/:id/reschedule-respond')
  @UseGuards(JwtAuthGuard)
  async respondReschedule(
    @Param('id') id: string,
    @Body('action') action: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.respondReschedule(user.id, id, action);
  }
}
