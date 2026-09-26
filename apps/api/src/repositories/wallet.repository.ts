import { prisma } from '../config/database.js';

export class WalletRepository {
  static async findByUserId(userId: string) {
    return prisma.wallet.findUnique({
      where: { userId },
    });
  }

  static async updateBalance(walletId: string, newBalance: number) {
    return prisma.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance },
    });
  }
}
