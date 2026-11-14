import { ProvablyFair } from '@nova/fairness';

export interface BingoBall {
  letter: 'B' | 'I' | 'N' | 'G' | 'O';
  number: number;
}

export class BingoCaller {
  static getLetterForNumber(num: number): 'B' | 'I' | 'N' | 'G' | 'O' {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  }

  /**
   * Generates a provably fair shuffled draw pool of 75 balls
   */
  static generateDrawPool(serverSeed: string, clientSeed: string, nonce: number): BingoBall[] {
    const pool: number[] = Array.from({ length: 75 }, (_, i) => i + 1);
    const shuffled: BingoBall[] = [];

    let step = 0;
    while (pool.length > 0) {
      const floatVal = ProvablyFair.generateFloat(serverSeed, clientSeed, nonce + step);
      const index = Math.floor(floatVal * pool.length);
      const num = pool.splice(index, 1)[0];
      shuffled.push({
        letter: this.getLetterForNumber(num),
        number: num,
      });
      step++;
    }

    return shuffled;
  }
}
