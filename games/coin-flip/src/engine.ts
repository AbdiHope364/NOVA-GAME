import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { CoinFlipParams } from '@nova/types';

export interface CoinFlipOutcome {
  result: 'HEADS' | 'TAILS';
  choice: 'HEADS' | 'TAILS';
  floatVal: number;
}

export class CoinFlipEngine extends BaseGameEngine<CoinFlipParams, CoinFlipOutcome> {
  constructor(houseEdgePercent: number = 1.0) {
    super({
      gameId: 'coin-flip',
      name: 'Coin Flip',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  protected validateParams(params: CoinFlipParams): { valid: boolean; error?: string } {
    if (!params || !['HEADS', 'TAILS'].includes(params.choice)) {
      return { valid: false, error: 'Choice must be HEADS or TAILS' };
    }
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<CoinFlipParams>): GameExecutionOutput<CoinFlipOutcome> {
    const floatVal = ProvablyFair.generateFloat(input.serverSeed, input.clientSeed, input.nonce);
    const result: 'HEADS' | 'TAILS' = floatVal < 0.5 ? 'HEADS' : 'TAILS';
    const won = result === input.params.choice;

    // Standard coin flip multiplier before house edge is 2.0x
    const rawMultiplier = 2.0;
    const multiplier = won ? this.applyHouseEdge(rawMultiplier) : 0;
    const { payout, profit } = this.calculatePayout(input.amount, multiplier);

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        result,
        choice: input.params.choice,
        floatVal,
      },
    };
  }
}
