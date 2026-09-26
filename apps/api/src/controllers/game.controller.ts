import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { GameService } from '../services/game.service.js';
import { BetRepository } from '../repositories/bet.repository.js';
import { ProvablyFair } from '@nova/fairness';
import { GameId } from '@nova/types';

export class GameController {
  static async playGame(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { gameId } = req.params;
      const { amount, params, clientSeed } = req.body;
      const result = await GameService.playGame(req.user!.userId, gameId as GameId, amount, params, clientSeed);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getActiveSeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const seed = await GameService.getActiveSeed(req.user!.userId);
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
      const { clientSeed } = req.body;
      const seed = await GameService.rotateSeed(req.user!.userId, clientSeed);
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
      const { serverSeed, serverSeedHash, clientSeed, nonce } = req.body;
      const verification = ProvablyFair.verifyResult(serverSeed, serverSeedHash, clientSeed, nonce);
      res.json({ success: true, data: verification });
    } catch (err) {
      next(err);
    }
  }

  static async getRecentBets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const bets = await BetRepository.findRecentBets(25);
      res.json({ success: true, data: bets });
    } catch (err) {
      next(err);
    }
  }

  static async getUserBets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const bets = await BetRepository.findUserBets(req.user!.userId, 25);
      res.json({ success: true, data: bets });
    } catch (err) {
      next(err);
    }
  }
}
