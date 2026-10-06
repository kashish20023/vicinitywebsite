import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { AdminModule } from './admin/admin.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { ProfileModule } from './profile/profile.module.js';
import { WishlistsModule } from './wishlists/wishlists.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { HostsModule } from './hosts/hosts.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { ChatModule } from './chat/chat.module.js';
import { MaintenanceModule } from './maintenance/maintenance.module.js';
import { AiFeatureModule } from './ai-feature/ai-feature.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { DisputesModule } from './disputes/disputes.module.js';
import { AutomatedMessagesModule } from './automated-messages/automated-messages.module.js';
import { IcalModule } from './ical/ical.module.js';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module.js';
import { AdminSettingsModule } from './admin-settings/admin-settings.module.js';
import { AuditLogModule } from './audit-logs/audit-logs.module.js';
import { MediaModule } from './media/media.module.js';
import { CoHostModule } from './co-host/co-host.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { BannersModule } from './banners/banners.module.js';
import { AmenitiesModule } from './amenities/amenities.module.js';
import { TagsModule } from './tags/tags.module.js';
import { PayoutsModule } from './payouts/payouts.module.js';
import { ReelsModule } from './reels/reels.module.js';
import { TrustSafetyModule } from './trust-safety/trust-safety.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    AdminModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    ProfileModule,
    WishlistsModule,
    NotificationsModule,
    HostsModule,
    CalendarModule,
    ChatModule,
    MaintenanceModule,
    AiFeatureModule,
    CouponsModule,
    DisputesModule,
    AutomatedMessagesModule,
    IcalModule,
    AiAssistantModule,
    AdminSettingsModule,
    AuditLogModule,
    MediaModule,
    CoHostModule,
    BannersModule,
    AmenitiesModule,
    TagsModule,
    PayoutsModule,
    ReelsModule,
    TrustSafetyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

