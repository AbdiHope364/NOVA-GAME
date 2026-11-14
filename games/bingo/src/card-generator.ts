import { ProvablyFair } from '@nova/fairness';
import { BingoCardData } from '@nova/types';

export class BingoCardGenerator {
  /**
   * Deterministically generates a 75-ball 5x5 Bingo Card with FREE center
   */
  static generateCard(serverSeed: string, clientSeed: string, nonce: number, cardId: string = 'CARD-1'): BingoCardData {
    const getRandomNumbersInRange = (min: number, max: number, count: number, offset: number): number[] => {
      const pool: number[] = [];
      for (let i = min; i <= max; i++) pool.push(i);

      const result: number[] = [];
      for (let i = 0; i < count; i++) {
        const randFloat = ProvablyFair.generateFloat(serverSeed, clientSeed, nonce + offset + i);
        const idx = Math.floor(randFloat * pool.length);
        result.push(pool.splice(idx, 1)[0]);
      }
      return result;
    };

    const bCol = getRandomNumbersInRange(1, 15, 5, 10);
    const iCol = getRandomNumbersInRange(16, 30, 5, 20);
    const nCol = getRandomNumbersInRange(31, 45, 4, 30); // 4 numbers + FREE center
    const gCol = getRandomNumbersInRange(46, 60, 5, 40);
    const oCol = getRandomNumbersInRange(61, 75, 5, 50);

    const grid: number[][] = Array(5)
      .fill(0)
      .map(() => Array(5).fill(0));

    const marked: boolean[][] = Array(5)
      .fill(false)
      .map(() => Array(5).fill(false));

    for (let row = 0; row < 5; row++) {
      grid[row][0] = bCol[row];
      grid[row][1] = iCol[row];
      grid[row][2] = row === 2 ? 0 : nCol[row > 2 ? row - 1 : row];
      grid[row][3] = gCol[row];
      grid[row][4] = oCol[row];
    }

    // Center tile [2][2] is FREE space
    marked[2][2] = true;

    return {
      id: cardId,
      grid,
      marked,
    };
  }
}
