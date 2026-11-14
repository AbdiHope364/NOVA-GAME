import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { PlinkoRisk, PlinkoParams, PlinkoOutcome } from '@nova/types';

export const TARGET_RTP = 0.99; // 1% house edge
export const MIN_ROWS = 8;
export const MAX_ROWS = 16;
export const RISK_STEEPNESS: Record<PlinkoRisk, number> = {
  low: 0.25,
  medium: 0.4,
  high: 0.6,
};

/** Binomial coefficient C(n, k) */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 1; i <= k; i++) {
    r = (r * (n - k + i)) / i;
  }
  return r;
}

/**
 * Build the payout table for a given row count and risk level.
 * Slots farther from the centre pay more; the whole table is scaled so the
 * expected return equals TARGET_RTP exactly (before 2-decimal rounding).
 */
export function buildMultipliers(rows: number, risk: PlinkoRisk): number[] {
  const alpha = RISK_STEEPNESS[risk];
  const centre = rows / 2;
  const total = Math.pow(2, rows);

  const shape = Array.from({ length: rows + 1 }, (_, k) => Math.exp(alpha * Math.abs(k - centre)));
  const probs = shape.map((_, k) => choose(rows, k) / total);
  const rtp = shape.reduce((sum, s, k) => sum + s * probs[k], 0);
  const scale = TARGET_RTP / rtp;

  return shape.map((s) => Math.round(s * scale * 100) / 100);
}

export class PlinkoEngine extends BaseGameEngine<PlinkoParams, PlinkoOutcome> {
  private readonly tables = new Map<string, number[]>();

  constructor() {
    super({
      gameId: 'plinko',
      name: 'Plinko Pyramid',
      houseEdgePercent: (1 - TARGET_RTP) * 100,
      minBet: 1.0,
      maxBet: 5000.0,
    });
  }

  protected validateParams(params: PlinkoParams): { valid: boolean; error?: string } {
    if (!params || !Number.isInteger(params.rows) || params.rows < MIN_ROWS || params.rows > MAX_ROWS) {
      return { valid: false, error: `rows must be an integer between ${MIN_ROWS} and ${MAX_ROWS}` };
    }
    if (!(params.risk in RISK_STEEPNESS)) {
      return { valid: false, error: 'risk must be low, medium or high' };
    }
    return { valid: true };
  }

  /** Public so the UI and verifier pages can display the exact payout table */
  public getMultipliers(rows: number, risk: PlinkoRisk): number[] {
    const key = `${rows}:${risk}`;
    let table = this.tables.get(key);
    if (!table) {
      table = buildMultipliers(rows, risk);
      this.tables.set(key, table);
    }
    return table;
  }

  public evaluate(input: GameExecutionInput<PlinkoParams>): GameExecutionOutput<PlinkoOutcome> {
    const { rows, risk } = input.params;

    // Cryptographic Provably Fair HMAC-SHA256(key = serverSeed, data = clientSeed:nonce).
    // Uses the platform ProvablyFair HMAC generator for 100% universal Node.js & browser compatibility.
    // 32-byte digest represented as 64 hex characters (each byte is 2 hex characters).
    // A byte value >= 128 (0x80) means 'R', else 'L', giving exact 50/50 binomial distribution.
    const hmacHex = ProvablyFair.generateHmacHex(input.serverSeed, input.clientSeed, input.nonce);

    const path: ('L' | 'R')[] = [];
    for (let i = 0; i < rows; i++) {
      const byteVal = parseInt(hmacHex.substring(i * 2, i * 2 + 2), 16);
      path.push(byteVal >= 128 ? 'R' : 'L');
    }

    const slot = path.filter((d) => d === 'R').length;
    const multipliers = this.getMultipliers(rows, risk);
    const slotMultiplier = multipliers[slot] ?? 1.0;

    const won = slotMultiplier > 1;
    const { payout, profit } = this.calculatePayout(input.amount, slotMultiplier);

    return {
      won,
      multiplier: slotMultiplier,
      payout,
      profit,
      outcome: {
        path,
        slot,
        rows,
        risk,
        slotMultiplier,
      },
    };
  }
}

