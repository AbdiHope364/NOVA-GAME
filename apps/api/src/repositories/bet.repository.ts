import { prisma } from '../config/database.js';

export class BetRepository {
  static async createBet(data: {
    userId: string;
    seedId?: string;
    gameId: string;
    amount: number;
    multiplier: number;
    payout: number;
    profit: number;
    won: boolean;
    outcome: any;
    serverSeed?: string;
    serverSeedHash?: string;
    clientSeed?: string;
    nonce?: number;
  }) {
    return prisma.bet.create({
      data: {
        userId: data.userId,
        gameId: data.gameId,
        amount: data.amount,
        multiplier: data.multiplier,
        payout: data.payout,
        profit: data.profit,
        won: data.won,
        outcome: JSON.stringify(data.outcome),
        serverSeed: data.serverSeed || '',
        serverSeedHash: data.serverSeedHash || '',
        clientSeed: data.clientSeed || '',
        nonce: data.nonce || 0,
      },
    });
  }

  static async findByUserId(userId: string, limit = 20) {
    return prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async getRecentBets(limit = 10) {
    return prisma.bet.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { username: true } } },
    });
  }
}
