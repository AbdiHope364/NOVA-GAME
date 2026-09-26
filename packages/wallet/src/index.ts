import { Wallet, TransactionType } from '@nova/types';

export class WalletServiceLogic {
  /**
   * Validates if wallet has sufficient balance for a bet
   */
  static validateSufficientBalance(wallet: Wallet, amount: number): boolean {
    if (amount <= 0) return false;
    return wallet.balance >= amount;
  }

  /**
   * Calculates balance after placing a bet
   */
  static deductBet(balance: number, amount: number): number {
    if (balance < amount) {
      throw new Error('Insufficient wallet balance');
    }
    return Math.floor((balance - amount) * 100) / 100;
  }

  /**
   * Calculates balance after winning a bet
   */
  static creditWin(balance: number, payout: number): number {
    if (payout < 0) throw new Error('Invalid payout amount');
    return Math.floor((balance + payout) * 100) / 100;
  }

  /**
   * Format currency helper
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}
