import { CoinFlipEngine } from '@nova/game-coin-flip';
import { DiceEngine } from '@nova/game-dice';
import { CrashEngine } from '@nova/game-crash';
import { RouletteEngine } from '@nova/game-roulette';
import { BingoEngine } from '@nova/game-bingo';
import { LimboEngine } from '@nova/game-limbo';
import { PlinkoEngine } from '@nova/game-plinko';
import { MinesEngine } from '@nova/game-mines';
import { HiLoEngine } from '@nova/game-hilo';
import { DamaEngine } from '@nova/game-dama';
import { LettiEngine } from '@nova/game-letti';
import { BaseGameEngine } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { WalletRepository } from '../repositories/wallet.repository.js';
import { BetRepository } from '../repositories/bet.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { prisma } from '../config/database.js';
import { WalletServiceLogic } from '@nova/wallet';
import { GameId } from '@nova/types';
import { PlatformSettingsService } from './platformSettings.service.js';
import { BonusService } from './bonus.service.js';

export class GameService {
  private static engines: Map<GameId, BaseGameEngine<any, any>> = new Map<GameId, BaseGameEngine<any, any>>([
    ['coin-flip', new CoinFlipEngine()],
    ['dice', new DiceEngine()],
    ['crash', new CrashEngine()],
    ['roulette', new RouletteEngine()],
    ['bingo', new BingoEngine()],
    ['limbo', new LimboEngine()],
    ['plinko', new PlinkoEngine()],
    ['mines', new MinesEngine()],
    ['hilo', new HiLoEngine()],
    ['dama', new DamaEngine()],
    ['letti', new LettiEngine()],
  ]);

  /**
   * Gets or creates active Provably Fair seed for player
   */
  static async getActiveSeed(userId: string, tx?: any) {
    const client = tx || prisma;
    let seed = await client.provablyFairSeed.findFirst({
      where: { userId, active: true },
    });

    if (!seed) {
      const serverSeed = ProvablyFair.generateServerSeed();
      const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
      const clientSeed = ProvablyFair.generateClientSeed();

      seed = await client.provablyFairSeed.create({
        data: {
          userId,
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: 0,
          active: true,
        },
      });
    }

    return seed;
  }

  /**
   * Main game play router executing plug-in game engines with ACID ledger transactions
   */
  static async playGame(userId: string, gameId: GameId, amount: number, params: any, customClientSeed?: string) {
    const platformSettings = await PlatformSettingsService.getSettings();
    if (platformSettings.maintenanceMode) {
      throw { statusCode: 503, message: 'Platform is currently under scheduled maintenance.' };
    }

    const gameConfig = await prisma.gameConfig.findUnique({ where: { gameId } });
    if (gameConfig && !gameConfig.enabled) {
      throw { statusCode: 403, message: `${gameConfig.name} is currently under maintenance.` };
    }
    if (gameConfig && amount > 0 && (amount < gameConfig.minBet || amount > gameConfig.maxBet)) {
      throw {
        statusCode: 400,
        message: `Bet for ${gameConfig.name} must be between ${gameConfig.minBet} and ${gameConfig.maxBet} ETB.`,
      };
    }

    const engine = this.engines.get(gameId);
    if (!engine) {
      throw { statusCode: 404, message: `Game module '${gameId}' not found` };
    }

    // 1. Validate bet parameters
    const validation = engine.validateBet(amount, params);
    if (!validation.valid) {
      throw { statusCode: 400, message: validation.error };
    }

    const effectiveUserId = userId || 'demo-guest';

    // Ensure demo-guest has an active user & funded wallet in the database
    if (effectiveUserId === 'demo-guest') {
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
                balance: 1000000, // 10,000.00 ETB
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

    const amountInSantim = WalletServiceLogic.etbToSantim(amount);

    // 2. Execute Provably Fair evaluation and ledger settlement in atomic transaction
    return prisma.$transaction(async (tx) => {
      // Lock & fetch Wallet
      const wallet = await WalletRepository.findByUserId(effectiveUserId, tx);
      if (!wallet) {
        throw { statusCode: 400, message: 'Insufficient wallet balance' };
      }

      // Fetch Provably Fair seeds
      const seed = await this.getActiveSeed(effectiveUserId, tx);
      const clientSeed = customClientSeed || seed.clientSeed;
      const currentNonce = seed.nonce + 1;

      // Evaluate Game Engine
      const result = engine.evaluate({
        amount,
        serverSeed: seed.serverSeed,
        clientSeed,
        nonce: currentNonce,
        params,
      });

      const payoutInSantim = WalletServiceLogic.etbToSantim(result.payout);
      const profitInSantim = WalletServiceLogic.etbToSantim(result.profit);

      // Record bet ledger entry directly in database (rolled back if wallet settlement fails)
      const betRecord = await tx.bet.create({
        data: {
          userId: effectiveUserId,
          seedId: seed.id,
          gameId,
          amount: amountInSantim,
          multiplier: result.multiplier,
          payout: payoutInSantim,
          profit: profitInSantim,
          won: result.won,
          outcome: JSON.stringify(result.outcome),
          serverSeed: seed.serverSeed,
          serverSeedHash: seed.serverSeedHash,
          clientSeed,
          nonce: currentNonce,
        },
      });

      const settlement = await BonusService.settleBetWithWalletSeparation(tx, {
        userId: effectiveUserId,
        wallet,
        gameId,
        betIdSuffix: betRecord.id,
        amountSantim: amountInSantim,
        payoutSantim: payoutInSantim,
        won: result.won,
        multiplier: result.multiplier,
        gameName: engine.config.name,
      });

      // Record BET_PLACED transaction entry in database
      await TransactionRepository.createTransaction(
        {
          walletId: wallet.id,
          amount: amountInSantim,
          type: 'BET_PLACED',
          balanceAfter: settlement.balanceAfterBetSantim,
          referenceId: `${betRecord.id}-placed`,
          description: `Bet placed on ${engine.config.name}${
            settlement.bonusUsedSantim > 0 ? ' (Promo Credit Used)' : ''
          }`,
        },
        tx
      );

      // Record BET_WON transaction entry in database if won
      if (result.won) {
        await TransactionRepository.createTransaction(
          {
            walletId: wallet.id,
            amount: payoutInSantim,
            type: 'BET_WON',
            balanceAfter: settlement.newCashBalanceSantim,
            referenceId: `${betRecord.id}-won`,
            description: `Bet won on ${engine.config.name} (${result.multiplier}x)`,
          },
          tx
        );
      }

      // Increment seed nonce
      await tx.provablyFairSeed.update({
        where: { id: seed.id },
        data: { nonce: currentNonce },
      });

      return {
        betId: betRecord.id,
        gameId,
        amount,
        won: result.won,
        multiplier: result.multiplier,
        payout: result.payout,
        profit: result.profit,
        outcome: result.outcome,
        newBalance: WalletServiceLogic.santimToEtb(
          settlement.newCashBalanceSantim + settlement.newBonusBalanceSantim
        ),
        cashBalance: WalletServiceLogic.santimToEtb(settlement.newCashBalanceSantim),
        bonusBalance: WalletServiceLogic.santimToEtb(settlement.newBonusBalanceSantim),
        lockedWinnings: WalletServiceLogic.santimToEtb(settlement.newLockedWinningsSantim),
        withdrawableBalance: WalletServiceLogic.santimToEtb(settlement.newWithdrawableSantim),
        provablyFair: {
          serverSeedHash: seed.serverSeedHash,
          clientSeed,
          nonce: currentNonce,
        },
      };
    });
  }

  /**
   * Rotate seed pairs
   */
  static async rotateSeed(userId: string, newClientSeed?: string) {
    // Unactivate previous seed
    await prisma.provablyFairSeed.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });

    const serverSeed = ProvablyFair.generateServerSeed();
    const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
    const clientSeed = newClientSeed || ProvablyFair.generateClientSeed();

    return prisma.provablyFairSeed.create({
      data: {
        userId,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: 0,
        active: true,
      },
    });
  }
}
