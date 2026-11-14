import { NovaRoundConfig, CartellaRoundConfig, BingoPattern } from '@nova/types';
import { prisma } from '../config/database.js';

export const PATTERN_DESCRIPTIONS: Record<BingoPattern, { name: string; description: string }> = {
  FULL_HOUSE: {
    name: 'Full House',
    description: 'Get all numbers in the card!',
  },
  ANY_LINE: {
    name: '1 Line',
    description: 'Complete any horizontal, vertical, or diagonal line',
  },
  TWO_LINES: {
    name: '2 Lines',
    description: 'Complete any two distinct lines',
  },
  FOUR_CORNERS: {
    name: 'Four Corners',
    description: 'Daub all four corner tiles of the card',
  },
  TOP_MIDDLE_BOTTOM: {
    name: 'Top Mid Bottom',
    description: 'Complete horizontal rows 1, 3, and 5',
  },
  CLOCK: {
    name: 'Clock Face',
    description: 'Complete outer ring + center hand',
  },
  ARROW: {
    name: 'Arrow',
    description: 'Complete diagonal arrow shape across card',
  },
  PYRAMID: {
    name: 'Pyramid',
    description: 'Complete 3-tier pyramid shape',
  },
  SQUARE: {
    name: '2x2 Square',
    description: 'Complete a 2x2 solid block of 4 spaces',
  },
  LETTER_T: {
    name: 'Letter T',
    description: 'Complete top horizontal line and center vertical stem',
  },
  T_AND_LINE: {
    name: 'T & Line',
    description: 'Complete Letter T plus an independent line',
  },
  SQUARE_AND_LINE: {
    name: 'Square & Line',
    description: 'Complete a 2x2 square plus an independent line',
  },
};

const DEFAULT_ROUND_CONFIG: NovaRoundConfig = {
  roundId: 'NOVA-1024',
  stake: 50,
  prize: 350,
  adminFee: 150,
  maxSlots: 10,
  activePlayers: 10,
  pattern: 'FULL_HOUSE',
  patternName: 'Full House',
  patternDescription: 'Get all numbers in the card!',
  status: 'ON_GOING',
  nextNumberCountdown: 45,
  gameName: 'NovaGame',
};

class NovaRoundServiceClass {
  private inMemoryCache: NovaRoundConfig = { ...DEFAULT_ROUND_CONFIG };

  /**
   * Retrieves active round configuration from the database, falling back to cached state
   */
  public async getRoundConfig(): Promise<NovaRoundConfig> {
    try {
      const dbConfig = await prisma.roundConfig.findUnique({
        where: { gameId: 'bingo' },
      });

      if (dbConfig) {
        this.inMemoryCache = {
          roundId: dbConfig.roundId,
          stake: dbConfig.stake,
          prize: dbConfig.prize,
          adminFee: dbConfig.adminFee,
          maxSlots: dbConfig.maxSlots,
          activePlayers: dbConfig.activePlayers,
          pattern: dbConfig.pattern as BingoPattern,
          patternName: dbConfig.patternName,
          patternDescription: dbConfig.patternDescription,
          status: dbConfig.status as 'WAITING' | 'ON_GOING' | 'ENDED',
          nextNumberCountdown: dbConfig.nextNumberCountdown,
          gameName: dbConfig.gameName,
        };
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch roundConfig from database, using fallback cache:', err);
    }
    return { ...this.inMemoryCache };
  }

  /**
   * Persists updated round configuration directly to the database
   */
  public async updateRoundConfig(updates: Partial<NovaRoundConfig>): Promise<NovaRoundConfig> {
    const current = await this.getRoundConfig();

    const pattern = updates.pattern || current.pattern;
    const meta = PATTERN_DESCRIPTIONS[pattern] || {
      name: pattern,
      description: 'Complete the target winning pattern',
    };

    const stake = updates.stake !== undefined ? Number(updates.stake) : current.stake;
    const maxSlots = updates.maxSlots !== undefined ? Number(updates.maxSlots) : current.maxSlots;
    const activePlayers = updates.activePlayers !== undefined ? Number(updates.activePlayers) : current.activePlayers;
    
    // Pot calculation: Pot = Stake * Slots
    const totalPot = stake * maxSlots;

    let adminFee = updates.adminFee !== undefined ? Number(updates.adminFee) : current.adminFee;
    let prize = updates.prize !== undefined ? Number(updates.prize) : current.prize;

    if ((updates.stake !== undefined || updates.maxSlots !== undefined) && updates.prize === undefined && updates.adminFee === undefined) {
      adminFee = Math.round(totalPot * 0.3);
      prize = totalPot - adminFee;
    } else if (updates.adminFee !== undefined && updates.prize === undefined) {
      prize = Math.max(0, totalPot - adminFee);
    } else if (updates.prize !== undefined && updates.adminFee === undefined) {
      adminFee = Math.max(0, totalPot - prize);
    }

    const updatedConfig: NovaRoundConfig = {
      roundId: updates.roundId || current.roundId,
      stake,
      maxSlots,
      activePlayers,
      prize,
      adminFee,
      pattern,
      patternName: updates.patternName || meta.name,
      patternDescription: updates.patternDescription || meta.description,
      status: updates.status || current.status,
      nextNumberCountdown: updates.nextNumberCountdown !== undefined ? Number(updates.nextNumberCountdown) : current.nextNumberCountdown,
      gameName: updates.gameName || current.gameName || 'NovaGame',
    };

    this.inMemoryCache = { ...updatedConfig };

    try {
      await prisma.roundConfig.upsert({
        where: { gameId: 'bingo' },
        update: {
          roundId: updatedConfig.roundId,
          stake: updatedConfig.stake,
          prize: updatedConfig.prize,
          adminFee: updatedConfig.adminFee,
          maxSlots: updatedConfig.maxSlots,
          activePlayers: updatedConfig.activePlayers,
          pattern: updatedConfig.pattern,
          patternName: updatedConfig.patternName,
          patternDescription: updatedConfig.patternDescription,
          status: updatedConfig.status,
          nextNumberCountdown: updatedConfig.nextNumberCountdown,
          gameName: updatedConfig.gameName,
        },
        create: {
          id: 'active_bingo_round',
          gameId: 'bingo',
          roundId: updatedConfig.roundId,
          stake: updatedConfig.stake,
          prize: updatedConfig.prize,
          adminFee: updatedConfig.adminFee,
          maxSlots: updatedConfig.maxSlots,
          activePlayers: updatedConfig.activePlayers,
          pattern: updatedConfig.pattern,
          patternName: updatedConfig.patternName,
          patternDescription: updatedConfig.patternDescription,
          status: updatedConfig.status,
          nextNumberCountdown: updatedConfig.nextNumberCountdown,
          gameName: updatedConfig.gameName,
        },
      });
    } catch (err) {
      console.error('❌ Failed to persist roundConfig to database:', err);
    }

    return { ...this.inMemoryCache };
  }
}

export const NovaRoundService = new NovaRoundServiceClass();
export const CartellaService = NovaRoundService;
