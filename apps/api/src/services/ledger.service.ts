import { prisma } from '../config/database.js';
import type { Prisma } from '@nova/database';

export type LedgerEntryType =
  | 'STAKE_LOCK'
  | 'STAKE_REFUND'
  | 'MATCH_PAYOUT'
  | 'RAKE'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'BET_PLACED'
  | 'BET_WON'
  | 'BONUS';

export class InsufficientFundsError extends Error {
  statusCode: number;
  constructor(message = 'Insufficient funds for this transaction') {
    super(message);
    this.name = 'InsufficientFundsError';
    this.statusCode = 400;
  }
}

export interface RecordEntryParams {
  walletId: string;
  amount: bigint | number; // Positive = Credit, Negative = Debit (Santim minor units)
  type: LedgerEntryType;
  idempotencyKey: string;
  actorId?: string | null;
  meta?: any;
}

export interface LedgerResult {
  entry: any;
  isDuplicate: boolean;
  balanceAfter: bigint;
}

// In-process lock per wallet to serialize concurrent ledger transactions cleanly
const walletLocks = new Map<string, Promise<any>>();

export class LedgerService {
  /**
   * Executes a ledger transaction with atomic conditional balance update and idempotency protection.
   * If a transaction with the same idempotencyKey already exists, returns the existing record without re-applying.
   */
  static async recordEntry(
    params: RecordEntryParams,
    txClient?: Prisma.TransactionClient
  ): Promise<LedgerResult> {
    const executeWithLock = async (): Promise<LedgerResult> => {
      const amountMinor = BigInt(params.amount);

      const execute = async (tx: Prisma.TransactionClient): Promise<LedgerResult> => {
        // 1. Idempotency Check: if entry exists, return it immediately
        const existing = await tx.ledgerEntry.findUnique({
          where: { idempotencyKey: params.idempotencyKey },
        });

        if (existing) {
          return {
            entry: existing,
            isDuplicate: true,
            balanceAfter: existing.balanceAfter,
          };
        }

        let balanceAfter: bigint;

        // 2. Conditional Balance Update
        if (amountMinor < 0n) {
          const absDebit = -amountMinor;
          const debitInt = Number(absDebit);

          // Atomic conditional decrement: balance must be >= debitInt
          const updateResult = await tx.wallet.updateMany({
            where: {
              id: params.walletId,
              balance: { gte: debitInt },
            },
            data: {
              balance: { decrement: debitInt },
              version: { increment: 1 },
            },
          });

          if (updateResult.count === 0) {
            throw new InsufficientFundsError(
              `Insufficient wallet balance for debit of ${absDebit.toString()} Santim`
            );
          }

          const wallet = await tx.wallet.findUniqueOrThrow({
            where: { id: params.walletId },
            select: { balance: true },
          });
          balanceAfter = BigInt(wallet.balance);
        } else if (amountMinor > 0n) {
          const creditInt = Number(amountMinor);
          const updatedWallet = await tx.wallet.update({
            where: { id: params.walletId },
            data: {
              balance: { increment: creditInt },
              version: { increment: 1 },
            },
            select: { balance: true },
          });
          balanceAfter = BigInt(updatedWallet.balance);
        } else {
          const wallet = await tx.wallet.findUniqueOrThrow({
            where: { id: params.walletId },
            select: { balance: true },
          });
          balanceAfter = BigInt(wallet.balance);
        }

        // 3. Create Append-Only Ledger Entry
        const entry = await tx.ledgerEntry.create({
          data: {
            walletId: params.walletId,
            amount: amountMinor,
            balanceAfter,
            type: params.type,
            idempotencyKey: params.idempotencyKey,
            actorId: params.actorId || null,
            meta: params.meta ? JSON.stringify(params.meta) : null,
          },
        });

        return {
          entry,
          isDuplicate: false,
          balanceAfter,
        };
      };

      if (txClient) {
        return execute(txClient);
      }

      return prisma.$transaction(
        async (tx) => {
          return execute(tx);
        },
        { timeout: 15000 }
      );
    };

    if (txClient) {
      return executeWithLock();
    }

    // Wait for any prior in-process lock on this wallet
    const prevLock = walletLocks.get(params.walletId) || Promise.resolve();
    let resolveCurrentLock: () => void;
    const currentLock = new Promise<void>((resolve) => {
      resolveCurrentLock = resolve;
    });

    walletLocks.set(params.walletId, currentLock);

    try {
      await prevLock;
      return await executeWithLock();
    } finally {
      if (walletLocks.get(params.walletId) === currentLock) {
        walletLocks.delete(params.walletId);
      }
      resolveCurrentLock!();
    }
  }

  /**
   * Locks player stake for a match: idempotency key: match:{matchId}:stake:{userId}
   */
  static async lockStake(
    matchId: string,
    userId: string,
    stakeMinor: bigint | number,
    txClient?: Prisma.TransactionClient
  ): Promise<LedgerResult> {
    const client = txClient || prisma;
    let wallet = await client.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Auto-provision if needed
      wallet = await client.wallet.create({
        data: { userId, balance: 100000 },
      });
    }

    const idempotencyKey = `match:${matchId}:stake:${userId}`;
    const amountToDebit = -BigInt(stakeMinor);

    return this.recordEntry(
      {
        walletId: wallet.id,
        amount: amountToDebit,
        type: 'STAKE_LOCK',
        idempotencyKey,
        actorId: userId,
        meta: { matchId, userId, action: 'STAKE_LOCK' },
      },
      txClient
    );
  }

  /**
   * Settles winner payout: idempotency key: match:{matchId}:payout
   * Payout = Total Pot - Rake
   */
  static async settlePayout(
    matchId: string,
    winnerUserId: string,
    payoutMinor: bigint | number,
    rakeMinor: bigint | number,
    txClient?: Prisma.TransactionClient
  ): Promise<LedgerResult> {
    const client = txClient || prisma;
    let wallet = await client.wallet.findUnique({
      where: { userId: winnerUserId },
    });

    if (!wallet) {
      wallet = await client.wallet.create({
        data: { userId: winnerUserId, balance: 100000 },
      });
    }

    const idempotencyKey = `match:${matchId}:payout`;
    const amountToCredit = BigInt(payoutMinor);

    return this.recordEntry(
      {
        walletId: wallet.id,
        amount: amountToCredit,
        type: 'MATCH_PAYOUT',
        idempotencyKey,
        actorId: winnerUserId,
        meta: {
          matchId,
          winnerUserId,
          payoutMinor: payoutMinor.toString(),
          rakeMinor: rakeMinor.toString(),
          action: 'MATCH_PAYOUT',
        },
      },
      txClient
    );
  }

  /**
   * Refunds stake to a player (e.g. Draw, Cancel, or Abort): idempotency key: match:{matchId}:refund:{userId}
   */
  static async refundStake(
    matchId: string,
    userId: string,
    stakeMinor: bigint | number,
    reason: string,
    txClient?: Prisma.TransactionClient
  ): Promise<LedgerResult> {
    const client = txClient || prisma;
    let wallet = await client.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await client.wallet.create({
        data: { userId, balance: 100000 },
      });
    }

    const idempotencyKey = `match:${matchId}:refund:${userId}`;
    const amountToCredit = BigInt(stakeMinor);

    return this.recordEntry(
      {
        walletId: wallet.id,
        amount: amountToCredit,
        type: 'STAKE_REFUND',
        idempotencyKey,
        actorId: userId,
        meta: {
          matchId,
          userId,
          reason,
          action: 'STAKE_REFUND',
        },
      },
      txClient
    );
  }
}
