import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { CrashParams } from '@nova/types';

export interface CrashOutcome {
  crashPoint: number;
  cashedOutMultiplier?: number;
}

export class CrashEngine extends BaseGameEngine<CrashParams, CrashOutcome> {
  constructor(houseEdgePercent: number = 1.0) {
    super({
      gameId: 'crash',
      name: 'Crash Rocket',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  protected validateParams(params: CrashParams): { valid: boolean; error?: string } {
    if (params?.autoCashoutMultiplier && params.autoCashoutMultiplier < 1.01) {
      return { valid: false, error: 'Auto cashout multiplier must be at least 1.01x' };
    }
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<CrashParams>): GameExecutionOutput<CrashOutcome> {
    const crashPoint = ProvablyFair.generateCrashPoint(
      input.serverSeed,
      input.clientSeed,
      input.nonce,
      this.config.houseEdgePercent
    );

    const isAutoActive = !!input.params?.autoCashoutEnabled;
    const autoCashout = isAutoActive ? input.params?.autoCashoutMultiplier : undefined;
    const cashedOutMultiplier = autoCashout && autoCashout <= crashPoint ? autoCashout : undefined;
    const won = !!cashedOutMultiplier;
    const multiplier = won ? cashedOutMultiplier! : 0;
    const { payout, profit } = this.calculatePayout(input.amount, multiplier);

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        crashPoint,
        cashedOutMultiplier,
      },
    };
  }
}
