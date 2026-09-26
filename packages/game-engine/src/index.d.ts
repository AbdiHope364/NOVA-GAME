import { GameEngineConfig } from '@nova/types';
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
export declare abstract class BaseGameEngine<TParams = Record<string, unknown>, TOutcome = Record<string, unknown>> {
    readonly config: GameEngineConfig;
    constructor(config: GameEngineConfig);
    /**
     * Validates bet constraints (min/max bet amount, valid parameters)
     */
    validateBet(amount: number, params: TParams): {
        valid: boolean;
        error?: string;
    };
    /**
     * Game-specific param validation method to be overridden
     */
    protected abstract validateParams(params: TParams): {
        valid: boolean;
        error?: string;
    };
    /**
     * Main game evaluation method to be implemented by each game plug-in
     */
    abstract evaluate(input: GameExecutionInput<TParams>): GameExecutionOutput<TOutcome>;
    /**
     * Helper to calculate payout given multiplier and bet amount
     */
    protected calculatePayout(amount: number, multiplier: number): {
        payout: number;
        profit: number;
    };
    /**
     * Helper to apply house edge to raw multiplier
     */
    protected applyHouseEdge(rawMultiplier: number): number;
}
//# sourceMappingURL=index.d.ts.map