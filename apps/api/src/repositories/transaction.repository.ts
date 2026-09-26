import { prisma } from '../config/database.js';
import { TransactionType } from '@nova/types';

export class TransactionRepository {
  static async createTransaction(data: {
    walletId: string;
    amount: number;
    type: TransactionType;
    referenceId?: string;
    description?: string;
  }) {
    return prisma.transaction.create({
      data,
    });
  }

  static async findWalletTransactions(walletId: string, limit: number = 20) {
    return prisma.transaction.findMany({
      where: { walletId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
