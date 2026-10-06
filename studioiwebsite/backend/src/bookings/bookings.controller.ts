import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post('hold')
  @UseGuards(AuthGuard('jwt'))
  async createHold(
    @CurrentUser() user: any,
    @Body()
    dto: {
      unitId: string;
      startDateTime: string;
      endDateTime: string;
    },
  ) {
    return this.bookingsService.createHold({
      userId: user.id,
      unitId: dto.unitId,
      startDateTime: dto.startDateTime,
      endDateTime: dto.endDateTime,
    });
  }

  @Post('reserve')
  @UseGuards(AuthGuard('jwt'))
  async createBooking(
    @CurrentUser() user: any,
    @Body()
    dto: {
      holdId: string;
      planId: string;
      couponCode?: string;
    },
  ) {
    return this.bookingsService.createBooking({
      userId: user.id,
      holdId: dto.holdId,
      planId: dto.planId,
      couponCode: dto.couponCode,
    });
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyBookings(@CurrentUser() user: any) {
    return this.bookingsService.getUserBookings(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getBookingDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.getBookingById(id, user.id);
  }
}
