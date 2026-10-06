import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AdminSettingsService } from '../../admin-settings/admin-settings.service.js';

@Injectable()
export class ReelsFeatureGuard implements CanActivate {
  private readonly logger = new Logger(ReelsFeatureGuard.name);

  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isEnabled = await this.adminSettingsService.isReelsEnabled();

    if (!isEnabled) {
      const req = context.switchToHttp().getRequest();
      const requestId = req?.requestId || 'unknown';

      this.logger.warn(
        JSON.stringify({
          event: 'reels.feature.access_blocked',
          requestId,
          url: req?.url,
          method: req?.method,
          timestamp: new Date().toISOString(),
        }),
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Reels feature is currently disabled.',
          error: 'Service Unavailable',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return true;
  }
}
