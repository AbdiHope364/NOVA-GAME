import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { MinesParams } from '@nova/types';

export interface MinesOutcome {
  mineCount: number;
  minePositions: number[];
  revealedTiles: number[];
  isBombHit: boolean;
  currentMultiplier: number;
  nextMultiplier: number;
  gemsRevealedCount: number;
}

export class MinesEngine extends BaseGameEngine<MinesParams, MinesOutcome> {
  constructor(houseEdgePercent: number = 1.0) {
    super({
      gameId: 'mines',
      name: 'Mines Sweeper (5x5 Grid)',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  /**
   * Deterministically generates mine positions from server seed, client seed, and nonce
   */
  public static generateMinePositions(serverSeed: string, clientSeed: string, nonce: number, mineCount: number): number[] {
    const tiles = Array.from({ length: 25 }, (_, i) => i);
    const mines: number[] = [];

    let currentNonce = nonce;
    for (let i = 0; i < mineCount; i++) {
      const floatVal = ProvablyFair.generateFloat(serverSeed, clientSeed, currentNonce++);
      const index = Math.floor(floatVal * tiles.length);
      const [chosen] = tiles.splice(index, 1);
      mines.push(chosen);
    }

    return mines.sort((a, b) => a - b);
  }

  /**
   * Calculates progressive multiplier for k revealed safe gems with B mines on 25 tiles
   */
  public static calculateMultiplier(gemsRevealedCount: number, mineCount: number, houseEdgePercent: number = 1.0): number {
    if (gemsRevealedCount <= 0) return 1.00;

    const totalTiles = 25;
    const safeTilesTotal = totalTiles - mineCount;
    if (gemsRevealedCount > safeTilesTotal) return 0;

    let probabilityRatio = 1.0;
    for (let i = 0; i < gemsRevealedCount; i++) {
      probabilityRatio *= (totalTiles - i) / (safeTilesTotal - i);
    }

    const houseMultiplier = (100 - houseEdgePercent) / 100;
    const rawMultiplier = houseMultiplier * probabilityRatio;
    return Math.floor(rawMultiplier * 100) / 100;
  }

  protected validateParams(params: MinesParams): { valid: boolean; error?: string } {
    if (!params || typeof params.mineCount !== 'number') {
      return { valid: false, error: 'Mine count is required' };
    }

    if (params.mineCount < 1 || params.mineCount > 24) {
      return { valid: false, error: 'Mine count must be between 1 and 24' };
    }

    if (params.revealedTiles && Array.isArray(params.revealedTiles)) {
      for (const tile of params.revealedTiles) {
        if (typeof tile !== 'number' || tile < 0 || tile > 24) {
          return { valid: false, error: 'Revealed tile index must be between 0 and 24' };
        }
      }
    }

    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<MinesParams>): GameExecutionOutput<MinesOutcome> {
    const { mineCount, revealedTiles = [] } = input.params;
    const minePositions = MinesEngine.generateMinePositions(
      input.serverSeed,
      input.clientSeed,
      input.nonce,
      mineCount
    );

    // Check if any revealed tile hit a bomb
    const bombHitTile = revealedTiles.find((t: number) => minePositions.includes(t));
    const isBombHit = bombHitTile !== undefined;

    let currentMultiplier = 0;
    let nextMultiplier = 0;
    let won = false;

    if (isBombHit) {
      won = false;
      currentMultiplier = 0;
    } else {
      const gemsRevealedCount = revealedTiles.length;
      currentMultiplier = MinesEngine.calculateMultiplier(gemsRevealedCount, mineCount, this.config.houseEdgePercent);
      nextMultiplier = MinesEngine.calculateMultiplier(gemsRevealedCount + 1, mineCount, this.config.houseEdgePercent);
      won = true;
    }

    const { payout, profit } = this.calculatePayout(input.amount, currentMultiplier);

    return {
      won,
      multiplier: currentMultiplier,
      payout,
      profit,
      outcome: {
        mineCount,
        minePositions,
        revealedTiles,
        isBombHit,
        currentMultiplier,
        nextMultiplier,
        gemsRevealedCount: revealedTiles.length,
      },
    };
  }
}
