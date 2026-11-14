import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { LettiService } from '../services/letti.service.js';

export class LettiController {
  static async prepare(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { pickedCardIndex, clientSeed } = req.body;
      const userId = req.user?.userId || 'demo-guest';
      const round = await LettiService.prepareRound(userId, pickedCardIndex, clientSeed);
      res.json({ success: true, data: round });
    } catch (err) {
      next(err);
    }
  }

  static async confirm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { roundId, amount, idempotencyKey } = req.body;
      const userId = req.user?.userId || 'demo-guest';
      const result = await LettiService.confirmRound(userId, roundId, amount, idempotencyKey);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || 'demo-guest';
      const lastRoundId = typeof req.query.lastRoundId === 'string' ? req.query.lastRoundId : undefined;
      const data = await LettiService.getActiveRound(userId, lastRoundId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || 'demo-guest';
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const history = await LettiService.getRoundHistory(userId, limit);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  static async verify(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LettiService.verifyRound(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
