import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { GameService } from '../services/game.service.js';
import { CartellaService } from '../services/cartella.service.js';
import { BetRepository } from '../repositories/bet.repository.js';
import { ProvablyFair } from '@nova/fairness';
import { GameId } from '@nova/types';
import { prisma } from '../config/database.js';
import { PlatformSettingsService } from '../services/platformSettings.service.js';

export class GameController {
  static async playGame(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { gameId } = req.params;
      const { amount, params, clientSeed } = req.body;
      const userId = req.user?.userId || 'demo-guest';
      const result = await GameService.playGame(
        userId,
        gameId as GameId,
        amount,
        params,
        clientSeed
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getActiveSeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.user?.userId || 'demo-guest';
      const seed = await GameService.getActiveSeed(targetUserId);
      res.json({
        success: true,
        data: {
          serverSeedHash: seed.serverSeedHash,
          clientSeed: seed.clientSeed,
          nonce: seed.nonce,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async rotateSeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { newClientSeed } = req.body;
      const targetUserId = req.user?.userId || 'demo-guest';
      const seed = await GameService.rotateSeed(targetUserId, newClientSeed);
      res.json({
        success: true,
        data: {
          serverSeedHash: seed.serverSeedHash,
          clientSeed: seed.clientSeed,
          nonce: seed.nonce,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyResult(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serverSeed, clientSeed, nonce, outcome } = req.body;
      const isValid = ProvablyFair.verifyResult(serverSeed, clientSeed, nonce, outcome);
      res.json({ success: true, data: { isValid } });
    } catch (err) {
      next(err);
    }
  }

  static async getRecentBets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const bets = await BetRepository.getRecentBets(20);
      res.json({ success: true, data: bets });
    } catch (err) {
      next(err);
    }
  }

  static async getUserBets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const bets = await BetRepository.findByUserId(req.user!.userId, 20);
      res.json({ success: true, data: bets });
    } catch (err) {
      next(err);
    }
  }

  static async getCartellaRoundConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const config = await CartellaService.getRoundConfig();
      res.json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  static async getPublicConfigs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const [games, platform] = await Promise.all([
        prisma.gameConfig.findMany({
          where: { gameId: { not: '__platform_settings__' } },
          orderBy: { gameId: 'asc' },
        }),
        PlatformSettingsService.getSettings(),
      ]);
      res.json({ success: true, data: { games, platform } });
    } catch (err) {
      next(err);
    }
  }
}
