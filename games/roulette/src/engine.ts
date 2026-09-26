import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { RouletteParams } from '@nova/types';

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export interface RouletteOutcome {
  number: number;
  color: 'RED' | 'BLACK' | 'GREEN';
  selection: 'RED' | 'BLACK' | 'GREEN' | number;
}

export class RouletteEngine extends BaseGameEngine<RouletteParams, RouletteOutcome> {
  constructor(houseEdgePercent: number = 2.7) {
    super({
      gameId: 'roulette',
      name: 'European Roulette',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  protected validateParams(params: RouletteParams): { valid: boolean; error?: string } {
    if (!params || params.selection === undefined) {
      return { valid: false, error: 'Selection is required' };
    }
    if (typeof params.selection === 'string' && !['RED', 'BLACK', 'GREEN'].includes(params.selection)) {
      return { valid: false, error: 'Color selection must be RED, BLACK, or GREEN' };
    }
    if (typeof params.selection === 'number' && (params.selection < 0 || params.selection > 36)) {
      return { valid: false, error: 'Number selection must be between 0 and 36' };
    }
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<RouletteParams>): GameExecutionOutput<RouletteOutcome> {
    const number = ProvablyFair.generateInt(input.serverSeed, input.clientSeed, input.nonce, 0, 36);
    const color: 'RED' | 'BLACK' | 'GREEN' = number === 0 ? 'GREEN' : RED_NUMBERS.includes(number) ? 'RED' : 'BLACK';

    const { selection } = input.params;
    let won = false;
    let rawMultiplier = 0;

    if (selection === 'RED' && color === 'RED') {
      won = true;
      rawMultiplier = 2.0;
    } else if (selection === 'BLACK' && color === 'BLACK') {
      won = true;
      rawMultiplier = 2.0;
    } else if (selection === 'GREEN' && color === 'GREEN') {
      won = true;
      rawMultiplier = 36.0;
    } else if (typeof selection === 'number' && selection === number) {
      won = true;
      rawMultiplier = 36.0;
    }

    const multiplier = won ? this.applyHouseEdge(rawMultiplier) : 0;
    const { payout, profit } = this.calculatePayout(input.amount, multiplier);

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        number,
        color,
        selection,
      },
    };
  }
}
