import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { DiceParams } from '@nova/types';

export interface DiceOutcome {
  roll: number;
  target: number;
  condition: 'UNDER' | 'OVER';
  winChance: number;
  mode: 'SLIDER' | 'SINGLE';
  diceFace?: number;
}

export class DiceEngine extends BaseGameEngine<DiceParams, DiceOutcome> {
  constructor(houseEdgePercent: number = 1.0) {
    super({
      gameId: 'dice',
      name: 'Dice Roll',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  protected validateParams(params: DiceParams): { valid: boolean; error?: string } {
    if (!params) return { valid: false, error: 'Parameters required' };

    const mode = params.mode || 'SINGLE';
    if (mode === 'SINGLE') {
      if (params.target < 1 || params.target > 6) {
        return { valid: false, error: 'Single dice pick must be between 1 and 6' };
      }
    } else {
      if (params.target < 1 || params.target > 98) {
        return { valid: false, error: 'Target slider must be between 1 and 98' };
      }
      if (params.condition && !['UNDER', 'OVER'].includes(params.condition)) {
        return { valid: false, error: 'Condition must be UNDER or OVER' };
      }
    }
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<DiceParams>): GameExecutionOutput<DiceOutcome> {
    const floatVal = ProvablyFair.generateFloat(input.serverSeed, input.clientSeed, input.nonce);
    const mode = input.params.mode || 'SINGLE';

    if (mode === 'SINGLE') {
      const diceFace = Math.floor(floatVal * 6) + 1;
      const target = input.params.target;
      const won = diceFace === target;
      const winChance = (1 / 6) * 100;
      const rawMultiplier = (100 - this.config.houseEdgePercent) / winChance;
      const multiplier = won ? Math.floor(rawMultiplier * 100) / 100 : 0;
      const { payout, profit } = this.calculatePayout(input.amount, multiplier);

      return {
        won,
        multiplier,
        payout,
        profit,
        outcome: {
          roll: diceFace,
          target,
          condition: 'UNDER',
          winChance: Math.round(winChance * 100) / 100,
          mode: 'SINGLE',
          diceFace,
        },
      };
    }

    // SLIDER mode (0.00 - 99.99)
    const roll = Math.floor(floatVal * 10000) / 100;
    const target = input.params.target;
    const condition = input.params.condition || 'UNDER';
    const winChance = condition === 'UNDER' ? target : 100 - target;
    const won = condition === 'UNDER' ? roll < target : roll > target;

    const rawMultiplier = (100 - this.config.houseEdgePercent) / winChance;
    const multiplier = won ? Math.floor(rawMultiplier * 100) / 100 : 0;
    const { payout, profit } = this.calculatePayout(input.amount, multiplier);

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        roll,
        target,
        condition,
        winChance: Math.round(winChance * 100) / 100,
        mode: 'SLIDER',
      },
    };
  }
}
