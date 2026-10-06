import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import { BookingFilterDto } from './dto/booking-filter.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { CancelBookingDto } from './dto/cancel-booking.dto.js';
import { RequestRefundDto } from './dto/refund-booking.dto.js';
import { FailRefundDto } from './dto/fail-refund.dto.js';
import { RefundFilterDto } from './dto/refund-filter.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ============================================================================
  // 1. BOOKINGS ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/bookings
   * Returns paginated, filtered, sorted list of all bookings.
   */
  @Get('bookings')
  async getAllBookings(@Query() query: BookingFilterDto) {
    return this.bookingsService.findAll(query);
  }

  /**
   * GET /admin/bookings/summary
   * Returns aggregated booking metrics & total revenue/refund totals.
   */
  @Get('bookings/summary')
  async getSummary() {
    return this.bookingsService.getSummary();
  }

  /**
   * GET /admin/bookings/cancelled
   * Returns paginated list of cancelled bookings.
   */
  @Get('bookings/cancelled')
  async getCancelledBookings(@Query() query: BookingFilterDto) {
    return this.bookingsService.getCancelledBookings(query);
  }

  /**
   * GET /admin/bookings/:id
   * Returns detailed booking information by ID.
   */
  @Get('bookings/:id')
  async getBookingById(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  /**
   * PATCH /admin/bookings/:id/status
   * Updates booking status (PENDING, CONFIRMED, COMPLETED, CANCELLED, EXPIRED).
   */
  @Patch('bookings/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }

  /**
   * PATCH /admin/bookings/:id/cancel
   * Cancels a booking with reason.
   */
  @Patch('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.cancelBooking(id, dto, user.id);
  }

  // ============================================================================
  // 2. REFUNDS ENDPOINTS
  // ============================================================================

  /**
   * GET /admin/refunds
   * Returns paginated list of refunds with filters.
   */
  @Get('refunds')
  async getAllRefunds(@Query() query: RefundFilterDto) {
    return this.bookingsService.findAllRefunds(query);
  }

  /**
   * GET /admin/refunds/:id
   * Returns single refund record details by ID.
   */
  @Get('refunds/:id')
  async getRefundById(@Param('id') id: string) {
    return this.bookingsService.findRefundById(id);
  }

  /**
   * POST /admin/bookings/:bookingId/refund
   * Initiates a refund request for a booking.
   */
  @Post('bookings/:bookingId/refund')
  @HttpCode(HttpStatus.CREATED)
  async requestRefund(
    @Param('bookingId') bookingId: string,
    @Body() dto: RequestRefundDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.requestRefund(bookingId, dto, user.id);
  }

  /**
   * PATCH /admin/refunds/:id/process
   * Processes a pending refund to COMPLETED.
   */
  @Patch('refunds/:id/process')
  @HttpCode(HttpStatus.OK)
  async processRefund(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.processRefund(id, user.id);
  }

  /**
   * PATCH /admin/refunds/:id/fail
   * Marks a refund as FAILED with reason.
   */
  @Patch('refunds/:id/fail')
  @HttpCode(HttpStatus.OK)
  async failRefund(
    @Param('id') id: string,
    @Body() dto: FailRefundDto,
  ) {
    return this.bookingsService.failRefund(id, dto);
  }
}
