import crypto from 'crypto';
import { WalletServiceLogic } from '@nova/wallet';
import { prisma } from '../config/database.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { emitWalletUpdate } from '../websocket/socket.js';

export class BonusService {
  /**
   * Hash IP or sensitive device markers so raw PII is never stored redundantly
   */
  static hashSignal(value?: string | null): string | null {
    if (!value || !value.trim()) return null;
    return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex').slice(0, 32);
  }

  /**
   * Checks whether a campaign covers a given gameId
   */
  static isGameEligible(eligibleGamesJson: string, gameId: string): boolean {
    if (!eligibleGamesJson || eligibleGamesJson.trim().toUpperCase() === 'ALL') {
      return true;
    }
    try {
      const parsed = JSON.parse(eligibleGamesJson);
      return Array.isArray(parsed) && parsed.includes(gameId);
    } catch {
      return true;
    }
  }

  /**
   * Gets or initializes the default WELCOME_1000 & Referral campaign configuration
   */
  static async getOrCreateDefaultCampaign(tx?: any) {
    const client = tx || prisma;
    let campaign = await client.bonusCampaign.findUnique({ where: { code: 'WELCOME_1000' } });
    if (!campaign) {
      campaign = await client.bonusCampaign.create({
        data: {
          code: 'WELCOME_1000',
          name: '1000% Welcome Bonus & Referral Program',
          type: 'WELCOME_1000',
          isActive: true,
          bonusPercent: 1000,
          promoBaseSantim: 1000,
          maxBonusSantim: 10000,
          minDepositSantim: 5000,
          wageringMultiplier: 5.0,
          eligibleGames: 'ALL',
          expirationDays: 14,
          requireVerification: true,
          referralsEnabled: true,
          referralRewardSantim: 1000,
          referralMinDepositSantim: 5000,
          referralApprovalMode: 'AUTO',
          referralRewardType: 'PROMOTIONAL',
          maxReferralsPerUser: 50,
        },
      });
    }
    return campaign;
  }

  static isCampaignWithinWindow(campaign: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }): boolean {
    if (!campaign.isActive) return false;
    const now = new Date();
    if (campaign.startsAt && now < campaign.startsAt) return false;
    if (campaign.endsAt && now > campaign.endsAt) return false;
    return true;
  }

  /**
   * Ensures every user has a unique personal referral code
   */
  static async ensureUserReferralCode(userId: string, username: string, tx?: any) {
    const client = tx || prisma;
    const existing = await client.referralCode.findUnique({ where: { userId } });
    if (existing) return existing;

    const prefix = username
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4)
      .padEnd(4, 'N');

    for (let attempt = 0; attempt < 5; attempt++) {
      const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
      const candidate = `${prefix}-${rand}`;
      const taken = await client.referralCode.findUnique({ where: { code: candidate } });
      if (!taken) {
        return client.referralCode.create({
          data: { userId, code: candidate },
        });
      }
    }

    return client.referralCode.create({
      data: {
        userId,
        code: `NV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      },
    });
  }

  /**
   * Called atomically during user registration:
   * - Creates WithdrawalEligibility record
   * - Provisions unique ReferralCode
   * - Attributes referral (max 1 per new user, no self-referral)
   * - Awards 1000% promotional registration bonus into wallet.bonusBalance (separate from cashBalance!)
   */
  static async onUserRegistered(
    tx: any,
    input: {
      userId: string;
      username: string;
      walletId: string;
      referralCodeInput?: string;
      deviceFingerprint?: string;
      ipAddress?: string;
      isVerified?: boolean;
    }
  ) {
    const campaign = await this.getOrCreateDefaultCampaign(tx);
    const ipHash = this.hashSignal(input.ipAddress);
    const fpHash = this.hashSignal(input.deviceFingerprint);

    // 1. Initialize Withdrawal Eligibility (requires confirmed qualifying first deposit + verification)
    await tx.withdrawalEligibility.upsert({
      where: { userId: input.userId },
      update: {},
      create: {
        userId: input.userId,
        isVerified: input.isVerified !== false,
        firstDepositCompleted: false,
        wageringCompleted: false,
        eligibleToWithdraw: false,
        ineligibleReason: 'A qualifying first real-money deposit is required before withdrawal.',
      },
    });

    // 2. Ensure unique referral code for new user
    const ownRefCode = await this.ensureUserReferralCode(input.userId, input.username, tx);

    // 3. Server-side referral attribution (if registered via ?ref=CODE)
    if (campaign.referralsEnabled && input.referralCodeInput && input.referralCodeInput.trim()) {
      const cleanCode = input.referralCodeInput.trim().toUpperCase();
      const refCodeRecord = await tx.referralCode.findUnique({
        where: { code: cleanCode },
        include: { user: true },
      });

      if (refCodeRecord && refCodeRecord.userId !== input.userId) {
        // Check if referral limit reached or duplicate signal
        let fraudScore = 0;
        const fraudReasons: string[] = [];

        if (fpHash && refCodeRecord.user.deviceFingerprint === fpHash) {
          fraudScore += 70;
          fraudReasons.push('Same device fingerprint as referrer');
        }
        if (ipHash && refCodeRecord.user.registrationIpHash === ipHash) {
          fraudScore += 35;
          fraudReasons.push('Same registration IP hash as referrer');
        }

        const existingReferralsCount = await tx.referral.count({
          where: { referrerId: refCodeRecord.userId },
        });
        if (existingReferralsCount >= campaign.maxReferralsPerUser) {
          fraudScore += 50;
          fraudReasons.push('Referrer reached campaign referral cap');
        }

        const isFlagged = fraudScore >= 70;
        const referral = await tx.referral.create({
          data: {
            referrerId: refCodeRecord.userId,
            referredUserId: input.userId,
            referralCodeId: refCodeRecord.id,
            status: isFlagged ? 'FLAGGED' : 'PENDING',
            deviceFingerprint: fpHash,
            ipHash,
            fraudScore,
            fraudReason: fraudReasons.length > 0 ? fraudReasons.join('; ') : null,
          },
        });

        if (isFlagged) {
          await tx.abuseFlag.create({
            data: {
              userId: refCodeRecord.userId,
              type: 'SUSPICIOUS_REFERRAL',
              details: JSON.stringify({
                referralId: referral.id,
                referredUserId: input.userId,
                fraudScore,
                reasons: fraudReasons,
              }),
            },
          });
        }
      }
    }

    // 4. Credit 1000% Welcome Registration Bonus into separate bonusBalance (idempotent, once per user/campaign)
    let grantedBonusEtb = 0;
    if (this.isCampaignWithinWindow(campaign) && (!campaign.requireVerification || input.isVerified !== false)) {
      const bonusAmountSantim = WalletServiceLogic.calculatePromotionalBonusSantim(
        campaign.promoBaseSantim,
        campaign.bonusPercent,
        campaign.maxBonusSantim
      );

      if (bonusAmountSantim > 0) {
        const idempotencyKey = `welcome-bonus-${input.userId}-${campaign.id}`;
        const existingBonus = await tx.userBonus.findUnique({ where: { idempotencyKey } });

        if (!existingBonus) {
          const wagerTargetSantim = Math.round(bonusAmountSantim * campaign.wageringMultiplier);
          const expiresAt =
            campaign.expirationDays > 0
              ? new Date(Date.now() + campaign.expirationDays * 24 * 60 * 60 * 1000)
              : null;

          const userBonus = await tx.userBonus.create({
            data: {
              userId: input.userId,
              campaignId: campaign.id,
              status: 'ACTIVE',
              baseAmountSantim: campaign.promoBaseSantim,
              bonusPercent: campaign.bonusPercent,
              bonusAmountSantim,
              remainingBonusSantim: bonusAmountSantim,
              wagerTargetSantim,
              wageredSantim: 0,
              eligibleGames: campaign.eligibleGames,
              idempotencyKey,
              expiresAt,
            },
          });

          await tx.bonusWageringProgress.create({
            data: {
              userBonusId: userBonus.id,
              userId: input.userId,
              requiredWagerSantim: wagerTargetSantim,
              completedWagerSantim: 0,
              remainingWagerSantim: wagerTargetSantim,
              gamesPlayedCount: 0,
            },
          });

          const updatedWallet = await tx.wallet.update({
            where: { id: input.walletId },
            data: {
              bonusBalance: { increment: bonusAmountSantim },
              version: { increment: 1 },
            },
          });

          await tx.bonusTransaction.create({
            data: {
              userBonusId: userBonus.id,
              userId: input.userId,
              walletId: input.walletId,
              type: 'BONUS_CREDIT',
              amountSantim: bonusAmountSantim,
              bonusBalanceAfterSantim: updatedWallet.bonusBalance,
              lockedWinningsAfterSantim: updatedWallet.lockedWinnings,
              cashBalanceAfterSantim: updatedWallet.balance,
              idempotencyKey: `btx-${idempotencyKey}`,
              description: `${campaign.bonusPercent}% Welcome Registration Bonus (${WalletServiceLogic.formatCurrency(
                bonusAmountSantim
              )} promotional credit)`,
            },
          });

          await TransactionRepository.createTransaction(
            {
              walletId: input.walletId,
              amount: bonusAmountSantim,
              type: 'BONUS',
              status: 'COMPLETED',
              balanceAfter: updatedWallet.balance,
              referenceId: `bonus-reg-${input.userId}`,
              description: `1000% Welcome Bonus credited (${WalletServiceLogic.formatCurrency(
                bonusAmountSantim
              )} promotional balance)`,
            },
            tx
          );

          await tx.ledgerEntry.create({
            data: {
              walletId: input.walletId,
              amount: BigInt(bonusAmountSantim),
              balanceAfter: BigInt(updatedWallet.bonusBalance),
              type: 'BONUS_CREDIT',
              idempotencyKey: `ledger-${idempotencyKey}`,
              meta: JSON.stringify({
                userBonusId: userBonus.id,
                campaignCode: campaign.code,
                promoBaseSantim: campaign.promoBaseSantim,
                bonusPercent: campaign.bonusPercent,
              }),
            },
          });

          grantedBonusEtb = WalletServiceLogic.santimToEtb(bonusAmountSantim);
        }
      }
    }

    return {
      referralCode: ownRefCode.code,
      grantedBonusEtb,
    };
  }

  /**
   * Shared transactional bet settlement with cashBalance / bonusBalance / lockedWinnings separation.
   * Used by both GameService and LettiService to avoid logic duplication.
   */
  static async settleBetWithWalletSeparation(
    tx: any,
    params: {
      userId: string;
      wallet: any;
      gameId: string;
      betIdSuffix: string;
      amountSantim: number;
      payoutSantim: number;
      won: boolean;
      multiplier: number;
      gameName: string;
    }
  ) {
    const { userId, wallet, gameId, betIdSuffix, amountSantim, payoutSantim, won, gameName } = params;

    // Guest account operates on simple demo balance
    if (userId === 'demo-guest') {
      if (!WalletServiceLogic.validateSufficientBalance(wallet, amountSantim)) {
        throw { statusCode: 400, message: 'Insufficient wallet balance' };
      }
      const balanceAfterBet = WalletServiceLogic.deductBet(wallet.balance, amountSantim);
      const finalBalance = won ? WalletServiceLogic.creditWin(balanceAfterBet, payoutSantim) : balanceAfterBet;

      const updated = await tx.wallet.updateMany({
        where: { id: wallet.id, version: wallet.version },
        data: { balance: finalBalance, version: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw { statusCode: 409, message: 'Concurrent wallet transaction detected. Please retry.' };
      }
      return {
        newCashBalanceSantim: finalBalance,
        newBonusBalanceSantim: 0,
        newLockedWinningsSantim: 0,
        newWithdrawableSantim: finalBalance,
        balanceAfterBetSantim: balanceAfterBet,
        cashUsedSantim: amountSantim,
        bonusUsedSantim: 0,
      };
    }

    // Expire overdue active bonuses WITHOUT ever confiscating legitimate deposited cashBalance
    let currentWallet = wallet;
    const now = new Date();
    const expiredBonuses = await tx.userBonus.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
    });
    if (expiredBonuses.length > 0) {
      for (const exp of expiredBonuses) {
        await tx.userBonus.update({
          where: { id: exp.id },
          data: { status: 'EXPIRED', remainingBonusSantim: 0 },
        });
      }
      const forfeitedBonus = currentWallet.bonusBalance;
      if (forfeitedBonus > 0 || currentWallet.lockedWinnings > 0) {
        currentWallet = await tx.wallet.update({
          where: { id: currentWallet.id },
          data: { bonusBalance: 0, lockedWinnings: 0, version: { increment: 1 } },
        });
        await tx.bonusTransaction.create({
          data: {
            userBonusId: expiredBonuses[0].id,
            userId,
            walletId: currentWallet.id,
            type: 'BONUS_EXPIRE',
            amountSantim: forfeitedBonus,
            bonusBalanceAfterSantim: 0,
            lockedWinningsAfterSantim: 0,
            cashBalanceAfterSantim: currentWallet.balance,
            idempotencyKey: `expire-${expiredBonuses[0].id}-${now.getTime()}`,
            description: 'Promotional bonus expired; deposited cash balance preserved.',
          },
        });
      }
    }

    const activeBonus = await tx.userBonus.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { claimedAt: 'asc' },
    });

    const isGameBonusEligible = activeBonus ? this.isGameEligible(activeBonus.eligibleGames, gameId) : false;

    let split;
    try {
      split = WalletServiceLogic.settleSeparatedBet(
        {
          cashBalance: currentWallet.balance,
          bonusBalance: currentWallet.bonusBalance,
          lockedWinnings: currentWallet.lockedWinnings,
          withdrawableBalance: currentWallet.withdrawableBalance,
          lockedBalance: currentWallet.lockedBalance,
        },
        amountSantim,
        payoutSantim,
        won,
        isGameBonusEligible
      );
    } catch {
      throw { statusCode: 400, message: 'Insufficient wallet balance' };
    }

    let nextCash = split.newCashBalance;
    let nextBonus = split.newBonusBalance;
    let nextLockedWinnings = split.newLockedWinnings;

    const eligibility = await tx.withdrawalEligibility.findUnique({ where: { userId } });
    let nextWageringCompleted = eligibility ? eligibility.wageringCompleted : true;

    // Update bonus wagering progress if player has an active bonus on an eligible game
    if (activeBonus && isGameBonusEligible) {
      const nextWagered = activeBonus.wageredSantim + amountSantim;
      const reachedTarget = nextWagered >= activeBonus.wagerTargetSantim;

      await tx.userBonus.update({
        where: { id: activeBonus.id },
        data: {
          remainingBonusSantim: Math.max(0, nextBonus),
          wageredSantim: nextWagered,
          status: reachedTarget ? 'COMPLETED' : 'ACTIVE',
          completedAt: reachedTarget ? new Date() : undefined,
        },
      });

      const progress = await tx.bonusWageringProgress.findUnique({ where: { userBonusId: activeBonus.id } });
      if (progress) {
        await tx.bonusWageringProgress.update({
          where: { userBonusId: activeBonus.id },
          data: {
            completedWagerSantim: nextWagered,
            remainingWagerSantim: Math.max(0, activeBonus.wagerTargetSantim - nextWagered),
            gamesPlayedCount: { increment: 1 },
            lastWageredAt: new Date(),
          },
        });
      }

      if (reachedTarget) {
        nextWageringCompleted = true;
      }

      if (split.bonusUsed > 0) {
        await tx.bonusTransaction.create({
          data: {
            userBonusId: activeBonus.id,
            userId,
            walletId: currentWallet.id,
            type: 'BONUS_WAGER',
            amountSantim: split.bonusUsed,
            bonusBalanceAfterSantim: nextBonus,
            lockedWinningsAfterSantim: nextLockedWinnings,
            cashBalanceAfterSantim: nextCash,
            gameId,
            betId: betIdSuffix,
            idempotencyKey: `bwager-${betIdSuffix}`,
            description: `Wagered ${WalletServiceLogic.formatCurrency(split.bonusUsed)} promotional credit on ${gameName}`,
          },
        });
      }

      if (split.lockedBonusWin > 0) {
        await tx.bonusTransaction.create({
          data: {
            userBonusId: activeBonus.id,
            userId,
            walletId: currentWallet.id,
            type: 'BONUS_WIN',
            amountSantim: split.lockedBonusWin,
            bonusBalanceAfterSantim: nextBonus,
            lockedWinningsAfterSantim: nextLockedWinnings,
            cashBalanceAfterSantim: nextCash,
            gameId,
            betId: betIdSuffix,
            idempotencyKey: `bwin-${betIdSuffix}`,
            description: `Locked promotional winnings +${WalletServiceLogic.formatCurrency(split.lockedBonusWin)} from ${gameName}`,
          },
        });
      }

      // If BOTH first deposit + verification + wagering are satisfied, unlock lockedWinnings into cashBalance!
      if (
        reachedTarget &&
        eligibility?.firstDepositCompleted &&
        eligibility?.isVerified &&
        nextLockedWinnings > 0
      ) {
        const unlocked = nextLockedWinnings;
        nextCash += unlocked;
        nextLockedWinnings = 0;

        await tx.bonusTransaction.create({
          data: {
            userBonusId: activeBonus.id,
            userId,
            walletId: currentWallet.id,
            type: 'BONUS_UNLOCK',
            amountSantim: unlocked,
            bonusBalanceAfterSantim: nextBonus,
            lockedWinningsAfterSantim: 0,
            cashBalanceAfterSantim: nextCash,
            gameId,
            idempotencyKey: `bunlock-${activeBonus.id}`,
            description: `Unlocked ${WalletServiceLogic.formatCurrency(unlocked)} bonus winnings into withdrawable cash`,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: currentWallet.id,
            amount: BigInt(unlocked),
            balanceAfter: BigInt(nextCash),
            type: 'BONUS_UNLOCK',
            idempotencyKey: `ledger-bunlock-${activeBonus.id}`,
            meta: JSON.stringify({ userBonusId: activeBonus.id }),
          },
        });
      }
    }

    const canWithdrawNow = Boolean(
      eligibility?.isVerified && eligibility?.firstDepositCompleted && nextWageringCompleted
    );
    const nextWithdrawable = canWithdrawNow ? Math.max(0, nextCash - currentWallet.lockedBalance) : 0;

    const reason = !eligibility?.firstDepositCompleted
      ? 'Confirm a qualifying first real-money deposit before withdrawing.'
      : !eligibility?.isVerified
      ? 'Complete account verification before withdrawing.'
      : !nextWageringCompleted
      ? 'Complete active promotional wagering requirements before withdrawing.'
      : null;

    if (eligibility) {
      await tx.withdrawalEligibility.update({
        where: { userId },
        data: {
          wageringCompleted: nextWageringCompleted,
          eligibleToWithdraw: canWithdrawNow,
          ineligibleReason: reason,
          checkedAt: new Date(),
        },
      });
    }

    const updateWalletRes = await tx.wallet.updateMany({
      where: { id: currentWallet.id, version: currentWallet.version },
      data: {
        balance: nextCash,
        bonusBalance: nextBonus,
        lockedWinnings: nextLockedWinnings,
        withdrawableBalance: nextWithdrawable,
        version: { increment: 1 },
      },
    });
    if (updateWalletRes.count === 0) {
      throw { statusCode: 409, message: 'Concurrent wallet transaction detected. Please retry.' };
    }

    return {
      newCashBalanceSantim: nextCash,
      newBonusBalanceSantim: nextBonus,
      newLockedWinningsSantim: nextLockedWinnings,
      newWithdrawableSantim: nextWithdrawable,
      balanceAfterBetSantim: Math.max(0, currentWallet.balance - split.cashUsed),
      cashUsedSantim: split.cashUsed,
      bonusUsedSantim: split.bonusUsed,
    };
  }

  /**
   * Called inside WalletService.approveDeposit transaction:
   * 1. Marks qualifying first deposit complete -> unlocks completed bonus winnings & withdrawableBalance
   * 2. Processes referral qualification & auto/manual reward with fraud checks & idempotency
   */
  static async onDepositApproved(
    tx: any,
    input: {
      userId: string;
      walletId: string;
      transactionId: string;
      amountSantim: number;
      newCashBalanceSantim: number;
      phoneNumber?: string | null;
      adminId: string;
    }
  ) {
    const campaign = await this.getOrCreateDefaultCampaign(tx);

    // 1. Update WithdrawalEligibility if qualifying first deposit reached
    let eligibility = await tx.withdrawalEligibility.findUnique({ where: { userId: input.userId } });
    if (!eligibility) {
      eligibility = await tx.withdrawalEligibility.create({
        data: {
          userId: input.userId,
          isVerified: true,
          firstDepositCompleted: false,
          wageringCompleted: false,
          eligibleToWithdraw: false,
        },
      });
    }

    const activeBonus = await tx.userBonus.findFirst({
      where: { userId: input.userId, status: 'ACTIVE' },
    });
    const wageringAlreadyComplete = !activeBonus || activeBonus.wageredSantim >= activeBonus.wagerTargetSantim;
    const qualifiesForFirstDeposit =
      eligibility.firstDepositCompleted || input.amountSantim >= campaign.minDepositSantim;

    const nextEligible = Boolean(qualifiesForFirstDeposit && eligibility.isVerified && wageringAlreadyComplete);
    let nextCash = input.newCashBalanceSantim;
    let wallet = await tx.wallet.findUnique({ where: { id: input.walletId } });
    let nextLockedWinnings = wallet?.lockedWinnings || 0;

    if (nextEligible && nextLockedWinnings > 0) {
      const unlocked = nextLockedWinnings;
      nextCash += unlocked;
      nextLockedWinnings = 0;

      await tx.bonusTransaction.create({
        data: {
          userBonusId: activeBonus?.id,
          userId: input.userId,
          walletId: input.walletId,
          type: 'BONUS_UNLOCK',
          amountSantim: unlocked,
          bonusBalanceAfterSantim: wallet?.bonusBalance || 0,
          lockedWinningsAfterSantim: 0,
          cashBalanceAfterSantim: nextCash,
          idempotencyKey: `bunlock-dep-${input.transactionId}`,
          description: `Unlocked ${WalletServiceLogic.formatCurrency(unlocked)} bonus winnings after qualifying deposit`,
        },
      });
    }

    const nextWithdrawable = nextEligible ? Math.max(0, nextCash - (wallet?.lockedBalance || 0)) : 0;
    await tx.wallet.update({
      where: { id: input.walletId },
      data: {
        balance: nextCash,
        lockedWinnings: nextLockedWinnings,
        withdrawableBalance: nextWithdrawable,
        version: { increment: 1 },
      },
    });

    await tx.withdrawalEligibility.update({
      where: { userId: input.userId },
      data: {
        firstDepositCompleted: qualifiesForFirstDeposit,
        firstDepositAmountSantim: eligibility.firstDepositCompleted
          ? eligibility.firstDepositAmountSantim
          : input.amountSantim,
        firstDepositTxId: eligibility.firstDepositTxId || input.transactionId,
        wageringCompleted: wageringAlreadyComplete,
        eligibleToWithdraw: nextEligible,
        ineligibleReason: !qualifiesForFirstDeposit
          ? `Minimum qualifying deposit is ${WalletServiceLogic.formatCurrency(campaign.minDepositSantim)}.`
          : !wageringAlreadyComplete
          ? 'Complete active promotional wagering requirements before withdrawing.'
          : null,
        checkedAt: new Date(),
      },
    });

    // 2. Referral Qualification & Reward Processing
    const referral = await tx.referral.findUnique({
      where: { referredUserId: input.userId },
      include: { referrer: { include: { wallet: true } } },
    });

    if (
      referral &&
      (referral.status === 'PENDING' || referral.status === 'FLAGGED') &&
      campaign.referralsEnabled &&
      input.amountSantim >= campaign.referralMinDepositSantim
    ) {
      let fraudScore = referral.fraudScore;
      const fraudReasons: string[] = referral.fraudReason ? [referral.fraudReason] : [];

      // Check shared phone number across other wallets' deposits
      if (input.phoneNumber && input.phoneNumber.trim()) {
        const phoneReuse = await tx.transaction.count({
          where: {
            phoneNumber: input.phoneNumber.trim(),
            walletId: { not: input.walletId },
          },
        });
        if (phoneReuse > 0) {
          fraudScore += 60;
          fraudReasons.push('Deposit phone number reused across multiple accounts');
        }
      }

      const existingReward = await tx.referralReward.findUnique({
        where: {
          referredUserId_campaignId: {
            referredUserId: input.userId,
            campaignId: campaign.id,
          },
        },
      });

      if (!existingReward) {
        const shouldFlag = fraudScore >= 70;
        const autoApprove = !shouldFlag && campaign.referralApprovalMode === 'AUTO';

        await tx.referral.update({
          where: { id: referral.id },
          data: {
            status: shouldFlag ? 'FLAGGED' : autoApprove ? 'APPROVED' : 'QUALIFIED',
            qualifyingDepositTxId: input.transactionId,
            qualifyingDepositSantim: input.amountSantim,
            fraudScore,
            fraudReason: fraudReasons.length > 0 ? fraudReasons.join('; ') : null,
            reviewedBy: autoApprove ? input.adminId : undefined,
            reviewedAt: autoApprove ? new Date() : undefined,
          },
        });

        const rewardIdemKey = `ref-reward-${referral.id}-${campaign.id}`;
        const reward = await tx.referralReward.create({
          data: {
            referralId: referral.id,
            campaignId: campaign.id,
            referrerId: referral.referrerId,
            referredUserId: input.userId,
            rewardType: campaign.referralRewardType,
            amountSantim: campaign.referralRewardSantim,
            status: autoApprove ? 'PAID' : 'PENDING',
            idempotencyKey: rewardIdemKey,
            approvedBy: autoApprove ? input.adminId : undefined,
            approvedAt: autoApprove ? new Date() : undefined,
          },
        });

        if (autoApprove && referral.referrer.wallet) {
          await this.creditReferralRewardToReferrer(tx, {
            reward,
            referrerWallet: referral.referrer.wallet,
            campaign,
            adminId: input.adminId,
          });
        }
      }
    }
  }

  /**
   * Atomically credits an approved ReferralReward into referrer wallet (PROMOTIONAL bonus or CASH)
   */
  static async creditReferralRewardToReferrer(
    tx: any,
    params: { reward: any; referrerWallet: any; campaign: any; adminId: string }
  ) {
    const { reward, referrerWallet, adminId } = params;
    const isCashReward = reward.rewardType === 'CASH';
    const amountSantim = reward.amountSantim;

    const updatedWallet = await tx.wallet.update({
      where: { id: referrerWallet.id },
      data: isCashReward
        ? {
            balance: { increment: amountSantim },
            withdrawableBalance: { increment: amountSantim },
            version: { increment: 1 },
          }
        : {
            bonusBalance: { increment: amountSantim },
            version: { increment: 1 },
          },
    });

    const txRecord = await TransactionRepository.createTransaction(
      {
        walletId: referrerWallet.id,
        amount: amountSantim,
        type: 'BONUS',
        status: 'COMPLETED',
        balanceAfter: updatedWallet.balance,
        referenceId: `ref-tx-${reward.idempotencyKey}`,
        description: `Referral reward (${WalletServiceLogic.formatCurrency(amountSantim)} ${
          isCashReward ? 'cash' : 'promotional credit'
        })`,
      },
      tx
    );

    await tx.bonusTransaction.create({
      data: {
        userId: reward.referrerId,
        walletId: referrerWallet.id,
        type: 'REFERRAL_CREDIT',
        amountSantim,
        bonusBalanceAfterSantim: updatedWallet.bonusBalance,
        lockedWinningsAfterSantim: updatedWallet.lockedWinnings,
        cashBalanceAfterSantim: updatedWallet.balance,
        idempotencyKey: `btx-${reward.idempotencyKey}`,
        description: `Referral reward credited (${WalletServiceLogic.formatCurrency(amountSantim)})`,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: referrerWallet.id,
        amount: BigInt(amountSantim),
        balanceAfter: BigInt(isCashReward ? updatedWallet.balance : updatedWallet.bonusBalance),
        type: 'REFERRAL_REWARD',
        idempotencyKey: `ledger-${reward.idempotencyKey}`,
        actorId: adminId,
        meta: JSON.stringify({
          rewardId: reward.id,
          referralId: reward.referralId,
          rewardType: reward.rewardType,
        }),
      },
    });

    await tx.referralReward.update({
      where: { id: reward.id },
      data: {
        status: 'PAID',
        transactionId: txRecord.id,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    emitWalletUpdate(reward.referrerId, {
      balance: WalletServiceLogic.santimToEtb(updatedWallet.balance),
      type: 'BONUS',
      status: 'COMPLETED',
      amount: WalletServiceLogic.santimToEtb(amountSantim),
      message: `Referral reward of ${WalletServiceLogic.formatCurrency(amountSantim)} credited!`,
    });
  }

  /**
   * Player Dashboard summary: Wallet separation + 1000% Welcome Bonus + Referral Dashboard
   */
  static async getPlayerPromotionsSummary(userId: string) {
    if (userId === 'demo-guest') {
      const campaign = await this.getOrCreateDefaultCampaign();
      return {
        isGuest: true,
        walletSeparation: {
          cashBalance: 1000,
          bonusBalance: 0,
          lockedWinnings: 0,
          withdrawableBalance: 0,
        },
        campaign: {
          code: campaign.code,
          name: campaign.name,
          isActive: campaign.isActive,
          bonusPercent: campaign.bonusPercent,
          promoBaseEtb: WalletServiceLogic.santimToEtb(campaign.promoBaseSantim),
          maxBonusEtb: WalletServiceLogic.santimToEtb(campaign.maxBonusSantim),
          minDepositEtb: WalletServiceLogic.santimToEtb(campaign.minDepositSantim),
          wageringMultiplier: campaign.wageringMultiplier,
          eligibleGames: campaign.eligibleGames,
          expirationDays: campaign.expirationDays,
          referralRewardEtb: WalletServiceLogic.santimToEtb(campaign.referralRewardSantim),
          referralMinDepositEtb: WalletServiceLogic.santimToEtb(campaign.referralMinDepositSantim),
          referralRewardType: campaign.referralRewardType,
        },
        welcomeBonus: null,
        withdrawalEligibility: {
          isVerified: false,
          firstDepositCompleted: false,
          wageringCompleted: false,
          eligibleToWithdraw: false,
          ineligibleReason: 'Register a verified account and complete a qualifying first deposit.',
        },
        referral: null,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const campaign = await this.getOrCreateDefaultCampaign();
    const refCode = await this.ensureUserReferralCode(userId, user.username);

    let eligibility = await prisma.withdrawalEligibility.findUnique({ where: { userId } });
    if (!eligibility) {
      eligibility = await prisma.withdrawalEligibility.create({
        data: {
          userId,
          isVerified: user.isVerified,
          firstDepositCompleted: false,
          wageringCompleted: false,
          eligibleToWithdraw: false,
          ineligibleReason: 'A qualifying first real-money deposit is required before withdrawal.',
        },
      });
    }

    const userBonus = await prisma.userBonus.findFirst({
      where: { userId },
      include: { wageringProgress: true },
      orderBy: { claimedAt: 'desc' },
    });

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: { select: { username: true, createdAt: true } },
        rewards: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalInvited = referrals.length;
    const successfulReferrals = referrals.filter((r) => r.status === 'APPROVED').length;
    const pendingReferrals = referrals.filter((r) => r.status === 'PENDING' || r.status === 'QUALIFIED').length;
    const totalRewardsSantim = referrals.reduce(
      (sum, r) => sum + r.rewards.filter((rw) => rw.status === 'PAID').reduce((s, rw) => s + rw.amountSantim, 0),
      0
    );

    const w = user.wallet;
    return {
      isGuest: false,
      walletSeparation: {
        cashBalance: WalletServiceLogic.santimToEtb(w?.balance || 0),
        bonusBalance: WalletServiceLogic.santimToEtb(w?.bonusBalance || 0),
        lockedWinnings: WalletServiceLogic.santimToEtb(w?.lockedWinnings || 0),
        withdrawableBalance: WalletServiceLogic.santimToEtb(w?.withdrawableBalance || 0),
      },
      campaign: {
        code: campaign.code,
        name: campaign.name,
        isActive: campaign.isActive,
        bonusPercent: campaign.bonusPercent,
        promoBaseEtb: WalletServiceLogic.santimToEtb(campaign.promoBaseSantim),
        maxBonusEtb: WalletServiceLogic.santimToEtb(campaign.maxBonusSantim),
        minDepositEtb: WalletServiceLogic.santimToEtb(campaign.minDepositSantim),
        wageringMultiplier: campaign.wageringMultiplier,
        eligibleGames: campaign.eligibleGames,
        expirationDays: campaign.expirationDays,
        referralRewardEtb: WalletServiceLogic.santimToEtb(campaign.referralRewardSantim),
        referralMinDepositEtb: WalletServiceLogic.santimToEtb(campaign.referralMinDepositSantim),
        referralRewardType: campaign.referralRewardType,
      },
      welcomeBonus: userBonus
        ? {
            id: userBonus.id,
            status: userBonus.status,
            bonusPercent: userBonus.bonusPercent,
            baseAmountEtb: WalletServiceLogic.santimToEtb(userBonus.baseAmountSantim),
            bonusAmountReceivedEtb: WalletServiceLogic.santimToEtb(userBonus.bonusAmountSantim),
            remainingBonusEtb: WalletServiceLogic.santimToEtb(userBonus.remainingBonusSantim),
            wagerTargetEtb: WalletServiceLogic.santimToEtb(userBonus.wagerTargetSantim),
            wageredEtb: WalletServiceLogic.santimToEtb(userBonus.wageredSantim),
            progressPercent:
              userBonus.wagerTargetSantim > 0
                ? Math.min(100, Math.round((userBonus.wageredSantim / userBonus.wagerTargetSantim) * 100))
                : 100,
            eligibleGames: userBonus.eligibleGames,
            expiresAt: userBonus.expiresAt?.toISOString() || null,
            claimedAt: userBonus.claimedAt.toISOString(),
          }
        : null,
      withdrawalEligibility: {
        isVerified: eligibility.isVerified,
        firstDepositCompleted: eligibility.firstDepositCompleted,
        firstDepositAmountEtb: WalletServiceLogic.santimToEtb(eligibility.firstDepositAmountSantim),
        wageringCompleted: eligibility.wageringCompleted,
        eligibleToWithdraw: eligibility.eligibleToWithdraw,
        ineligibleReason: eligibility.ineligibleReason,
      },
      referral: {
        code: refCode.code,
        rewardPerReferralEtb: WalletServiceLogic.santimToEtb(campaign.referralRewardSantim),
        rewardType: campaign.referralRewardType,
        totalInvited,
        successfulReferrals,
        pendingReferrals,
        totalRewardsEarnedEtb: WalletServiceLogic.santimToEtb(totalRewardsSantim),
        history: referrals.map((r) => ({
          id: r.id,
          referredUsername: r.referredUser.username,
          status: r.status,
          qualifyingDepositEtb: WalletServiceLogic.santimToEtb(r.qualifyingDepositSantim),
          rewardAmountEtb: WalletServiceLogic.santimToEtb(
            r.rewards[0]?.amountSantim || campaign.referralRewardSantim
          ),
          rewardStatus: r.rewards[0]?.status || 'PENDING',
          fraudReason: r.fraudReason,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    };
  }

  /**
   * Admin: Fetch campaign settings + all bonuses, referrals, pending/flagged rewards
   */
  static async getAdminOverview() {
    const campaign = await this.getOrCreateDefaultCampaign();
    const [bonuses, referrals, rewards] = await Promise.all([
      prisma.userBonus.findMany({
        include: {
          user: { select: { id: true, username: true, email: true } },
          wageringProgress: true,
        },
        orderBy: { claimedAt: 'desc' },
        take: 100,
      }),
      prisma.referral.findMany({
        include: {
          referrer: { select: { id: true, username: true, email: true } },
          referredUser: { select: { id: true, username: true, email: true } },
          rewards: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.referralReward.findMany({
        include: {
          referrer: { select: { id: true, username: true } },
          referral: {
            include: { referredUser: { select: { username: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      campaign: {
        ...campaign,
        promoBaseEtb: WalletServiceLogic.santimToEtb(campaign.promoBaseSantim),
        maxBonusEtb: WalletServiceLogic.santimToEtb(campaign.maxBonusSantim),
        minDepositEtb: WalletServiceLogic.santimToEtb(campaign.minDepositSantim),
        referralRewardEtb: WalletServiceLogic.santimToEtb(campaign.referralRewardSantim),
        referralMinDepositEtb: WalletServiceLogic.santimToEtb(campaign.referralMinDepositSantim),
      },
      bonuses: bonuses.map((b) => ({
        id: b.id,
        userId: b.userId,
        username: b.user.username,
        email: b.user.email,
        status: b.status,
        bonusPercent: b.bonusPercent,
        bonusAmountEtb: WalletServiceLogic.santimToEtb(b.bonusAmountSantim),
        remainingBonusEtb: WalletServiceLogic.santimToEtb(b.remainingBonusSantim),
        wageredEtb: WalletServiceLogic.santimToEtb(b.wageredSantim),
        wagerTargetEtb: WalletServiceLogic.santimToEtb(b.wagerTargetSantim),
        claimedAt: b.claimedAt.toISOString(),
        expiresAt: b.expiresAt?.toISOString() || null,
      })),
      referrals: referrals.map((r) => ({
        id: r.id,
        referrerUsername: r.referrer.username,
        referredUsername: r.referredUser.username,
        status: r.status,
        qualifyingDepositEtb: WalletServiceLogic.santimToEtb(r.qualifyingDepositSantim),
        fraudScore: r.fraudScore,
        fraudReason: r.fraudReason,
        rewardId: r.rewards[0]?.id || null,
        rewardStatus: r.rewards[0]?.status || null,
        rewardAmountEtb: r.rewards[0] ? WalletServiceLogic.santimToEtb(r.rewards[0].amountSantim) : 0,
        createdAt: r.createdAt.toISOString(),
      })),
      rewards: rewards.map((rw) => ({
        id: rw.id,
        referralId: rw.referralId,
        referrerUsername: rw.referrer.username,
        referredUsername: rw.referral.referredUser.username,
        rewardType: rw.rewardType,
        amountEtb: WalletServiceLogic.santimToEtb(rw.amountSantim),
        status: rw.status,
        rejectedReason: rw.rejectedReason,
        createdAt: rw.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Admin: Update bonus & referral campaign settings with audit log
   */
  static async updateCampaign(adminId: string, body: any) {
    const campaign = await this.getOrCreateDefaultCampaign();

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.bonusCampaign.update({
        where: { id: campaign.id },
        data: {
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : campaign.isActive,
          bonusPercent: body.bonusPercent !== undefined ? Number(body.bonusPercent) : campaign.bonusPercent,
          promoBaseSantim:
            body.promoBaseEtb !== undefined
              ? WalletServiceLogic.etbToSantim(Number(body.promoBaseEtb))
              : campaign.promoBaseSantim,
          maxBonusSantim:
            body.maxBonusEtb !== undefined
              ? WalletServiceLogic.etbToSantim(Number(body.maxBonusEtb))
              : campaign.maxBonusSantim,
          minDepositSantim:
            body.minDepositEtb !== undefined
              ? WalletServiceLogic.etbToSantim(Number(body.minDepositEtb))
              : campaign.minDepositSantim,
          wageringMultiplier:
            body.wageringMultiplier !== undefined
              ? Number(body.wageringMultiplier)
              : campaign.wageringMultiplier,
          eligibleGames: body.eligibleGames !== undefined ? String(body.eligibleGames) : campaign.eligibleGames,
          expirationDays:
            body.expirationDays !== undefined ? Number(body.expirationDays) : campaign.expirationDays,
          referralsEnabled:
            body.referralsEnabled !== undefined ? Boolean(body.referralsEnabled) : campaign.referralsEnabled,
          referralRewardSantim:
            body.referralRewardEtb !== undefined
              ? WalletServiceLogic.etbToSantim(Number(body.referralRewardEtb) === 20 ? 20 : 10)
              : campaign.referralRewardSantim,
          referralMinDepositSantim:
            body.referralMinDepositEtb !== undefined
              ? WalletServiceLogic.etbToSantim(Number(body.referralMinDepositEtb))
              : campaign.referralMinDepositSantim,
          referralApprovalMode:
            body.referralApprovalMode === 'MANUAL' || body.referralApprovalMode === 'AUTO'
              ? body.referralApprovalMode
              : campaign.referralApprovalMode,
          referralRewardType:
            body.referralRewardType === 'CASH' || body.referralRewardType === 'PROMOTIONAL'
              ? body.referralRewardType
              : campaign.referralRewardType,
          maxReferralsPerUser:
            body.maxReferralsPerUser !== undefined
              ? Number(body.maxReferralsPerUser)
              : campaign.maxReferralsPerUser,
          startsAt: body.startsAt ? new Date(body.startsAt) : body.startsAt === null ? null : campaign.startsAt,
          endsAt: body.endsAt ? new Date(body.endsAt) : body.endsAt === null ? null : campaign.endsAt,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'BONUS_CAMPAIGN_UPDATED',
          targetId: next.id,
          details: JSON.stringify(body),
        },
      });

      return next;
    });

    return updated;
  }

  /**
   * Admin: Approve or Reject a referral & reward atomically with audit trail
   */
  static async reviewReferral(
    adminId: string,
    referralId: string,
    decision: 'APPROVE' | 'REJECT',
    reason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const referral = await tx.referral.findUnique({
        where: { id: referralId },
        include: {
          referrer: { include: { wallet: true } },
          rewards: true,
        },
      });
      if (!referral) throw { statusCode: 404, message: 'Referral record not found' };

      const campaign = await this.getOrCreateDefaultCampaign(tx);

      if (decision === 'REJECT') {
        await tx.referral.update({
          where: { id: referral.id },
          data: {
            status: 'REJECTED',
            reviewedBy: adminId,
            reviewedAt: new Date(),
            reviewNotes: reason || 'Rejected by administrator',
          },
        });
        for (const rw of referral.rewards) {
          if (rw.status !== 'PAID') {
            await tx.referralReward.update({
              where: { id: rw.id },
              data: {
                status: 'REJECTED',
                rejectedReason: reason || 'Rejected by administrator',
                approvedBy: adminId,
                approvedAt: new Date(),
              },
            });
          }
        }
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: 'REFERRAL_REJECTED',
            targetId: referral.id,
            details: JSON.stringify({ reason }),
          },
        });
        return { status: 'REJECTED' };
      }

      // APPROVE decision: credit reward atomically if not already PAID
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNotes: reason || 'Approved by administrator',
        },
      });

      let reward = referral.rewards[0];
      if (!reward) {
        reward = await tx.referralReward.create({
          data: {
            referralId: referral.id,
            campaignId: campaign.id,
            referrerId: referral.referrerId,
            referredUserId: referral.referredUserId,
            rewardType: campaign.referralRewardType,
            amountSantim: campaign.referralRewardSantim,
            status: 'PENDING',
            idempotencyKey: `ref-reward-${referral.id}-${campaign.id}`,
          },
        });
      }

      if (reward.status !== 'PAID' && referral.referrer.wallet) {
        await this.creditReferralRewardToReferrer(tx, {
          reward,
          referrerWallet: referral.referrer.wallet,
          campaign,
          adminId,
        });
      }

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'REFERRAL_APPROVED',
          targetId: referral.id,
          details: JSON.stringify({ rewardId: reward.id, amountSantim: reward.amountSantim }),
        },
      });

      return { status: 'APPROVED', rewardId: reward.id };
    });
  }
}
