import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { LimboParams, LimboOutcome } from '@nova/types';

export class LimboEngine extends BaseGameEngine<LimboParams, LimboOutcome> {
  constructor(houseEdgePercent: number = 1.0) {
    super({
      gameId: 'limbo',
      name: 'Limbo Rocket',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  /**
   * Validates target multiplier parameters
   */
  protected validateParams(params: LimboParams): { valid: boolean; error?: string } {
    if (!params) {
      return { valid: false, error: 'Target multiplier parameters required' };
    }

    if (typeof params.targetMultiplier !== 'number' || isNaN(params.targetMultiplier)) {
      return { valid: false, error: 'Target multiplier must be a valid number' };
    }

    if (params.targetMultiplier < 1.01) {
      return { valid: false, error: 'Minimum target multiplier is 1.01x' };
    }

    if (params.targetMultiplier > 1000000) {
      return { valid: false, error: 'Maximum target multiplier is 1,000,000x' };
    }

    return { valid: true };
  }

  /**
   * Evaluates the Limbo outcome using provably fair seed input
   */
  public evaluate(input: GameExecutionInput<LimboParams>): GameExecutionOutput<LimboOutcome> {
    const floatVal = ProvablyFair.generateFloat(input.serverSeed, input.clientSeed, input.nonce);
    const targetMultiplier = Math.floor(input.params.targetMultiplier * 100) / 100;

    // Apply standard Crash / Limbo Pareto distribution with 1% house edge (0.99 / (1 - X))
    const edgeFactor = (100 - this.config.houseEdgePercent) / 100;
    const denominator = Math.max(1e-12, 1.0 - floatVal);
    const rawResult = edgeFactor / denominator;
    const resultMultiplier = Math.max(1.00, Math.floor(rawResult * 100) / 100);

    const won = resultMultiplier >= targetMultiplier;
    const multiplier = won ? targetMultiplier : 0;
    const { payout, profit } = this.calculatePayout(input.amount, multiplier);

    const winChance = Math.min(99.0, Math.round((edgeFactor / targetMultiplier) * 10000) / 100);

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        targetMultiplier,
        resultMultiplier,
        winChance,
      },
    };
  }
}

