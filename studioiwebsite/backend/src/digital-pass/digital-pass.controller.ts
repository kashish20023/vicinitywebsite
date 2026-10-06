import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DigitalPassService } from './digital-pass.service';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('passes')
export class DigitalPassController {
  constructor(private digitalPassService: DigitalPassService) {}

  @Get(':bookingId')
  @UseGuards(AuthGuard('jwt'))
  async getPass(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.digitalPassService.getPassByBooking(bookingId, user.id);
  }

  @Post('check-in')
  async checkIn(
    @Body() dto: { qrToken?: string; passToken?: string; scannerAdminId?: string; terminalId?: string },
  ) {
    return this.digitalPassService.checkIn({
      qrToken: dto.qrToken || dto.passToken || '',
      scannerAdminId: dto.scannerAdminId,
      terminalId: dto.terminalId,
    });
  }

  @Post('check-out')
  async checkOut(@Body() dto: { qrToken?: string; passToken?: string }) {
    return this.digitalPassService.checkOut({
      qrToken: dto.qrToken || dto.passToken || '',
    });
  }
}
