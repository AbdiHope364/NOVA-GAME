import { CoinFlipEngine } from '@nova/game-coin-flip';
import { DiceEngine } from '@nova/game-dice';
import { CrashEngine } from '@nova/game-crash';
import { RouletteEngine } from '@nova/game-roulette';
import { BaseGameEngine } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { WalletRepository } from '../repositories/wallet.repository.js';
import { BetRepository } from '../repositories/bet.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { prisma } from '../config/database.js';
import { WalletServiceLogic } from '@nova/wallet';
import { GameId } from '@nova/types';

export class GameService {
  private static engines: Map<GameId, BaseGameEngine<any, any>> = new Map<GameId, BaseGameEngine<any, any>>([
    ['coin-flip', new CoinFlipEngine()],
    ['dice', new DiceEngine()],
    ['crash', new CrashEngine()],
    ['roulette', new RouletteEngine()],
  ]);

  /**
   * Gets or creates active Provably Fair seed for player
   */
  static async getActiveSeed(userId: string) {
    let seed = await prisma.provablyFairSeed.findFirst({
      where: { userId, active: true },
    });

    if (!seed) {
      const serverSeed = ProvablyFair.generateServerSeed();
      const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);
      const clientSeed = ProvablyFair.generateClientSeed();

      seed = await prisma.provablyFairSeed.create({
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
   * Main game play router executing plug-in game engines
   */
  static async playGame(userId: string, gameId: GameId, amount: number, params: any, customClientSeed?: string) {
    const engine = this.engines.get(gameId);
    if (!engine) {
      throw { statusCode: 404, message: `Game module '${gameId}' not found` };
    }

    // 1. Validate bet parameters
    const validation = engine.validateBet(amount, params);
    if (!validation.valid) {
      throw { statusCode: 400, message: validation.error };
    }

    // 2. Lock & Validate Wallet Balance
    const wallet = await WalletRepository.findByUserId(userId);
    if (!wallet || !WalletServiceLogic.validateSufficientBalance(wallet, amount)) {
      throw { statusCode: 400, message: 'Insufficient wallet balance' };
    }

    // 3. Fetch Provably Fair seeds
    const seed = await this.getActiveSeed(userId);
    const clientSeed = customClientSeed || seed.clientSeed;
    const currentNonce = seed.nonce + 1;

    // 4. Evaluate Game Engine
    const result = engine.evaluate({
      amount,
      serverSeed: seed.serverSeed,
      clientSeed,
      nonce: currentNonce,
      params,
    });

    // 5. Atomic database balance update & ledger recording
    const balanceAfterBet = WalletServiceLogic.deductBet(wallet.balance, amount);
    const finalBalance = result.won ? WalletServiceLogic.creditWin(balanceAfterBet, result.payout) : balanceAfterBet;

    await WalletRepository.updateBalance(wallet.id, finalBalance);

    // Record bet ledger entry
    const betRecord = await BetRepository.createBet({
      userId,
      seedId: seed.id,
      gameId,
      amount,
      multiplier: result.multiplier,
      payout: result.payout,
      profit: result.profit,
      won: result.won,
      outcome: result.outcome,
      serverSeed: seed.serverSeed,
      serverSeedHash: seed.serverSeedHash,
      clientSeed,
      nonce: currentNonce,
    });

    // Record transaction entry
    await TransactionRepository.createTransaction({
      walletId: wallet.id,
      amount,
      type: 'BET_PLACED',
      referenceId: betRecord.id,
      description: `Bet placed on ${engine.config.name}`,
    });

    if (result.won) {
      await TransactionRepository.createTransaction({
        walletId: wallet.id,
        amount: result.payout,
        type: 'BET_WON',
        referenceId: betRecord.id,
        description: `Bet won on ${engine.config.name} (${result.multiplier}x)`,
      });
    }

    // Increment seed nonce
    await prisma.provablyFairSeed.update({
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
      newBalance: finalBalance,
      provablyFair: {
        serverSeedHash: seed.serverSeedHash,
        clientSeed,
        nonce: currentNonce,
      },
    };
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
