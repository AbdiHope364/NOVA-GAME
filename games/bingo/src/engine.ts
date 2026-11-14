import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { BingoParams, BingoCardData, BingoPattern } from '@nova/types';
import { BingoCardGenerator } from './card-generator.js';
import { BingoCaller, BingoBall } from './caller.js';
import { BingoValidator } from './validator.js';

export interface BingoOutcome {
  card: BingoCardData;
  drawnBalls: BingoBall[];
  winningBall?: BingoBall;
  patternAchieved?: string;
  ballsDrawnCount: number;
}

export class BingoEngine extends BaseGameEngine<BingoParams, BingoOutcome> {
  private static readonly VALID_PATTERNS: BingoPattern[] = [
    'ANY_LINE',
    'TWO_LINES',
    'FOUR_CORNERS',
    'TOP_MIDDLE_BOTTOM',
    'CLOCK',
    'ARROW',
    'PYRAMID',
    'SQUARE',
    'LETTER_T',
    'T_AND_LINE',
    'SQUARE_AND_LINE',
    'FULL_HOUSE',
  ];

  constructor(houseEdgePercent: number = 5.0) {
    super({
      gameId: 'bingo',
      name: 'Classic 75-Ball Bingo',
      houseEdgePercent,
      minBet: 10,
      maxBet: 5000,
    });
  }

  protected validateParams(params: BingoParams): { valid: boolean; error?: string } {
    if (params?.claimPattern && !BingoEngine.VALID_PATTERNS.includes(params.claimPattern)) {
      return { valid: false, error: 'Invalid Bingo pattern target' };
    }
    return { valid: true };
  }

  /**
   * Computes a fair, engaging multiplier tailored to the pattern's difficulty
   * and the speed of completion (fewer calls = higher payout).
   */
  public static calculateMultiplier(pattern: BingoPattern, ballsDrawn: number): number {
    switch (pattern) {
      case 'FULL_HOUSE':
        if (ballsDrawn <= 30) return 250.0;
        if (ballsDrawn <= 40) return 100.0;
        if (ballsDrawn <= 50) return 50.0;
        return 25.0;

      case 'TOP_MIDDLE_BOTTOM':
        if (ballsDrawn <= 20) return 80.0;
        if (ballsDrawn <= 30) return 40.0;
        if (ballsDrawn <= 40) return 20.0;
        return 10.0;

      case 'CLOCK':
        if (ballsDrawn <= 20) return 50.0;
        if (ballsDrawn <= 28) return 25.0;
        if (ballsDrawn <= 36) return 15.0;
        return 8.0;

      case 'T_AND_LINE':
      case 'SQUARE_AND_LINE':
        if (ballsDrawn <= 16) return 30.0;
        if (ballsDrawn <= 24) return 15.0;
        if (ballsDrawn <= 32) return 8.0;
        return 4.0;

      case 'TWO_LINES':
        if (ballsDrawn <= 15) return 25.0;
        if (ballsDrawn <= 22) return 12.0;
        if (ballsDrawn <= 30) return 6.0;
        return 3.0;

      case 'ARROW':
      case 'PYRAMID':
        if (ballsDrawn <= 14) return 20.0;
        if (ballsDrawn <= 20) return 10.0;
        if (ballsDrawn <= 28) return 5.0;
        return 2.5;

      case 'LETTER_T':
      case 'ANY_LINE':
        if (ballsDrawn <= 10) return 10.0;
        if (ballsDrawn <= 16) return 5.0;
        if (ballsDrawn <= 24) return 3.0;
        return 1.8;

      case 'FOUR_CORNERS':
      case 'SQUARE':
        if (ballsDrawn <= 8) return 8.0;
        if (ballsDrawn <= 14) return 4.0;
        if (ballsDrawn <= 20) return 2.5;
        return 1.5;

      default:
        return 2.0;
    }
  }

  public evaluate(input: GameExecutionInput<BingoParams>): GameExecutionOutput<BingoOutcome> {
    const card = BingoCardGenerator.generateCard(input.serverSeed, input.clientSeed, input.nonce);
    const drawPool = BingoCaller.generateDrawPool(input.serverSeed, input.clientSeed, input.nonce + 100);

    const targetPattern: BingoPattern = input.params?.claimPattern || 'ANY_LINE';
    const drawnNumbers: number[] = [];
    let winningIndex = -1;
    let achievedPattern: string | undefined;

    // Harder patterns get a larger draw window (up to 55 balls), standard patterns up to 38 balls
    const maxDraws =
      targetPattern === 'FULL_HOUSE' || targetPattern === 'TOP_MIDDLE_BOTTOM' || targetPattern === 'CLOCK'
        ? Math.min(55, drawPool.length)
        : Math.min(38, drawPool.length);

    // Simulate ball draws until pattern is met
    for (let i = 0; i < maxDraws; i++) {
      drawnNumbers.push(drawPool[i].number);
      const validation = BingoValidator.validateClaim(card, drawnNumbers, targetPattern);
      if (validation.valid) {
        winningIndex = i;
        achievedPattern = validation.patternAchieved;
        break;
      }
    }

    const won = winningIndex !== -1;
    let multiplier = 0;

    if (won) {
      const ballsDrawn = winningIndex + 1;
      multiplier = BingoEngine.calculateMultiplier(targetPattern, ballsDrawn);
    }

    const { payout, profit } = this.calculatePayout(input.amount, multiplier);
    const finalDrawnBalls = won
      ? drawPool.slice(0, winningIndex + 1)
      : drawPool.slice(0, Math.min(25, maxDraws));

    return {
      won,
      multiplier,
      payout,
      profit,
      outcome: {
        card,
        drawnBalls: finalDrawnBalls,
        winningBall: won ? finalDrawnBalls[finalDrawnBalls.length - 1] : undefined,
        patternAchieved: achievedPattern,
        ballsDrawnCount: finalDrawnBalls.length,
      },
    };
  }
}
