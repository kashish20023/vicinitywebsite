import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { HostsModule } from './hosts/hosts.module';
import { CoHostModule } from './co-host/co-host.module';
import { AvailabilityModule } from './availability/availability.module';
import { PricingModule } from './pricing/pricing.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { DigitalPassModule } from './digital-pass/digital-pass.module';
import { AdminModule } from './admin/admin.module';
import { OperationsModule } from './operations/operations.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    HostsModule,
    CoHostModule,
    AvailabilityModule,
    PricingModule,
    BookingsModule,
    PaymentsModule,
    DigitalPassModule,
    AdminModule,
    OperationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
