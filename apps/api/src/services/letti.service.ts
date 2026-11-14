import { LettiEngine } from '@nova/game-letti';
import { ProvablyFair } from '@nova/fairness';
import { WalletServiceLogic } from '@nova/wallet';
import {
  LettiConfirmResponse,
  LettiOutcome,
  LettiPrepareResponse,
  LettiRoundHistoryItem,
  LettiVerifyResponse,
} from '@nova/types';
import { prisma } from '../config/database.js';
import { WalletRepository } from '../repositories/wallet.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { PlatformSettingsService } from './platformSettings.service.js';
import { GameService } from './game.service.js';
import { BonusService } from './bonus.service.js';

export class LettiService {
  private static async ensurePlayable(amount?: number) {
    const platformSettings = await PlatformSettingsService.getSettings();
    if (platformSettings.maintenanceMode) {
      throw { statusCode: 503, message: 'Platform is currently under scheduled maintenance.' };
    }

    const gameConfig = await prisma.gameConfig.findUnique({ where: { gameId: 'letti' } });
    if (gameConfig && !gameConfig.enabled) {
      throw { statusCode: 403, message: `${gameConfig.name} is currently under maintenance.` };
    }
    if (gameConfig && amount !== undefined && (amount < gameConfig.minBet || amount > gameConfig.maxBet)) {
      throw {
        statusCode: 400,
        message: `Bet for ${gameConfig.name} must be between ${gameConfig.minBet} and ${gameConfig.maxBet} ETB.`,
      };
    }
  }

  private static async ensureGuestWallet(effectiveUserId: string) {
    if (effectiveUserId !== 'demo-guest') return;

    const guest = await prisma.user.findUnique({
      where: { id: 'demo-guest' },
      include: { wallet: true },
    });

    if (!guest) {
      await prisma.user.create({
        data: {
          id: 'demo-guest',
          email: 'guest@novagame.et',
          username: 'Guest Player',
          passwordHash: 'guest-disabled-hash',
          role: 'USER',
          wallet: {
            create: {
              id: 'demo-guest-wallet',
              balance: 1000000,
              currency: 'ETB',
            },
          },
        },
      });
    } else if (!guest.wallet || guest.wallet.balance < 10000) {
      await prisma.wallet.upsert({
        where: { userId: 'demo-guest' },
        update: { balance: 1000000 },
        create: {
          id: 'demo-guest-wallet',
          userId: 'demo-guest',
          balance: 1000000,
          currency: 'ETB',
        },
      });
    }
  }

  private static formatConfirmResponse(
    round: {
      id: string;
      roundCode: string;
      betId: string | null;
      amountSantim: number | null;
      payoutSantim: number | null;
      won: boolean | null;
      outcome: string | null;
      serverSeedHash: string;
      serverSeed: string;
      clientSeed: string;
      nonce: number;
    },
    walletBalanceSantim: number
  ): LettiConfirmResponse {
    const parsedOutcome: LettiOutcome = JSON.parse(round.outcome || '{}');
    const amount = WalletServiceLogic.santimToEtb(round.amountSantim || 0);
    const payout = WalletServiceLogic.santimToEtb(round.payoutSantim || 0);
    const won = Boolean(round.won);

    return {
      roundId: round.id,
      roundCode: round.roundCode,
      betId: round.betId || round.id,
      amount,
      won,
      multiplier: won ? LettiEngine.PAYOUT_MULTIPLIER : 0,
      payout,
      profit: payout - amount,
      newBalance: WalletServiceLogic.santimToEtb(walletBalanceSantim),
      outcome: parsedOutcome,
      provablyFair: {
        serverSeedHash: round.serverSeedHash,
        serverSeed: round.serverSeed,
        clientSeed: round.clientSeed,
        nonce: round.nonce,
        verified: ProvablyFair.hashServerSeed(round.serverSeed) === round.serverSeedHash,
      },
    };
  }

  /**
   * Step 1 & 2 of Fair-Round Lifecycle:
   * Player picks 1 card; server commits a fresh CSPRNG serverSeedHash, allocates a unique nonce,
   * and deterministically generates the single authoritative 51-card shuffled order.
   */
  static async prepareRound(
    userId: string,
    pickedCardIndex: number,
    customClientSeed?: string
  ): Promise<LettiPrepareResponse> {
    if (!Number.isInteger(pickedCardIndex) || pickedCardIndex < 0 || pickedCardIndex > 51) {
      throw { statusCode: 400, message: 'Picked card index must be an integer between 0 and 51.' };
    }

    await this.ensurePlayable();
    const effectiveUserId = userId || 'demo-guest';
    await this.ensureGuestWallet(effectiveUserId);

    return prisma.$transaction(async (tx) => {
      // Cancel any prior unsettled prepared round for this user
      await tx.lettiRound.updateMany({
        where: { userId: effectiveUserId, status: 'PREPARED' },
        data: { status: 'CANCELLED' },
      });

      const seed = await GameService.getActiveSeed(effectiveUserId, tx);
      const clientSeed = (customClientSeed && customClientSeed.trim()) || seed.clientSeed;
      const nextNonce = seed.nonce + 1;

      await tx.provablyFairSeed.update({
        where: { id: seed.id },
        data: { nonce: nextNonce },
      });

      const serverSeed = ProvablyFair.generateServerSeed();
      const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
      const shuffledOrder = LettiEngine.buildShuffledOrder(
        pickedCardIndex,
        serverSeed,
        clientSeed,
        nextNonce
      );

      const totalRounds = await tx.lettiRound.count();
      const roundCode = `LET-${String(totalRounds + 1).padStart(6, '0')}`;

      const round = await tx.lettiRound.create({
        data: {
          roundCode,
          userId: effectiveUserId,
          pickedIndex: pickedCardIndex,
          status: 'PREPARED',
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: nextNonce,
          shuffledOrder: JSON.stringify(shuffledOrder),
        },
      });

      return {
        roundId: round.id,
        roundCode: round.roundCode,
        pickedCard: LettiEngine.cardFromIndex(pickedCardIndex),
        shuffledCardCount: shuffledOrder.length,
        status: 'PREPARED',
        provablyFair: {
          serverSeedHash: round.serverSeedHash,
          clientSeed: round.clientSeed,
          nonce: round.nonce,
        },
      };
    });
  }

  /**
   * Step 3 & 4 of Fair-Round Lifecycle:
   * Idempotently validates wager, locks wallet atomically, evaluates the exact
   * server-committed 51-card shuffle, settles balance & ledger, and reveals serverSeed.
   */
  static async confirmRound(
    userId: string,
    roundId: string,
    amount: number,
    idempotencyKey: string
  ): Promise<LettiConfirmResponse> {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw { statusCode: 400, message: 'Bet amount must be a valid positive number.' };
    }
    if (!idempotencyKey || idempotencyKey.trim().length < 6) {
      throw { statusCode: 400, message: 'Valid idempotencyKey is required.' };
    }

    await this.ensurePlayable(amount);
    const effectiveUserId = userId || 'demo-guest';
    await this.ensureGuestWallet(effectiveUserId);
    const amountInSantim = WalletServiceLogic.etbToSantim(amount);

    return prisma.$transaction(async (tx) => {
      // Idempotent replay check: return exact settled round without double charging or paying
      const existingByIdem = await tx.lettiRound.findUnique({ where: { idempotencyKey } });
      if (existingByIdem) {
        if (existingByIdem.userId !== effectiveUserId) {
          throw { statusCode: 403, message: 'Idempotency key belongs to another player.' };
        }
        const wallet = await WalletRepository.findByUserId(effectiveUserId, tx);
        return this.formatConfirmResponse(
          existingByIdem,
          (wallet?.balance || 0) + (wallet?.bonusBalance || 0)
        );
      }

      const round = await tx.lettiRound.findUnique({ where: { id: roundId } });
      if (!round || round.userId !== effectiveUserId) {
        throw { statusCode: 404, message: 'Prepared Letti round not found.' };
      }

      if (round.status === 'SETTLED') {
        throw {
          statusCode: 409,
          message: 'This round has already been settled. Please prepare a new round.',
        };
      }
      if (round.status !== 'PREPARED') {
        throw {
          statusCode: 409,
          message: 'This prepared round is no longer active. Please pick a card again.',
        };
      }

      const wallet = await WalletRepository.findByUserId(effectiveUserId, tx);
      if (!wallet) {
        throw { statusCode: 400, message: 'Insufficient wallet balance.' };
      }

      const shuffledOrder: number[] = JSON.parse(round.shuffledOrder);
      const result = LettiEngine.evaluateFromOrder(amount, round.pickedIndex, shuffledOrder);

      const payoutInSantim = WalletServiceLogic.etbToSantim(result.payout);
      const profitInSantim = WalletServiceLogic.etbToSantim(result.profit);

      const roundClaim = await tx.lettiRound.updateMany({
        where: { id: round.id, status: 'PREPARED' },
        data: {
          status: 'SETTLED',
          idempotencyKey,
          amountSantim: amountInSantim,
          payoutSantim: payoutInSantim,
          won: result.won,
          outcome: JSON.stringify(result.outcome),
          settledAt: new Date(),
        },
      });
      if (roundClaim.count === 0) {
        throw { statusCode: 409, message: 'Round settlement conflict detected. Please refresh.' };
      }

      const seed = await GameService.getActiveSeed(effectiveUserId, tx);
      const betRecord = await tx.bet.create({
        data: {
          userId: effectiveUserId,
          seedId: seed.id,
          gameId: 'letti',
          amount: amountInSantim,
          multiplier: result.multiplier,
          payout: payoutInSantim,
          profit: profitInSantim,
          won: result.won,
          outcome: JSON.stringify(result.outcome),
          serverSeed: round.serverSeed,
          serverSeedHash: round.serverSeedHash,
          clientSeed: round.clientSeed,
          nonce: round.nonce,
        },
      });

      const settlement = await BonusService.settleBetWithWalletSeparation(tx, {
        userId: effectiveUserId,
        wallet,
        gameId: 'letti',
        betIdSuffix: betRecord.id,
        amountSantim: amountInSantim,
        payoutSantim: payoutInSantim,
        won: result.won,
        multiplier: result.multiplier,
        gameName: 'Letti 52-Card Match',
      });

      await tx.lettiRound.update({
        where: { id: round.id },
        data: { betId: betRecord.id },
      });

      await TransactionRepository.createTransaction(
        {
          walletId: wallet.id,
          amount: amountInSantim,
          type: 'BET_PLACED',
          balanceAfter: settlement.balanceAfterBetSantim,
          referenceId: `${betRecord.id}-placed`,
          description: `Bet placed on Letti 52-Card Match (${round.roundCode})`,
        },
        tx
      );

      if (result.won) {
        await TransactionRepository.createTransaction(
          {
            walletId: wallet.id,
            amount: payoutInSantim,
            type: 'BET_WON',
            balanceAfter: settlement.newCashBalanceSantim,
            referenceId: `${betRecord.id}-won`,
            description: `Bet won on Letti 52-Card Match (${result.multiplier}x Total Return)`,
          },
          tx
        );
      }

      const settledRound = {
        ...round,
        betId: betRecord.id,
        amountSantim: amountInSantim,
        payoutSantim: payoutInSantim,
        won: result.won,
        outcome: JSON.stringify(result.outcome),
      };

      return this.formatConfirmResponse(
        settledRound,
        settlement.newCashBalanceSantim + settlement.newBonusBalanceSantim
      );
    });
  }

  /**
   * Reconnection recovery: restores an active PREPARED round, or an interrupted SETTLED round by ID.
   */
  static async getActiveRound(userId: string, lastRoundId?: string) {
    const effectiveUserId = userId || 'demo-guest';

    const prepared = await prisma.lettiRound.findFirst({
      where: { userId: effectiveUserId, status: 'PREPARED' },
      orderBy: { createdAt: 'desc' },
    });

    if (prepared) {
      return {
        mode: 'PREPARED' as const,
        round: {
          roundId: prepared.id,
          roundCode: prepared.roundCode,
          pickedCard: LettiEngine.cardFromIndex(prepared.pickedIndex),
          shuffledCardCount: 51,
          status: 'PREPARED' as const,
          provablyFair: {
            serverSeedHash: prepared.serverSeedHash,
            clientSeed: prepared.clientSeed,
            nonce: prepared.nonce,
          },
        },
      };
    }

    if (lastRoundId) {
      const settled = await prisma.lettiRound.findFirst({
        where: { id: lastRoundId, userId: effectiveUserId, status: 'SETTLED' },
      });
      if (settled) {
        const wallet = await prisma.wallet.findUnique({ where: { userId: effectiveUserId } });
        return {
          mode: 'SETTLED' as const,
          round: this.formatConfirmResponse(
            settled,
            (wallet?.balance || 0) + (wallet?.bonusBalance || 0)
          ),
        };
      }
    }

    return { mode: 'NONE' as const, round: null };
  }

  /**
   * Returns persistent settled Letti round history with verifiable Provably Fair proof.
   */
  static async getRoundHistory(userId: string, limit = 20): Promise<LettiRoundHistoryItem[]> {
    const effectiveUserId = userId || 'demo-guest';
    const rounds = await prisma.lettiRound.findMany({
      where: { userId: effectiveUserId, status: 'SETTLED' },
      orderBy: { settledAt: 'desc' },
      take: limit,
    });

    return rounds.map((r) => {
      const outcome: LettiOutcome = JSON.parse(r.outcome || '{}');
      const betAmount = WalletServiceLogic.santimToEtb(r.amountSantim || 0);
      const payout = WalletServiceLogic.santimToEtb(r.payoutSantim || 0);
      const totalFlips = outcome.totalFlips || outcome.steps?.length || 0;
      const winnerSide = outcome.winnerSide || 'SYSTEM';

      return {
        roundId: r.id,
        roundCode: r.roundCode,
        pickedCard: outcome.pickedCard || LettiEngine.cardFromIndex(r.pickedIndex),
        matchedCard: outcome.matchedCard || LettiEngine.cardFromIndex(r.pickedIndex),
        winnerSide,
        winningFlip: `${winnerSide} #${totalFlips}`,
        totalFlips,
        betAmount,
        payout,
        multiplier: r.won ? LettiEngine.PAYOUT_MULTIPLIER : 0,
        won: Boolean(r.won),
        serverSeedHash: r.serverSeedHash,
        serverSeed: r.serverSeed,
        clientSeed: r.clientSeed,
        nonce: r.nonce,
        outcome,
        createdAt: (r.settledAt || r.createdAt).toISOString(),
      };
    });
  }

  /**
   * Independently verifies a Letti round's SHA-256 seed commitment, 51-card order, and outcome.
   */
  static async verifyRound(input: {
    roundId?: string;
    serverSeed?: string;
    serverSeedHash?: string;
    clientSeed?: string;
    nonce?: number;
    pickedCardIndex?: number;
    amount?: number;
  }): Promise<LettiVerifyResponse> {
    let serverSeed = input.serverSeed || '';
    let serverSeedHash = input.serverSeedHash || '';
    let clientSeed = input.clientSeed || '';
    let nonce = input.nonce ?? 0;
    let pickedCardIndex = input.pickedCardIndex ?? 0;
    let amount = input.amount ?? 100;

    if (input.roundId) {
      const round = await prisma.lettiRound.findUnique({ where: { id: input.roundId } });
      if (!round) {
        throw { statusCode: 404, message: 'Letti round not found.' };
      }
      if (round.status !== 'SETTLED') {
        throw { statusCode: 400, message: 'Round seed cannot be verified until the round is settled.' };
      }
      serverSeed = round.serverSeed;
      serverSeedHash = round.serverSeedHash;
      clientSeed = round.clientSeed;
      nonce = round.nonce;
      pickedCardIndex = round.pickedIndex;
      amount = WalletServiceLogic.santimToEtb(round.amountSantim || 10000);
    }

    const hashValid =
      Boolean(serverSeed) &&
      Boolean(serverSeedHash) &&
      ProvablyFair.hashServerSeed(serverSeed) === serverSeedHash;

    const shuffledOrder = LettiEngine.buildShuffledOrder(pickedCardIndex, serverSeed, clientSeed, nonce);
    const evalRes = LettiEngine.evaluateFromOrder(amount, pickedCardIndex, shuffledOrder);

    return {
      isValid: hashValid,
      hashValid,
      pickedCard: evalRes.outcome.pickedCard,
      winnerSide: evalRes.outcome.winnerSide,
      matchedCard: evalRes.outcome.matchedCard,
      totalFlips: evalRes.outcome.totalFlips,
      payout: evalRes.payout,
      multiplier: evalRes.multiplier,
      shuffledOrder,
      steps: evalRes.outcome.steps,
    };
  }
}
