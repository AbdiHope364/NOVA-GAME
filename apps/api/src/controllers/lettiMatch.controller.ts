import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { LettiMatchService } from '../services/lettiMatch.service.js';

export class LettiMatchController {
  static async getConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const config = await LettiMatchService.getConfig();
      res.json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  static async listLobby(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rooms = await LettiMatchService.listWaitingRooms(20);
      res.json({ success: true, data: rooms });
    } catch (err) {
      next(err);
    }
  }

  static async getActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const room = await LettiMatchService.getActiveRoomForUser(userId);
      res.json({ success: true, data: room });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const history = await LettiMatchService.getMatchHistoryForUser(req.user!.userId);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  static async createRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await LettiMatchService.createRoom(
        req.user!.userId,
        Number(req.body.stakeEtb),
        'PRIVATE'
      );
      res.status(201).json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async joinRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const codeOrId = req.body.roomCode || req.body.roomId || '';
      const view = await LettiMatchService.joinRoom(req.user!.userId, codeOrId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async quickMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await LettiMatchService.quickMatch(
        req.user!.userId,
        Number(req.body.stakeEtb)
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async leaveRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await LettiMatchService.leaveOrCancelRoom(
        req.user!.userId,
        req.params.roomId
      );
      if (result.action === 'FORFEIT_REQUIRED' && result.matchId) {
        await LettiMatchService.handleAction(req.user!.userId, result.matchId, {
          actionType: 'FORFEIT',
        });
      }
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async submitAction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const resAction = await LettiMatchService.handleAction(
        req.user!.userId,
        req.params.matchId,
        req.body
      );
      const view = await LettiMatchService.getSanitizedRoomView(
        resAction.roomId,
        req.user!.userId
      );
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async requestRematch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const resRematch = await LettiMatchService.requestRematch(
        req.user!.userId,
        req.params.roomId
      );
      res.json({ success: true, data: resRematch });
    } catch (err) {
      next(err);
    }
  }

  // Admin handlers
  static async getAdminOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = await LettiMatchService.getAdminOverview();
      res.json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }

  static async updateAdminConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await LettiMatchService.updateAdminConfig(req.user!.userId, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async cancelAdminRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const resCancel = await LettiMatchService.leaveOrCancelRoom(
        req.user!.userId,
        req.params.roomId,
        true
      );
      res.json({ success: true, data: resCancel });
    } catch (err) {
      next(err);
    }
  }
}
