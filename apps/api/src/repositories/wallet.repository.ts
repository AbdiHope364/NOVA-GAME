import { prisma } from '../config/database.js';

export class WalletRepository {
  static async findByUserId(userId: string, tx?: any) {
    const client = tx || prisma;
    let wallet = await client.wallet.findUnique({
      where: { userId },
    });

    if (!wallet && userId === 'demo-guest') {
      let user = await client.user.findUnique({ where: { id: 'demo-guest' } });
      if (!user) {
        user = await client.user.create({
          data: {
            id: 'demo-guest',
            username: 'DemoGuest',
            email: 'demo@guest.local',
            passwordHash: 'demohash',
          },
        });
      }
      wallet = await client.wallet.create({
        data: {
          userId: 'demo-guest',
          balance: 100000, // 1,000.00 ETB in Santim
          currency: 'ETB',
          version: 0,
        },
      });
    }

    return wallet;
  }

  static async createWallet(userId: string, initialBalanceSantim = 100000, tx?: any) {
    const client = tx || prisma;
    return client.wallet.create({
      data: {
        userId,
        balance: initialBalanceSantim,
        currency: 'ETB',
        version: 0,
      },
    });
  }

  static async updateBalance(walletId: string, newBalance: number, tx?: any) {
    const client = tx || prisma;
    return client.wallet.update({
      where: { id: walletId },
      data: {
        balance: Math.round(newBalance),
        version: { increment: 1 },
      },
    });
  }

  static async updateBalanceWithVersion(
    walletId: string,
    currentVersion: number,
    newBalance: number,
    tx?: any
  ) {
    const client = tx || prisma;
    const result = await client.wallet.updateMany({
      where: {
        id: walletId,
        version: currentVersion,
      },
      data: {
        balance: Math.round(newBalance),
        version: { increment: 1 },
      },
    });
    return result.count > 0;
  }
}

