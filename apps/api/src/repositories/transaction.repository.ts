import { prisma } from '../config/database.js';

export class TransactionRepository {
  static async createTransaction(
    data: {
      walletId: string;
      amount: number;
      type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET_PLACED' | 'BET_WON' | 'BET_REFUND' | 'BONUS';
      status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REJECTED';
      balanceAfter?: number;
      referenceId?: string;
      phoneNumber?: string;
      receiptUrl?: string;
      paymentMethod?: string;
      description?: string;
    },
    tx?: any
  ) {
    const client = tx || prisma;
    return client.transaction.create({
      data: {
        walletId: data.walletId,
        amount: Math.round(data.amount),
        type: data.type,
        status: data.status || 'COMPLETED',
        balanceAfter: data.balanceAfter !== undefined ? Math.round(data.balanceAfter) : undefined,
        referenceId: data.referenceId,
        phoneNumber: data.phoneNumber,
        receiptUrl: data.receiptUrl,
        paymentMethod: data.paymentMethod,
        description: data.description,
      },
    });
  }

  static async findById(id: string, tx?: any) {
    const client = tx || prisma;
    return client.transaction.findUnique({
      where: { id },
      include: {
        wallet: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
        },
      },
    });
  }

  static async findByReferenceId(referenceId: string, tx?: any) {
    const client = tx || prisma;
    return client.transaction.findUnique({
      where: { referenceId },
    });
  }

  static async findByWalletId(walletId: string, limit = 20, tx?: any) {
    const client = tx || prisma;
    return client.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async findPendingDeposits(tx?: any) {
    const client = tx || prisma;
    return client.transaction.findMany({
      where: {
        type: 'DEPOSIT',
        status: 'PENDING',
      },
      include: {
        wallet: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateStatus(
    id: string,
    status: 'COMPLETED' | 'FAILED' | 'REJECTED',
    approvedBy?: string,
    balanceAfter?: number,
    tx?: any
  ) {
    const client = tx || prisma;
    return client.transaction.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: new Date(),
        ...(balanceAfter !== undefined ? { balanceAfter: Math.round(balanceAfter) } : {}),
      },
    });
  }
}

