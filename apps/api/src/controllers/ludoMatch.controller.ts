import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { LudoMatchService } from '../services/ludoMatch.service.js';

export class LudoMatchController {
  static async getConfig(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cfg = await LudoMatchService.getConfig();
      res.json({ success: true, data: cfg });
    } catch (err) {
      next(err);
    }
  }

  static async listLobby(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LudoMatchService.listLobby();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.getActiveRoomForUser(req.user!.userId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const items = await LudoMatchService.getUserHistory(req.user!.userId);
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  static async getRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.getRoomView(req.params.roomId, req.user?.userId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async verifyMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LudoMatchService.verifyMatchRolls(req.params.matchId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async quickMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.quickMatch(req.user!.userId, req.body || {});
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async createRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.createRoom(req.user!.userId, {
        ...(req.body || {}),
        roomType: 'PRIVATE',
      });
      res.status(201).json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async joinRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const codeOrId = req.body?.roomId || req.body?.roomCode || '';
      const view = await LudoMatchService.joinRoom(
        req.user!.userId,
        codeOrId,
        req.body?.clientSeed
      );
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async updateClientSeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.updateClientSeed(
        req.params.roomId,
        req.user!.userId,
        req.body?.clientSeed || ''
      );
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async leaveRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LudoMatchService.leaveRoom(req.params.roomId, req.user!.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async rollDice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.rollDice(req.params.matchId, req.user!.userId, {
        idempotencyKey: req.body?.idempotencyKey,
      });
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async moveToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.moveToken(req.params.matchId, req.user!.userId, {
        tokenIndex: Number(req.body?.tokenIndex),
        idempotencyKey: req.body?.idempotencyKey,
      });
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async handleTimeout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.handleTurnTimeout(req.params.matchId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async forfeitMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LudoMatchService.forfeitPlayer(req.params.matchId, req.user!.userId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async recordAiMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LudoMatchService.recordAiMatch(
        req.user!.userId,
        Boolean(req.body?.won)
      );
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAdminOverview(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LudoMatchService.getAdminOverview();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateAdminConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LudoMatchService.updateAdminConfig(req.user!.userId, req.body || {});
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async cancelAdminRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await LudoMatchService.cancelAdminRoom(
        req.user!.userId,
        req.params.roomId,
        req.body?.reason
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
