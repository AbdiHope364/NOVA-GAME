import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import {
  GameState,
  LegalMove,
  Move,
  Result,
  RuleOptions,
  DEFAULT_OPTIONS,
  createInitialState,
  applyMove,
  getResult,
} from './rules.js';
import { findBestMove, DamaDifficulty } from './ai.js';

export interface DamaParams {
  action?: 'START' | 'MOVE';
  move?: Move;
  state?: GameState;
  difficulty?: DamaDifficulty;
  options?: Partial<RuleOptions>;
}

export interface DamaOutcome {
  state: GameState;
  result: Result;
  lastMove?: LegalMove;
  aiMove?: LegalMove;
}

export class DamaEngine extends BaseGameEngine<DamaParams, DamaOutcome> {
  constructor(houseEdgePercent: number = 2.0) {
    super({
      gameId: 'dama',
      name: 'Ethiopian Dama',
      houseEdgePercent,
      minBet: 10,
      maxBet: 5000,
    });
  }

  protected validateParams(params: DamaParams): { valid: boolean; error?: string } {
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<DamaParams>): GameExecutionOutput<DamaOutcome> {
    const action = input.params?.action || 'START';
    const options = input.params?.options || DEFAULT_OPTIONS;
    const currentState = input.params?.state || createInitialState('W');
    const difficulty = input.params?.difficulty || 'medium';

    if (action === 'START') {
      const initial = createInitialState('W');
      return {
        won: false,
        multiplier: 1.0,
        payout: 0,
        profit: 0,
        outcome: {
          state: initial,
          result: { status: 'ongoing' },
        },
      };
    }

    // Apply player move
    if (!input.params?.move) {
      throw new Error('Missing player move for MOVE action');
    }

    const playerRes = applyMove(currentState, input.params.move, options);
    let nextState = playerRes.state;
    let finalResult = playerRes.result;
    let aiMove: LegalMove | undefined;

    // If game is still ongoing and it's Black's turn (AI), evaluate AI response
    if (finalResult.status === 'ongoing' && nextState.turn === 'B') {
      const best = findBestMove(nextState, difficulty, options);
      if (best) {
        aiMove = best;
        const aiRes = applyMove(nextState, best, options);
        nextState = aiRes.state;
        finalResult = aiRes.result;
      }
    }

    const won = finalResult.status === 'win' && finalResult.winner === 'W';
    const isDraw = finalResult.status === 'draw';

    // 2% house edge on win = 1.96x payout; 1.0x on draw (refund)
    const winMultiplier = this.applyHouseEdge(2.0);
    const multiplier = won ? winMultiplier : isDraw ? 1.0 : 0;
    const { payout, profit } = this.calculatePayout(input.amount, multiplier);

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        state: nextState,
        result: finalResult,
        lastMove: playerRes.move,
        aiMove,
      },
    };
  }
}

