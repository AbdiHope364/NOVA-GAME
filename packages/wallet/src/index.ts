export interface WalletBalancesSnapshot {
  cashBalance: number;
  bonusBalance: number;
  lockedWinnings: number;
  withdrawableBalance: number;
  lockedBalance?: number;
}

export interface SeparatedBetSplit {
  cashUsed: number;
  bonusUsed: number;
  cashWin: number;
  lockedBonusWin: number;
  newCashBalance: number;
  newBonusBalance: number;
  newLockedWinnings: number;
}

export class WalletServiceLogic {
  /**
   * Currency Constants: 1 Ethiopian Birr (ETB) = 100 Ethiopian Santim
   * All internal ledger balances, bets, and payouts are stored strictly as integers.
   */
  static readonly SANTIM_PER_ETB = 100;
  static readonly WITHDRAWAL_REVIEW_THRESHOLD_SANTIM = 500000; // 5,000.00 ETB requires maker-checker manual review
  static readonly DAILY_WITHDRAWAL_LIMIT_SANTIM = 5000000;     // 50,000.00 ETB daily cap per account

  /**
   * Converts Ethiopian Birr to integer Santim safely without floating point drift
   */
  static etbToSantim(etb: number): number {
    return Math.round(etb * this.SANTIM_PER_ETB);
  }

  /**
   * Converts integer Santim to Ethiopian Birr decimal
   */
  static santimToEtb(santim: number): number {
    return santim / this.SANTIM_PER_ETB;
  }

  /**
   * Formats Santim as human-readable ETB string (e.g. 100000 -> "1,000.00 ETB")
   */
  static formatCurrency(santim: number): string {
    const etb = this.santimToEtb(santim);
    return `${etb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
  }

  /**
   * Checks whether a wallet has sufficient unlocked cash balance
   */
  static validateSufficientBalance(
    wallet: { balance: number; lockedBalance?: number },
    amountInSantim: number
  ): boolean {
    const available = wallet.balance - (wallet.lockedBalance || 0);
    return available >= amountInSantim && amountInSantim > 0;
  }

  /**
   * Calculates promotional bonus credit from base Santim, percentage (e.g. 1000 = 1000%), and cap
   */
  static calculatePromotionalBonusSantim(
    promoBaseSantim: number,
    bonusPercent: number,
    maxBonusSantim: number
  ): number {
    if (promoBaseSantim <= 0 || bonusPercent <= 0 || maxBonusSantim <= 0) return 0;
    const raw = Math.floor((promoBaseSantim * bonusPercent) / 100);
    return Math.min(raw, maxBonusSantim);
  }

  /**
   * Splits a wager & payout cleanly across real cashBalance and promotional bonusBalance/lockedWinnings.
   * Ensures real cash wins stay in cashBalance and bonus-derived wins go strictly to lockedWinnings.
   */
  static settleSeparatedBet(
    wallet: WalletBalancesSnapshot,
    betAmountSantim: number,
    payoutSantim: number,
    won: boolean,
    isGameBonusEligible: boolean
  ): SeparatedBetSplit {
    if (betAmountSantim <= 0) {
      throw new Error('Bet amount must be positive');
    }
    if (payoutSantim < 0) {
      throw new Error('Payout cannot be negative');
    }

    const cashAvailable = Math.max(0, wallet.cashBalance - (wallet.lockedBalance || 0));
    const bonusAvailable = isGameBonusEligible ? Math.max(0, wallet.bonusBalance) : 0;

    if (cashAvailable + bonusAvailable < betAmountSantim) {
      throw new Error('Insufficient cash or eligible promotional balance');
    }

    // Spend unlocked real cash first, then eligible promotional bonus credit
    const cashUsed = Math.min(cashAvailable, betAmountSantim);
    const bonusUsed = betAmountSantim - cashUsed;

    let cashWin = 0;
    let lockedBonusWin = 0;

    if (won && payoutSantim > 0) {
      if (bonusUsed === 0) {
        cashWin = payoutSantim;
      } else if (cashUsed === 0) {
        lockedBonusWin = payoutSantim;
      } else {
        cashWin = Math.floor((payoutSantim * cashUsed) / betAmountSantim);
        lockedBonusWin = payoutSantim - cashWin;
      }
    }

    return {
      cashUsed,
      bonusUsed,
      cashWin,
      lockedBonusWin,
      newCashBalance: wallet.cashBalance - cashUsed + cashWin,
      newBonusBalance: wallet.bonusBalance - bonusUsed,
      newLockedWinnings: wallet.lockedWinnings + lockedBonusWin,
    };
  }

  /**
   * Deducts bet amount in Santim
   */
  static deductBet(balanceInSantim: number, betAmountSantim: number): number {
    if (betAmountSantim < 0) throw new Error('Bet amount cannot be negative');
    return Math.max(0, balanceInSantim - betAmountSantim);
  }

  /**
   * Credits win payout in Santim
   */
  static creditWin(balanceInSantim: number, payoutInSantim: number): number {
    if (payoutInSantim < 0) throw new Error('Payout cannot be negative');
    return balanceInSantim + payoutInSantim;
  }

  /**
   * Checks whether a withdrawal request exceeds the automated threshold
   */
  static requiresWithdrawalReview(amountInSantim: number): boolean {
    return amountInSantim >= this.WITHDRAWAL_REVIEW_THRESHOLD_SANTIM;
  }
}
