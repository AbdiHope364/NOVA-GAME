import { prisma } from '../config/database.js';

export interface PlatformSettingsData {
  platformName: string;
  maintenanceMode: boolean;
  minDeposit: number;
  maxDeposit: number;
  autoWithdrawLimit: number;
}

const DEFAULT_SETTINGS: PlatformSettingsData = {
  platformName: 'NOVA GAMING',
  maintenanceMode: false,
  minDeposit: 10,
  maxDeposit: 50000,
  autoWithdrawLimit: 5000,
};

const SETTINGS_KEY = '__platform_settings__';

export class PlatformSettingsService {
  private static cache: PlatformSettingsData | null = null;

  static async getSettings(): Promise<PlatformSettingsData> {
    if (this.cache) return this.cache;

    try {
      const row = await prisma.gameConfig.findUnique({
        where: { gameId: SETTINGS_KEY },
      });

      if (row) {
        let platformName = DEFAULT_SETTINGS.platformName;
        try {
          const parsed = JSON.parse(row.name);
          if (parsed && parsed.platformName) platformName = parsed.platformName;
        } catch {
          if (row.name) platformName = row.name;
        }

        const loaded: PlatformSettingsData = {
          platformName,
          maintenanceMode: !row.enabled,
          minDeposit: row.minBet,
          maxDeposit: row.maxBet,
          autoWithdrawLimit: row.houseEdgePercent,
        };
        this.cache = loaded;
        return loaded;
      }
    } catch {
      // Fallback to defaults if DB unreachable
    }

    return { ...DEFAULT_SETTINGS };
  }

  static async updateSettings(updates: Partial<PlatformSettingsData>): Promise<PlatformSettingsData> {
    const current = await this.getSettings();
    const merged: PlatformSettingsData = {
      platformName: updates.platformName ?? current.platformName,
      maintenanceMode: updates.maintenanceMode ?? current.maintenanceMode,
      minDeposit: updates.minDeposit !== undefined ? Number(updates.minDeposit) : current.minDeposit,
      maxDeposit: updates.maxDeposit !== undefined ? Number(updates.maxDeposit) : current.maxDeposit,
      autoWithdrawLimit:
        updates.autoWithdrawLimit !== undefined
          ? Number(updates.autoWithdrawLimit)
          : current.autoWithdrawLimit,
    };

    await prisma.gameConfig.upsert({
      where: { gameId: SETTINGS_KEY },
      update: {
        name: JSON.stringify({ platformName: merged.platformName }),
        enabled: !merged.maintenanceMode,
        minBet: merged.minDeposit,
        maxBet: merged.maxDeposit,
        houseEdgePercent: merged.autoWithdrawLimit,
      },
      create: {
        gameId: SETTINGS_KEY,
        name: JSON.stringify({ platformName: merged.platformName }),
        enabled: !merged.maintenanceMode,
        minBet: merged.minDeposit,
        maxBet: merged.maxDeposit,
        houseEdgePercent: merged.autoWithdrawLimit,
      },
    });

    this.cache = merged;
    return merged;
  }
}
