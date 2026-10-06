import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateSystemSettingDto } from './admin-settings.dto.js';

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    const defaults: Record<string, any> = {
      defaultServiceFeeRate: 0.10,
      defaultTaxRate: 0.18,
      maintenanceMode: false,
      platformCurrency: 'INR',
      maxImagesPerProperty: 20,
      REELS_FEATURE_ENABLED: true,
    };

    const result: Record<string, any> = { ...defaults };
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return {
      settings: result,
      raw: settings,
    };
  }

  async isReelsEnabled(): Promise<boolean> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'REELS_FEATURE_ENABLED' },
      });
      if (!setting) return true;
      if (typeof setting.value === 'boolean') return setting.value;
      if (typeof setting.value === 'object' && setting.value !== null && 'enabled' in setting.value) {
        return Boolean((setting.value as any).enabled);
      }
      return Boolean(setting.value);
    } catch (e) {
      return true;
    }
  }

  async updateSetting(dto: UpdateSystemSettingDto) {
    return this.prisma.systemSetting.upsert({
      where: { key: dto.key },
      update: {
        value: dto.value,
        description: dto.description || undefined,
      },
      create: {
        key: dto.key,
        value: dto.value,
        description: dto.description || null,
      },
    });
  }

  async getSettingByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting key '${key}' not found`);
    }

    return setting;
  }
}
