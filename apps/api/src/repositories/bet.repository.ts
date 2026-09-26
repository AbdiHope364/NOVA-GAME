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
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  }) {
    return prisma.bet.create({
      data,
    });
  }

  static async findRecentBets(limit: number = 20) {
    return prisma.bet.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, avatarUrl: true } } },
    });
  }

  static async findUserBets(userId: string, limit: number = 20) {
    return prisma.bet.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
