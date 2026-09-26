import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { DiceParams } from '@nova/types';

export interface DiceOutcome {
  roll: number;
  target: number;
  condition: 'UNDER' | 'OVER';
  winChance: number;
}

export class DiceEngine extends BaseGameEngine<DiceParams, DiceOutcome> {
  constructor(houseEdgePercent: number = 1.0) {
    super({
      gameId: 'dice',
      name: 'Dice',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  protected validateParams(params: DiceParams): { valid: boolean; error?: string } {
    if (!params || params.target < 1 || params.target > 98) {
      return { valid: false, error: 'Target must be between 1 and 98' };
    }
    if (!['UNDER', 'OVER'].includes(params.condition)) {
      return { valid: false, error: 'Condition must be UNDER or OVER' };
    }
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<DiceParams>): GameExecutionOutput<DiceOutcome> {
    const floatVal = ProvablyFair.generateFloat(input.serverSeed, input.clientSeed, input.nonce);
    // Roll integer 0 - 9999 normalized to 0.00 - 99.99
    const roll = Math.floor(floatVal * 10000) / 100;

    const { target, condition } = input.params;
    const winChance = condition === 'UNDER' ? target : 100 - target;
    const won = condition === 'UNDER' ? roll < target : roll > target;

    // Formula: (100 - houseEdge) / winChance
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
        winChance,
      },
    };
  }
}
