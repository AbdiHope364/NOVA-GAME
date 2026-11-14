import { prisma } from '../config/database.js';

export interface AbuseCheckResult {
  allowed: boolean;
  reason?: string;
}

export class AbuseService {
  static readonly MIN_STAKE_SANTIM = 1000n; // 10.00 ETB
  static readonly MAX_STAKE_SANTIM = 500000n; // 5,000.00 ETB
  static readonly DAILY_LOSS_LIMIT_SANTIM = 2000000n; // 20,000.00 ETB
  static readonly COOLDOWN_MS = 10000; // 10s cooldown between matches

  private static lastMatchTimestamps = new Map<string, number>();

  /**
   * Validates stake limits, user daily loss limit, and match creation cooldown.
   */
  static async validateMatchPreconditions(userId: string, stakeMinor: bigint): Promise<AbuseCheckResult> {
    // Cooldown check (skipped for demo-guest to enable fluid testing)
    if (userId !== 'demo-guest') {
      const lastTime = this.lastMatchTimestamps.get(userId) || 0;
      const now = Date.now();
      if (now - lastTime < this.COOLDOWN_MS) {
        const waitSec = Math.ceil((this.COOLDOWN_MS - (now - lastTime)) / 1000);
        return {
          allowed: false,
          reason: `Please wait ${waitSec}s before initiating or joining another match`,
        };
      }
    }

    // Free-to-play matches (0 stake) are exempt from financial limits
    if (stakeMinor === 0n) {
      return { allowed: true };
    }

    if (stakeMinor < this.MIN_STAKE_SANTIM) {
      return {
        allowed: false,
        reason: `Stake must be at least ${(Number(this.MIN_STAKE_SANTIM) / 100).toFixed(2)} ETB (or 0 for Free Play)`,
      };
    }

    if (stakeMinor > this.MAX_STAKE_SANTIM) {
      return {
        allowed: false,
        reason: `Stake cannot exceed ${(Number(this.MAX_STAKE_SANTIM) / 100).toFixed(2)} ETB`,
      };
    }

    // Daily loss limit check
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLosses = await prisma.ledgerEntry.findMany({
      where: {
        actorId: userId,
        type: 'STAKE_LOCK',
        createdAt: { gte: oneDayAgo },
      },
    });

    const recentWins = await prisma.ledgerEntry.findMany({
      where: {
        actorId: userId,
        type: 'MATCH_PAYOUT',
        createdAt: { gte: oneDayAgo },
      },
    });

    const totalStaked = recentLosses.reduce((acc, entry) => acc + (-entry.amount), 0n);
    const totalWon = recentWins.reduce((acc, entry) => acc + entry.amount, 0n);
    const netLoss = totalStaked > totalWon ? totalStaked - totalWon : 0n;

    if (netLoss + stakeMinor > this.DAILY_LOSS_LIMIT_SANTIM) {
      // Flag in abuse table
      await this.logFlag(
        userId,
        'LOSS_LIMIT_EXCEEDED',
        {
          netLoss: netLoss.toString(),
          stakeAttempted: stakeMinor.toString(),
          dailyLimit: this.DAILY_LOSS_LIMIT_SANTIM.toString(),
        }
      );

      return {
        allowed: false,
        reason: 'Daily loss limit of 20,000.00 ETB exceeded. Take a break and try again tomorrow.',
      };
    }

    return { allowed: true };
  }

  static recordUserActivity(userId: string) {
    this.lastMatchTimestamps.set(userId, Date.now());
  }

  /**
   * Anti-collusion pairing check: flags if >3 matches in an hour or >10 in 24 hours between the same two accounts.
   */
  static async checkPairingCollusion(playerA: string, playerB: string, matchId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const matchesLast24h = await prisma.match.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
        OR: [
          { whiteUserId: playerA, blackUserId: playerB },
          { whiteUserId: playerB, blackUserId: playerA },
        ],
      },
      select: { id: true, createdAt: true, winnerId: true, stakeMinor: true },
    });

    const matchesLast1h = matchesLast24h.filter((m) => m.createdAt >= oneHourAgo);

    if (matchesLast1h.length >= 3) {
      await this.logFlag(playerA, 'REPEAT_PAIRING', {
        matchId,
        opponentId: playerB,
        matchesLastHour: matchesLast1h.length,
        severity: 'HIGH',
      }, matchId);
    }

    if (matchesLast24h.length >= 10) {
      await this.logFlag(playerA, 'REPEAT_PAIRING', {
        matchId,
        opponentId: playerB,
        matchesLast24h: matchesLast24h.length,
        severity: 'HIGH',
      }, matchId);
    }

    // One-sided transfer check (same player losing >=80% of stakes over 5+ matches)
    if (matchesLast24h.length >= 5) {
      const pALosses = matchesLast24h.filter((m) => m.winnerId === playerB).length;
      const pBLosses = matchesLast24h.filter((m) => m.winnerId === playerA).length;

      if (pALosses / matchesLast24h.length >= 0.8) {
        await this.logFlag(playerA, 'ONE_SIDED_TRANSFER', {
          matchId,
          suspectedBeneficiary: playerB,
          lossRatio: `${((pALosses / matchesLast24h.length) * 100).toFixed(1)}%`,
          sampleSize: matchesLast24h.length,
        }, matchId);
      } else if (pBLosses / matchesLast24h.length >= 0.8) {
        await this.logFlag(playerB, 'ONE_SIDED_TRANSFER', {
          matchId,
          suspectedBeneficiary: playerA,
          lossRatio: `${((pBLosses / matchesLast24h.length) * 100).toFixed(1)}%`,
          sampleSize: matchesLast24h.length,
        }, matchId);
      }
    }
  }

  /**
   * Move timing anomaly detection: checks if avg move time < 200ms (scripted) or identical cadence (bot).
   */
  static async checkMoveTimingAnomaly(
    userId: string,
    matchId: string,
    moveDurationsMs: number[]
  ) {
    if (moveDurationsMs.length < 5) return;

    const avg = moveDurationsMs.reduce((a, b) => a + b, 0) / moveDurationsMs.length;

    if (avg < 200) {
      await this.logFlag(userId, 'RAPID_MOVES', {
        matchId,
        avgMoveTimeMs: Math.round(avg),
        sampleSize: moveDurationsMs.length,
        note: 'Superhuman speed (<200ms average), suspected script/bot',
      }, matchId);
    }

    // Standard deviation check for robotic clock rhythm
    const variance =
      moveDurationsMs.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / moveDurationsMs.length;
    const stdDev = Math.sqrt(variance);

    if (moveDurationsMs.length >= 8 && stdDev < 30) {
      await this.logFlag(userId, 'RAPID_MOVES', {
        matchId,
        avgMoveTimeMs: Math.round(avg),
        stdDevMs: Math.round(stdDev),
        note: 'Near-zero timing variance across 8+ moves, suspected robotic macro',
      }, matchId);
    }
  }

  static async logFlag(
    userId: string,
    type: 'REPEAT_PAIRING' | 'RAPID_MOVES' | 'ONE_SIDED_TRANSFER' | 'LOSS_LIMIT_EXCEEDED',
    details: any,
    matchId?: string
  ) {
    try {
      await prisma.abuseFlag.create({
        data: {
          userId,
          matchId: matchId || null,
          type,
          details: JSON.stringify(details),
        },
      });
    } catch (err) {
      console.error('[AbuseService] Error recording abuse flag:', err);
    }
  }

  static async getAbuseFlags() {
    return prisma.abuseFlag.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

