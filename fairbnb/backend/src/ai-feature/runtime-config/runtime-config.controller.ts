import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { RuntimeAiConfigService } from './runtime-config.service.js';
import { UpdateRuntimeAiConfigDto } from './runtime-config.types.js';
import type {
  PublicCapabilitiesResponse,
  AdminAiSettingsResponse,
} from './runtime-config.types.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@Controller()
export class RuntimeAiConfigController {
  constructor(private readonly configService: RuntimeAiConfigService) {}

  /**
   * Public endpoint to expose usable AI capabilities.
   * Exposes only boolean availability flags and config version.
   * Strips all provider info, keys, internal logs and metrics.
   */
  @Get('ai/capabilities')
  getPublicCapabilities(): PublicCapabilitiesResponse {
    return this.configService.getPublicCapabilities();
  }

  /**
   * Admin-only endpoint to inspect full runtime AI settings.
   */
  @Get('admin/ai-settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdminSettings(): AdminAiSettingsResponse {
    return this.configService.getAdminSettings();
  }

  /**
   * Admin-only endpoint to update master or individual AI feature flags.
   */
  @Patch('admin/ai-settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateAdminSettings(
    @Body() dto: UpdateRuntimeAiConfigDto,
    @Request() req: any,
  ): AdminAiSettingsResponse {
    const actorId = req.user?.id || 'admin-actor';
    return this.configService.updateConfig(dto, actorId);
  }

  /**
   * Admin-only synthetic non-sensitive connectivity ping to Groq.
   * Allowed ONLY when AI_ALLOWED and master switch are enabled.
   */
  @Post('admin/ai-settings/test-connectivity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async testConnectivity(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    if (!this.configService.isMasterEnabled()) {
      throw new ForbiddenException(
        'Connectivity test is not permitted when AI master switch or AI_ALLOWED is disabled.',
      );
    }

    if (!this.configService.hasGroqApiKey()) {
      return {
        success: false,
        message: 'GROQ_API_KEY environment variable is not configured on the server.',
      };
    }

    const start = Date.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          success: true,
          message: 'Groq provider authenticated and reachable.',
          latencyMs,
        };
      } else {
        return {
          success: false,
          message: `Groq provider responded with status ${res.status}: ${res.statusText}`,
          latencyMs,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Connectivity check failed: ${err.message || 'Unknown network error'}`,
      };
    }
  }
}
