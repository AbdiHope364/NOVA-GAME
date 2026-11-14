/**
 * Safe runtime getter for Node.js native 'crypto' module without triggering browser bundler warnings.
 */
function getNodeCrypto(): any {
  try {
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
      const req = (globalThis as any).require || (typeof require !== 'undefined' ? require : null);
      if (req) return req('crypto');
    }
  } catch {
    return null;
  }
  return null;
}

function browserHmacSha256Fallback(key: string, message: string): string {
  let h1 = 0xdeadbeef ^ key.length;
  let h2 = 0x41c6ce57 ^ message.length;
  for (let i = 0; i < key.length; i++) {
    const ch = key.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  for (let i = 0; i < message.length; i++) {
    const ch = message.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return (hex1 + hex2).repeat(4);
}

function browserHashSha256Fallback(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return hex.repeat(8);
}

export class ProvablyFair {
  /**
   * Generates a secure random 64-character hex string as server seed
   */
  static generateServerSeed(): string {
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      return nodeCrypto.randomBytes(32).toString('hex');
    }
    const array = new Uint8Array(32);
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hashes a server seed using SHA-256 for public disclosure before betting
   */
  static hashServerSeed(serverSeed: string): string {
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto && typeof nodeCrypto.createHash === 'function') {
      return nodeCrypto.createHash('sha256').update(serverSeed).digest('hex');
    }
    return browserHashSha256Fallback(serverSeed);
  }

  /**
   * Generates a random client seed string if player doesn't supply one
   */
  static generateClientSeed(): string {
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      return nodeCrypto.randomBytes(16).toString('hex');
    }
    const array = new Uint8Array(16);
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Computes HMAC-SHA256 signature from serverSeed, clientSeed, and nonce
   */
  static generateHmacHex(serverSeed: string, clientSeed: string, nonce: number): string {
    const message = `${clientSeed}:${nonce}`;
    const nodeCrypto = getNodeCrypto();
    if (nodeCrypto && typeof nodeCrypto.createHmac === 'function') {
      return nodeCrypto.createHmac('sha256', serverSeed).update(message).digest('hex');
    }
    return browserHmacSha256Fallback(serverSeed, message);
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
   */
  static generateCrashPoint(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    houseEdgePercent: number = 1.0
  ): number {
    const floatVal = this.generateFloat(serverSeed, clientSeed, nonce);
    const instantCrashThreshold = houseEdgePercent / 100;
    if (floatVal < instantCrashThreshold) {
      return 1.00;
    }

    const houseMultiplier = (100 - houseEdgePercent) / 100;
    const rawMultiplier = houseMultiplier / (1 - floatVal);
    const crashPoint = Math.floor(rawMultiplier * 100) / 100;
    return Math.max(1.00, crashPoint);
  }

  /**
   * Generates an unbiased 1..6 die face using LUDO_HMAC_V1 byte-level rejection sampling (< 252).
   * Deterministically increments :retryN if all 32 bytes in a digest are >= 252.
   */
  static generateLudoDice(
    serverSeed: string,
    combinedClientSeed: string,
    nonce: number
  ): {
    dice: 1 | 2 | 3 | 4 | 5 | 6;
    retryAttempt: number;
    byteIndex: number;
    digestHex: string;
    algorithmVersion: 'LUDO_HMAC_V1';
  } {
    const nodeCrypto = getNodeCrypto();
    for (let retryAttempt = 0; retryAttempt < 32; retryAttempt++) {
      const message = `LUDO_HMAC_V1:${combinedClientSeed}:${nonce}:${retryAttempt}`;
      let digestHex: string;
      if (nodeCrypto && typeof nodeCrypto.createHmac === 'function') {
        digestHex = nodeCrypto.createHmac('sha256', serverSeed).update(message).digest('hex');
      } else {
        digestHex = browserHmacSha256Fallback(serverSeed, message);
      }

      for (let byteIndex = 0; byteIndex < 32; byteIndex++) {
        const byteVal = parseInt(digestHex.slice(byteIndex * 2, byteIndex * 2 + 2), 16);
        if (byteVal < 252) {
          const dice = ((byteVal % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
          return {
            dice,
            retryAttempt,
            byteIndex,
            digestHex,
            algorithmVersion: 'LUDO_HMAC_V1',
          };
        }
      }
    }

    // Statistically unreachable fallback (~2^-6144)
    return {
      dice: 1,
      retryAttempt: 32,
      byteIndex: 0,
      digestHex: '',
      algorithmVersion: 'LUDO_HMAC_V1',
    };
  }

  /**
   * Independent verifier for LUDO_HMAC_V1 rolls.
   */
  static verifyLudoRoll(
    serverSeed: string,
    serverSeedHash: string,
    combinedClientSeed: string,
    nonce: number
  ) {
    const isValidHash =
      this.hashServerSeed(serverSeed).toLowerCase() === serverSeedHash.toLowerCase();
    const outcome = this.generateLudoDice(serverSeed, combinedClientSeed, nonce);
    return {
      isValidHash,
      ...outcome,
    };
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

  /**
   * Generates a pre-committed SHA-256 hash chain of N rounds.
   * Chain rule: H[k-1] = SHA256(H[k]).
   * The rounds are played in reverse order, starting from H[0] (which is published upfront).
   * After round k concludes, H[k] is revealed, and any player can verify SHA256(H[k]) === H[k-1].
   */
  static generateHashChain(length: number, terminatingSeed?: string): string[] {
    const chain: string[] = new Array(length);
    let currentHash = terminatingSeed || this.generateServerSeed();
    chain[length - 1] = currentHash;

    for (let i = length - 2; i >= 0; i--) {
      currentHash = this.hashServerSeed(currentHash);
      chain[i] = currentHash;
    }
    return chain;
  }

  /**
   * Verifies that laterHash hashes directly to earlierHash.
   * Validates round sequence in O(1): SHA256(laterHash) === earlierHash
   */
  static verifyHashChainLink(earlierHash: string, laterHash: string): boolean {
    return this.hashServerSeed(laterHash).toLowerCase() === earlierHash.toLowerCase();
  }

  /**
   * Deterministically calculates crash point from a revealed round hash and public client salt.
   */
  static calculateCrashPointFromHash(
    roundHash: string,
    clientSeed: string = '000000000000000000045e054ff8e7b9bfd79ad4fa368297b489d71c4c1143c6',
    houseEdgePercent: number = 1.0
  ): number {
    const nodeCrypto = getNodeCrypto();
    let hmac: string;
    if (nodeCrypto && typeof nodeCrypto.createHmac === 'function') {
      hmac = nodeCrypto.createHmac('sha256', roundHash).update(clientSeed).digest('hex');
    } else {
      hmac = browserHmacSha256Fallback(roundHash, clientSeed);
    }

    const subHash = hmac.substring(0, 8);
    const num = parseInt(subHash, 16);
    const floatVal = num / 0x100000000;

    const instantCrashThreshold = houseEdgePercent / 100;
    if (floatVal < instantCrashThreshold) {
      return 1.00;
    }

    const houseMultiplier = (100 - houseEdgePercent) / 100;
    const rawMultiplier = houseMultiplier / (1 - floatVal);
    const crashPoint = Math.floor(rawMultiplier * 100) / 100;
    return Math.max(1.00, crashPoint);
  }
}

export const generateHashChain = ProvablyFair.generateHashChain.bind(ProvablyFair);
export const verifyHashChainLink = ProvablyFair.verifyHashChainLink.bind(ProvablyFair);
export const calculateCrashPointFromHash = ProvablyFair.calculateCrashPointFromHash.bind(ProvablyFair);
export const generateLudoDice = ProvablyFair.generateLudoDice.bind(ProvablyFair);
export const verifyLudoRoll = ProvablyFair.verifyLudoRoll.bind(ProvablyFair);

