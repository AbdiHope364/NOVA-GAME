import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';

export interface SimpleDiceParams {
  targetNumber: number; // 1 to 6
}

export interface SimpleDiceOutcome {
  roll: number; // 1 to 6
  targetNumber: number;
}

export class DiceEngine extends BaseGameEngine<SimpleDiceParams, SimpleDiceOutcome> {
  constructor(houseEdgePercent: number = 2.0) {
    super({
      gameId: 'dice',
      name: 'Dice',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  protected validateParams(params: SimpleDiceParams): { valid: boolean; error?: string } {
    if (!params || typeof params.targetNumber !== 'number' || params.targetNumber < 1 || params.targetNumber > 6) {
      return { valid: false, error: 'Target number must be between 1 and 6' };
    }
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<SimpleDiceParams>): GameExecutionOutput<SimpleDiceOutcome> {
    // Generate deterministic 1 - 6 integer roll from Provably Fair seed pair
    const roll = ProvablyFair.generateInt(input.serverSeed, input.clientSeed, input.nonce, 1, 6);
    const targetNumber = input.params.targetNumber;

    const won = roll === targetNumber;

    // Standard 6-sided dice multiplier raw is 6.0x, with 2% house edge = 5.88x
    const rawMultiplier = 6.0;
    const multiplier = won ? this.applyHouseEdge(rawMultiplier) : 0;
    const { payout, profit } = this.calculatePayout(input.amount, multiplier);

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        roll,
        targetNumber,
      },
    };
  }
}
