import { WalletRepository } from '../repositories/wallet.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { WalletServiceLogic } from '@nova/wallet';
import { prisma } from '../config/database.js';
import { PlatformSettingsService } from './platformSettings.service.js';
import { emitWalletUpdate } from '../websocket/socket.js';
import { BonusService } from './bonus.service.js';

export class WalletService {
  static async getWallet(userId: string) {
    if (userId === 'demo-guest') {
      return {
        id: 'wallet-demo-guest',
        userId: 'demo-guest',
        balance: 1000.0,
        cashBalance: 1000.0,
        bonusBalance: 0.0,
        lockedWinnings: 0.0,
        withdrawableBalance: 0.0,
        totalPlayableBalance: 1000.0,
        balanceInSantim: 100000,
        currency: 'ETB',
        lockedBalance: 0.0,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    let wallet = await WalletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await WalletRepository.createWallet(userId, 0);
    }

    const cashBalance = WalletServiceLogic.santimToEtb(wallet.balance);
    const bonusBalance = WalletServiceLogic.santimToEtb(wallet.bonusBalance || 0);
    const lockedWinnings = WalletServiceLogic.santimToEtb(wallet.lockedWinnings || 0);
    const withdrawableBalance = WalletServiceLogic.santimToEtb(wallet.withdrawableBalance || 0);

    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: cashBalance + bonusBalance,
      cashBalance,
      bonusBalance,
      lockedWinnings,
      withdrawableBalance,
      totalPlayableBalance: cashBalance + bonusBalance,
      balanceInSantim: wallet.balance,
      currency: wallet.currency,
      lockedBalance: WalletServiceLogic.santimToEtb(wallet.lockedBalance),
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  static async requestDeposit(
    userId: string,
    amountInEtb: number,
    paymentMethod: string,
    phoneNumber?: string,
    receiptUrl?: string,
    referenceId?: string
  ) {
    const platformSettings = await PlatformSettingsService.getSettings();
    if (amountInEtb < platformSettings.minDeposit || amountInEtb > platformSettings.maxDeposit) {
      throw {
        statusCode: 400,
        message: `Deposit amount must be between ${platformSettings.minDeposit} and ${platformSettings.maxDeposit} ETB.`,
      };
    }

    const cleanRefId = referenceId && referenceId.trim().length > 0 ? referenceId.trim() : undefined;

    if (cleanRefId) {
      const existing = await TransactionRepository.findByReferenceId(cleanRefId);
      if (existing) {
        throw {
          statusCode: 400,
          message: 'Duplicate payment reference ID. This reference has already been submitted and processed.',
        };
      }
    }

    const wallet = await WalletRepository.findByUserId(userId);
    if (!wallet) {
      throw { statusCode: 404, message: 'Wallet not found' };
    }

    const amountInSantim = WalletServiceLogic.etbToSantim(amountInEtb);

    const transaction = await TransactionRepository.createTransaction({
      walletId: wallet.id,
      amount: amountInSantim,
      type: 'DEPOSIT',
      status: 'PENDING',
      paymentMethod,
      phoneNumber,
      receiptUrl,
      referenceId: cleanRefId,
      description: `Manual Deposit of ${WalletServiceLogic.formatCurrency(amountInSantim)} via ${paymentMethod} (${phoneNumber || 'No phone'})`,
    });

    return {
      ...transaction,
      amountInEtb: WalletServiceLogic.santimToEtb(transaction.amount),
    };
  }

  static async getPendingDeposits() {
    const deposits = await TransactionRepository.findPendingDeposits();
    return deposits.map((d: any) => ({
      ...d,
      amountInEtb: WalletServiceLogic.santimToEtb(d.amount),
    }));
  }

  static async approveDeposit(transactionId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await TransactionRepository.findById(transactionId, tx);
      if (!transaction) throw { statusCode: 404, message: 'Deposit request not found' };
      if (transaction.status !== 'PENDING') {
        throw { statusCode: 400, message: `Deposit request is already ${transaction.status}` };
      }

      const wallet = transaction.wallet;
      const newBalanceInSantim = WalletServiceLogic.creditWin(wallet.balance, transaction.amount);

      // Optimistic concurrency update on wallet
      const updateResult = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          version: wallet.version,
        },
        data: {
          balance: newBalanceInSantim,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw { statusCode: 409, message: 'Wallet balance update conflict. Please retry approval.' };
      }

      // Mark transaction COMPLETED with immutable balance snapshot
      const updatedTx = await TransactionRepository.updateStatus(
        transactionId,
        'COMPLETED',
        adminId,
        newBalanceInSantim,
        tx
      );

      // Record administrative audit trail
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'DEPOSIT_APPROVED',
          targetId: transactionId,
          details: JSON.stringify({
            amountSantim: transaction.amount,
            amountEtb: WalletServiceLogic.santimToEtb(transaction.amount),
            userId: wallet.userId,
            referenceId: transaction.referenceId,
          }),
        },
      });

      // Process first-deposit eligibility, bonus winnings unlock, & referral rewards atomically
      await BonusService.onDepositApproved(tx, {
        userId: wallet.userId,
        walletId: wallet.id,
        transactionId,
        amountSantim: transaction.amount,
        newCashBalanceSantim: newBalanceInSantim,
        phoneNumber: transaction.phoneNumber,
        adminId,
      });

      const refreshedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      const finalCashEtb = WalletServiceLogic.santimToEtb(refreshedWallet?.balance ?? newBalanceInSantim);
      const finalBonusEtb = WalletServiceLogic.santimToEtb(refreshedWallet?.bonusBalance ?? 0);

      emitWalletUpdate(wallet.userId, {
        balance: finalCashEtb + finalBonusEtb,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: WalletServiceLogic.santimToEtb(transaction.amount),
        message: `Your deposit of ${WalletServiceLogic.santimToEtb(transaction.amount)} ETB has been approved!`,
      });

      return {
        transaction: updatedTx,
        newBalance: finalCashEtb + finalBonusEtb,
      };
    });
  }

  static async rejectDeposit(transactionId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await TransactionRepository.findById(transactionId, tx);
      if (!transaction) throw { statusCode: 404, message: 'Deposit request not found' };
      if (transaction.status !== 'PENDING') {
        throw { statusCode: 400, message: `Deposit request is already ${transaction.status}` };
      }

      const updated = await TransactionRepository.updateStatus(transactionId, 'REJECTED', adminId, undefined, tx);

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'DEPOSIT_REJECTED',
          targetId: transactionId,
          details: JSON.stringify({
            amountSantim: transaction.amount,
            userId: transaction.wallet.userId,
          }),
        },
      });

      emitWalletUpdate(transaction.wallet.userId, {
        type: 'DEPOSIT',
        status: 'REJECTED',
        amount: WalletServiceLogic.santimToEtb(transaction.amount),
        message: `Your deposit request of ${WalletServiceLogic.santimToEtb(transaction.amount)} ETB was rejected.`,
      });

      return updated;
    });
  }

  static async withdraw(userId: string, amountInEtb: number, destinationAddress: string) {
    const amountInSantim = WalletServiceLogic.etbToSantim(amountInEtb);
    const platformSettings = await PlatformSettingsService.getSettings();

    return prisma.$transaction(async (tx) => {
      const wallet = await WalletRepository.findByUserId(userId, tx);
      if (!wallet) throw { statusCode: 404, message: 'Wallet not found' };

      const eligibility = await tx.withdrawalEligibility.findUnique({ where: { userId } });
      if (!eligibility || !eligibility.firstDepositCompleted) {
        throw {
          statusCode: 403,
          message:
            eligibility?.ineligibleReason ||
            'A confirmed qualifying first real-money deposit is required before withdrawal.',
        };
      }
      if (!eligibility.isVerified) {
        throw {
          statusCode: 403,
          message: 'Account verification must be completed before requesting a withdrawal.',
        };
      }
      if (!eligibility.wageringCompleted && (wallet.bonusBalance > 0 || wallet.lockedWinnings > 0)) {
        throw {
          statusCode: 403,
          message: 'Complete active promotional wagering requirements before withdrawing.',
        };
      }

      const maxWithdrawableSantim = Math.min(
        wallet.withdrawableBalance > 0 ? wallet.withdrawableBalance : wallet.balance,
        wallet.balance - (wallet.lockedBalance || 0)
      );
      if (amountInSantim <= 0 || amountInSantim > maxWithdrawableSantim) {
        throw {
          statusCode: 400,
          message: `Insufficient withdrawable cash balance (available: ${WalletServiceLogic.formatCurrency(
            Math.max(0, maxWithdrawableSantim)
          )}). Promotional credit cannot be withdrawn directly.`,
        };
      }

      const requiresReview =
        amountInEtb >= platformSettings.autoWithdrawLimit ||
        WalletServiceLogic.requiresWithdrawalReview(amountInSantim);
      const newBalanceInSantim = WalletServiceLogic.deductBet(wallet.balance, amountInSantim);
      const newWithdrawableSantim = Math.max(0, (wallet.withdrawableBalance || wallet.balance) - amountInSantim);

      const updateResult = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          version: wallet.version,
        },
        data: {
          balance: newBalanceInSantim,
          withdrawableBalance: newWithdrawableSantim,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw { statusCode: 409, message: 'Wallet balance update conflict. Please retry withdrawal.' };
      }

      const withdrawalTx = await TransactionRepository.createTransaction(
        {
          walletId: wallet.id,
          amount: amountInSantim,
          type: 'WITHDRAWAL',
          status: requiresReview ? 'PENDING' : 'COMPLETED',
          balanceAfter: newBalanceInSantim,
          description: requiresReview
            ? `Withdrawal of ${WalletServiceLogic.formatCurrency(amountInSantim)} pending maker-checker security review`
            : `Withdrawal of ${WalletServiceLogic.formatCurrency(amountInSantim)} to ${destinationAddress}`,
        },
        tx
      );

      if (requiresReview) {
        await tx.adminAuditLog.create({
          data: {
            adminId: 'SYSTEM',
            action: 'WITHDRAWAL_FLAGGED_FOR_REVIEW',
            targetId: withdrawalTx.id,
            details: JSON.stringify({
              userId,
              amountSantim: amountInSantim,
              destinationAddress,
              reason: 'Exceeds automated 5,000 ETB withdrawal limit',
            }),
          },
        });
      }

      return {
        id: wallet.id,
        balance: WalletServiceLogic.santimToEtb(newBalanceInSantim),
        requiresReview,
        transactionId: withdrawalTx.id,
      };
    });
  }

  static async getPendingWithdrawals() {
    const withdrawals = await prisma.transaction.findMany({
      where: {
        type: 'WITHDRAWAL',
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

    return withdrawals.map((w: any) => ({
      ...w,
      amountInEtb: WalletServiceLogic.santimToEtb(w.amount),
    }));
  }

  static async approveWithdrawal(transactionId: string, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await TransactionRepository.findById(transactionId, tx);
      if (!transaction) throw { statusCode: 404, message: 'Withdrawal request not found' };
      if (transaction.status !== 'PENDING') {
        throw { statusCode: 400, message: `Withdrawal request is already ${transaction.status}` };
      }

      const updated = await TransactionRepository.updateStatus(transactionId, 'COMPLETED', adminId, undefined, tx);

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'WITHDRAWAL_APPROVED',
          targetId: transactionId,
          details: JSON.stringify({
            amountSantim: transaction.amount,
            amountEtb: WalletServiceLogic.santimToEtb(transaction.amount),
            userId: transaction.wallet.userId,
          }),
        },
      });

      return updated;
    });
  }

  static async rejectWithdrawal(transactionId: string, adminId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const transaction = await TransactionRepository.findById(transactionId, tx);
      if (!transaction) throw { statusCode: 404, message: 'Withdrawal request not found' };
      if (transaction.status !== 'PENDING') {
        throw { statusCode: 400, message: `Withdrawal request is already ${transaction.status}` };
      }

      const wallet = transaction.wallet;
      const newBalanceInSantim = WalletServiceLogic.creditWin(wallet.balance, transaction.amount);

      await tx.wallet.updateMany({
        where: { id: wallet.id, version: wallet.version },
        data: {
          balance: newBalanceInSantim,
          version: { increment: 1 },
        },
      });

      const updated = await TransactionRepository.updateStatus(transactionId, 'REJECTED', adminId, newBalanceInSantim, tx);

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'WITHDRAWAL_REJECTED',
          targetId: transactionId,
          details: JSON.stringify({
            amountSantim: transaction.amount,
            amountEtb: WalletServiceLogic.santimToEtb(transaction.amount),
            userId: wallet.userId,
            reason: reason || 'Rejected by administrator',
          }),
        },
      });

      const refundedEtb = WalletServiceLogic.santimToEtb(newBalanceInSantim);
      emitWalletUpdate(wallet.userId, {
        balance: refundedEtb,
        type: 'WITHDRAWAL',
        status: 'REJECTED',
        amount: WalletServiceLogic.santimToEtb(transaction.amount),
        message: `Withdrawal rejected and ${WalletServiceLogic.santimToEtb(transaction.amount)} ETB refunded to your wallet.`,
      });

      return {
        transaction: updated,
        refundedBalance: refundedEtb,
      };
    });
  }

  static async getUserTransactions(userId: string, limit = 30) {
    const wallet = await WalletRepository.findByUserId(userId);
    if (!wallet) return [];

    const transactions = await TransactionRepository.findByWalletId(wallet.id, limit);
    return transactions.map((t: any) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      amount: WalletServiceLogic.santimToEtb(t.amount),
      balanceAfter: t.balanceAfter !== null && t.balanceAfter !== undefined ? WalletServiceLogic.santimToEtb(t.balanceAfter) : undefined,
      paymentMethod: t.paymentMethod,
      referenceId: t.referenceId,
      description: t.description || t.type,
      createdAt: t.createdAt,
    }));
  }

  static async getLedgerEntries(limit = 100, type?: string) {
    const where: any = {};
    if (type && type !== 'ALL') {
      where.type = type;
    }
    const transactions = await prisma.transaction.findMany({
      where,
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
      take: limit,
    });

    return transactions.map((t: any) => ({
      ...t,
      amountInEtb: WalletServiceLogic.santimToEtb(t.amount),
      balanceAfterInEtb: t.balanceAfter ? WalletServiceLogic.santimToEtb(t.balanceAfter) : undefined,
    }));
  }
}

