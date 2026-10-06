import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('liveness')
  getLiveness() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  async getReadiness(@Res() res: Response) {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return res.status(HttpStatus.OK).json({
        status: 'UP',
        database: 'CONNECTED',
        providerMode: process.env.PAYMENT_PROVIDER_MODE || 'SIMULATION',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
