import * as crypto from 'crypto';

export class ProvablyFair {
  /**
   * Generates a secure random 64-character hex string as server seed
   */
  static generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hashes a server seed using SHA-256 for public disclosure before betting
   */
  static hashServerSeed(serverSeed: string): string {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }

  /**
   * Generates a random client seed string if player doesn't supply one
   */
  static generateClientSeed(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Computes HMAC-SHA256 signature from serverSeed, clientSeed, and nonce
   */
  static generateHmacHex(serverSeed: string, clientSeed: string, nonce: number): string {
    const message = `${clientSeed}:${nonce}`;
    return crypto.createHmac('sha256', serverSeed).update(message).digest('hex');
  }

  /**
   * Generates a deterministic float [0, 1) from the HMAC hash
   */
  static generateFloat(serverSeed: string, clientSeed: string, nonce: number): number {
    const hmac = this.generateHmacHex(serverSeed, clientSeed, nonce);
    // Take the first 8 characters (4 bytes / 32 bits) of the HMAC string
    const subHash = hmac.substring(0, 8);
    const num = parseInt(subHash, 16);
    return num / 0x100000000; // 2^32
  }

  /**
   * Generates a deterministic integer between min and max (inclusive)
   */
  static generateInt(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    min: number,
    max: number
  ): number {
    const floatVal = this.generateFloat(serverSeed, clientSeed, nonce);
    return Math.floor(floatVal * (max - min + 1)) + min;
  }

  /**
   * Generates crash point multiplier for Crash game (1.00x - 1,000,000.00x)
   * Standard provably fair algorithm formula:
   * E.g. (100 - houseEdge) / (100 - floatVal * 99)
   */
  static generateCrashPoint(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    houseEdgePercent: number = 1.0
  ): number {
    const floatVal = this.generateFloat(serverSeed, clientSeed, nonce);
    
    // Check for instant crash (e.g. 1 in 33 chance or 3% instant crash depending on house edge)
    const instantCrashThreshold = houseEdgePercent / 100;
    if (floatVal < instantCrashThreshold) {
      return 1.00;
    }

    const houseMultiplier = (100 - houseEdgePercent) / 100;
    const rawMultiplier = houseMultiplier / (1 - floatVal);
    
    // Truncate to 2 decimal places
    const crashPoint = Math.floor(rawMultiplier * 100) / 100;
    return Math.max(1.00, crashPoint);
  }

  /**
   * Verification function allowing clients to verify past game outcomes
   */
  static verifyResult(
    serverSeed: string,
    serverSeedHash: string,
    clientSeed: string,
    nonce: number
  ): { isValidHash: boolean; floatValue: number; hmac: string } {
    const computedHash = this.hashServerSeed(serverSeed);
    const isValidHash = computedHash === serverSeedHash;
    const hmac = this.generateHmacHex(serverSeed, clientSeed, nonce);
    const floatValue = this.generateFloat(serverSeed, clientSeed, nonce);

    return {
      isValidHash,
      floatValue,
      hmac,
    };
  }
}
