import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { RouletteParams } from '@nova/types';

export const ODD_RED_NUMBERS = [1, 3, 5, 7, 9, 11];
export const EVEN_BLACK_NUMBERS = [2, 4, 6, 8, 10, 12];

export interface PocketMeta {
  number: number;
  color: 'GREEN' | 'RED' | 'BLACK';
  third: 'LO' | 'MID' | 'HI' | null;
  half: '1-6' | '7-12' | null;
}

export const POCKET_MAP: Record<number, PocketMeta> = {
  0: { number: 0, color: 'GREEN', third: null, half: null },
  1: { number: 1, color: 'RED', third: 'LO', half: '1-6' },
  2: { number: 2, color: 'BLACK', third: 'LO', half: '1-6' },
  3: { number: 3, color: 'RED', third: 'LO', half: '1-6' },
  4: { number: 4, color: 'BLACK', third: 'LO', half: '1-6' },
  5: { number: 5, color: 'RED', third: 'MID', half: '1-6' },
  6: { number: 6, color: 'BLACK', third: 'MID', half: '1-6' },
  7: { number: 7, color: 'RED', third: 'MID', half: '7-12' },
  8: { number: 8, color: 'BLACK', third: 'MID', half: '7-12' },
  9: { number: 9, color: 'RED', third: 'HI', half: '7-12' },
  10: { number: 10, color: 'BLACK', third: 'HI', half: '7-12' },
  11: { number: 11, color: 'RED', third: 'HI', half: '7-12' },
  12: { number: 12, color: 'BLACK', third: 'HI', half: '7-12' },
};

export interface RouletteOutcome {
  number: number;
  color: 'GREEN' | 'RED' | 'BLACK';
  third: 'LO' | 'MID' | 'HI' | null;
  half: '1-6' | '7-12' | null;
  selection: any;
}

export class RouletteEngine extends BaseGameEngine<RouletteParams, RouletteOutcome> {
  constructor(houseEdgePercent: number = 7.69) {
    super({
      gameId: 'roulette',
      name: 'African Mini Roulette',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  protected validateParams(params: RouletteParams): { valid: boolean; error?: string } {
    if (!params || params.selection === undefined) {
      return { valid: false, error: 'Selection is required' };
    }
    const validBetStrings = [
      'RED',
      'BLACK',
      'GREEN',
      'LO',
      'MID',
      'HI',
      '1-6',
      '7-12',
      'COLOR_RED',
      'COLOR_BLACK',
      'HALF_1_6',
      'HALF_7_12',
      'THIRD_LO',
      'THIRD_MID',
      'THIRD_HI',
    ];

    if (typeof params.selection === 'string' && !validBetStrings.includes(params.selection)) {
      return { valid: false, error: 'Invalid bet selection' };
    }
    if (typeof params.selection === 'number' && (params.selection < 0 || params.selection > 12)) {
      return { valid: false, error: 'Number selection must be between 0 and 12' };
    }
    if (Array.isArray(params.selection)) {
      if (params.selection.length !== 2) {
        return { valid: false, error: 'Split bet must contain exactly 2 numbers' };
      }
      if (params.selection.some((n) => typeof n !== 'number' || n < 0 || n > 12)) {
        return { valid: false, error: 'Split bet numbers must be between 0 and 12' };
      }
    }
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<RouletteParams>): GameExecutionOutput<RouletteOutcome> {
    // Determine winning pocket (0 to 12) via HMAC-SHA256 modulo 13
    const winningPocket = ProvablyFair.generateInt(
      input.serverSeed,
      input.clientSeed,
      input.nonce,
      0,
      12
    );

    const metadata = POCKET_MAP[winningPocket];
    const { selection, betType } = input.params;
    let multiplier = 0;

    // Evaluate payout multiplier according to African Mini Roulette specification matrix
    if (typeof selection === 'number' && selection === winningPocket) {
      multiplier = 12.0; // Straight Up (11:1 + stake = 12x)
    } else if (Array.isArray(selection) && selection.includes(winningPocket)) {
      multiplier = 6.0; // Split (5:1 + stake = 6x)
    } else if (
      (selection === 'COLOR_RED' || selection === 'RED') &&
      metadata.color === 'RED'
    ) {
      multiplier = 2.0; // Color Red (1:1 + stake = 2x)
    } else if (
      (selection === 'COLOR_BLACK' || selection === 'BLACK') &&
      metadata.color === 'BLACK'
    ) {
      multiplier = 2.0; // Color Black (1:1 + stake = 2x)
    } else if (
      (selection === 'HALF_1_6' || selection === '1-6') &&
      metadata.half === '1-6'
    ) {
      multiplier = 2.0; // Half 1-6 (1:1 + stake = 2x)
    } else if (
      (selection === 'HALF_7_12' || selection === '7-12') &&
      metadata.half === '7-12'
    ) {
      multiplier = 2.0; // Half 7-12 (1:1 + stake = 2x)
    } else if (
      (selection === 'THIRD_LO' || selection === 'LO') &&
      metadata.third === 'LO'
    ) {
      multiplier = 3.0; // Low Third 1-4 (2:1 + stake = 3x)
    } else if (
      (selection === 'THIRD_MID' || selection === 'MID') &&
      metadata.third === 'MID'
    ) {
      multiplier = 3.0; // Mid Third 5-8 (2:1 + stake = 3x)
    } else if (
      (selection === 'THIRD_HI' || selection === 'HI') &&
      metadata.third === 'HI'
    ) {
      multiplier = 3.0; // High Third 9-12 (2:1 + stake = 3x)
    } else if (selection === 'GREEN' && metadata.color === 'GREEN') {
      multiplier = 12.0; // Green 0 (11:1 + stake = 12x)
    }

    const won = multiplier > 0;
    const { payout, profit } = this.calculatePayout(input.amount, multiplier);

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        number: winningPocket,
        color: metadata.color,
        third: metadata.third,
        half: metadata.half,
        selection,
      },
    };
  }
}
