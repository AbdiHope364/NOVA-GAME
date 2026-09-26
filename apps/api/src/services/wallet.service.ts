import { WalletRepository } from '../repositories/wallet.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { WalletServiceLogic } from '@nova/wallet';

export class WalletService {
  static async getWallet(userId: string) {
    const wallet = await WalletRepository.findByUserId(userId);
    if (!wallet) throw { statusCode: 444, message: 'Wallet not found' };
    return wallet;
  }

  static async deposit(userId: string, amount: number, paymentMethod: string) {
    const wallet = await this.getWallet(userId);
    const newBalance = WalletServiceLogic.creditWin(wallet.balance, amount);
    const updated = await WalletRepository.updateBalance(wallet.id, newBalance);

    await TransactionRepository.createTransaction({
      walletId: wallet.id,
      amount,
      type: 'DEPOSIT',
      description: `Deposit via ${paymentMethod}`,
    });

    return updated;
  }

  static async withdraw(userId: string, amount: number, destinationAddress: string) {
    const wallet = await this.getWallet(userId);
    if (!WalletServiceLogic.validateSufficientBalance(wallet, amount)) {
      throw { statusCode: 400, message: 'Insufficient balance for withdrawal' };
    }

    const newBalance = WalletServiceLogic.deductBet(wallet.balance, amount);
    const updated = await WalletRepository.updateBalance(wallet.id, newBalance);

    await TransactionRepository.createTransaction({
      walletId: wallet.id,
      amount,
      type: 'WITHDRAWAL',
      description: `Withdrawal to ${destinationAddress}`,
    });

    return updated;
  }
}
