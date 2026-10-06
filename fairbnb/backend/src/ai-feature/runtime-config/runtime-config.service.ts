import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AiFeatureKey,
  UpdateRuntimeAiConfigDto,
  PublicCapabilitiesResponse,
  AdminAiSettingsResponse,
} from './runtime-config.types.js';

@Injectable()
export class RuntimeAiConfigService {
  private readonly logger = new Logger(RuntimeAiConfigService.name);

  // In-memory state: strictly single-process, resets to false on restart
  private master = false;
  private features: Record<AiFeatureKey, boolean> = {
    smartSearch: false,
    stayComparison: false,
    listingQa: false,
    guestReplyDraft: false,
    listingQuality: false,
  };
  private version = 1;
  private updatedAt = new Date();

  // Track in-flight provider calls for active cancellation on disable
  private activeAbortControllers = new Set<AbortController>();

  constructor() {
    this.logger.log(
      `RuntimeAiConfig initialized (Single-process mode). AI_ALLOWED env: ${this.isAiAllowedByEnv()}. Master: ${this.master}, Version: ${this.version}`,
    );
  }

  isAiAllowedByEnv(): boolean {
    return process.env.AI_ALLOWED === 'true';
  }

  hasGroqApiKey(): boolean {
    const key = process.env.GROQ_API_KEY;
    return typeof key === 'string' && key.trim().length > 0;
  }

  getVersion(): number {
    return this.version;
  }

  isMasterEnabled(): boolean {
    return this.isAiAllowedByEnv() && this.master;
  }

  isFeatureEnabled(key: AiFeatureKey): boolean {
    if (!this.isMasterEnabled()) return false;
    return Boolean(this.features[key]);
  }

  assertFeatureEnabled(key: AiFeatureKey, requestVersion?: number): void {
    if (!this.isAiAllowedByEnv()) {
      throw new ServiceUnavailableException({
        code: 'AI_DISABLED',
        message: 'AI system is disabled by server environment policy (AI_ALLOWED=false).',
      });
    }

    if (!this.master) {
      throw new ServiceUnavailableException({
        code: 'AI_DISABLED',
        message: 'AI master switch is currently turned OFF by system administrator.',
      });
    }

    if (!this.features[key]) {
      throw new ServiceUnavailableException({
        code: 'AI_DISABLED',
        feature: key,
        message: `AI feature '${key}' is currently disabled.`,
      });
    }

    // Invalidate stale in-flight results if config version changed mid-flight
    if (requestVersion !== undefined && requestVersion !== this.version) {
      throw new ServiceUnavailableException({
        code: 'AI_CONFIG_CHANGED',
        message: 'Runtime AI configuration changed during request processing. Request invalidated.',
      });
    }
  }

  getPublicCapabilities(): PublicCapabilitiesResponse {
    const isMaster = this.isMasterEnabled();
    const effectiveFeatures: Record<AiFeatureKey, boolean> = {
      smartSearch: isMaster && Boolean(this.features.smartSearch),
      stayComparison: isMaster && Boolean(this.features.stayComparison),
      listingQa: isMaster && Boolean(this.features.listingQa),
      guestReplyDraft: isMaster && Boolean(this.features.guestReplyDraft),
      listingQuality: isMaster && Boolean(this.features.listingQuality),
    };

    return {
      enabled: isMaster,
      master: isMaster,
      features: effectiveFeatures,
      version: this.version,
    };
  }

  getAdminSettings(): AdminAiSettingsResponse {
    return {
      aiAllowedEnv: this.isAiAllowedByEnv(),
      master: this.master,
      features: { ...this.features },
      version: this.version,
      hasApiKey: this.hasGroqApiKey(),
      singleProcessNotice:
        'Single-process in-memory mode: all switches reset to OFF on server restart.',
      activeModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  updateConfig(dto: UpdateRuntimeAiConfigDto, actorId: string): AdminAiSettingsResponse {
    if (dto.master === true && !this.isAiAllowedByEnv()) {
      throw new ForbiddenException(
        'Cannot enable AI master switch because server environment variable AI_ALLOWED is not set to "true".',
      );
    }

    const previousMaster = this.master;
    let configChanged = false;

    if (typeof dto.master === 'boolean' && dto.master !== this.master) {
      this.master = dto.master;
      configChanged = true;
    }

    if (dto.features) {
      for (const [key, val] of Object.entries(dto.features)) {
        const featureKey = key as AiFeatureKey;
        if (typeof val === 'boolean' && this.features[featureKey] !== val) {
          this.features[featureKey] = val;
          configChanged = true;
        }
      }
    }

    if (configChanged) {
      this.version += 1;
      this.updatedAt = new Date();

      // If master or any feature was turned OFF, abort in-flight tracked calls
      if (previousMaster && !this.master) {
        this.abortAllActiveCalls('Master AI switch disabled by admin');
      }

      this.logger.log(
        `AI Runtime Config updated by [${actorId}]. Version: ${this.version}, Master: ${this.master}, Features: ${JSON.stringify(this.features)}`,
      );
    }

    return this.getAdminSettings();
  }

  // Abort controller tracking for live request cancellation
  registerAbortController(ac: AbortController): void {
    this.activeAbortControllers.add(ac);
  }

  unregisterAbortController(ac: AbortController): void {
    this.activeAbortControllers.delete(ac);
  }

  private abortAllActiveCalls(reason: string): void {
    this.logger.warn(`Aborting ${this.activeAbortControllers.size} in-flight AI calls. Reason: ${reason}`);
    for (const controller of this.activeAbortControllers) {
      try {
        controller.abort(reason);
      } catch (err) {
        // Safe ignore
      }
    }
    this.activeAbortControllers.clear();
  }
}
