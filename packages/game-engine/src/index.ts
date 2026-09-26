import { ProvablyFair } from '@nova/fairness';
import { GameEngineConfig, GameId } from '@nova/types';

export interface GameExecutionInput<TParams = Record<string, unknown>> {
  amount: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  params: TParams;
}

export interface GameExecutionOutput<TOutcome = Record<string, unknown>> {
  won: boolean;
  multiplier: number;
  payout: number;
  profit: number;
  outcome: TOutcome;
}

export abstract class BaseGameEngine<TParams = Record<string, unknown>, TOutcome = Record<string, unknown>> {
  public readonly config: GameEngineConfig;

  constructor(config: GameEngineConfig) {
    this.config = config;
  }

  /**
   * Validates bet constraints (min/max bet amount, valid parameters)
   */
  public validateBet(amount: number, params: TParams): { valid: boolean; error?: string } {
    if (amount < this.config.minBet) {
      return { valid: false, error: `Minimum bet amount is ${this.config.minBet}` };
    }
    if (amount > this.config.maxBet) {
      return { valid: false, error: `Maximum bet amount is ${this.config.maxBet}` };
    }
    return this.validateParams(params);
  }

  /**
   * Game-specific param validation method to be overridden
   */
  protected abstract validateParams(params: TParams): { valid: boolean; error?: string };

  /**
   * Main game evaluation method to be implemented by each game plug-in
   */
  public abstract evaluate(input: GameExecutionInput<TParams>): GameExecutionOutput<TOutcome>;

  /**
   * Helper to calculate payout given multiplier and bet amount
   */
  protected calculatePayout(amount: number, multiplier: number): { payout: number; profit: number } {
    const payout = Math.floor(amount * multiplier * 100) / 100;
    const profit = Math.floor((payout - amount) * 100) / 100;
    return { payout, profit };
  }

  /**
   * Helper to apply house edge to raw multiplier
   */
  protected applyHouseEdge(rawMultiplier: number): number {
    const edgeFactor = (100 - this.config.houseEdgePercent) / 100;
    return Math.floor(rawMultiplier * edgeFactor * 100) / 100;
  }
}
