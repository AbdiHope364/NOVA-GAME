import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ChessMatchService } from '../services/chessMatch.service.js';

export class ChessMatchController {
  static async listLobby(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const lobby = await ChessMatchService.getLobby();
      res.json({ success: true, data: lobby });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cat = String(req.query.category || 'BLITZ').toUpperCase();
      const validCat = ['BULLET', 'BLITZ', 'RAPID', 'CLASSICAL'].includes(cat)
        ? (cat as 'BULLET' | 'BLITZ' | 'RAPID' | 'CLASSICAL')
        : 'BLITZ';
      const entries = await ChessMatchService.getLeaderboard(validCat);
      res.json({ success: true, data: entries });
    } catch (err) {
      next(err);
    }
  }

  static async getRatings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const ratings = await ChessMatchService.getUserCategoryRatings(userId);
      res.json({ success: true, data: ratings });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const history = await ChessMatchService.getUserHistory(userId);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  static async getActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const active = await ChessMatchService.getActiveRoomForUser(userId);
      res.json({ success: true, data: active });
    } catch (err) {
      next(err);
    }
  }

  static async getRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const view = await ChessMatchService.getRoomView(req.params.roomId, userId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async quickMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const view = await ChessMatchService.quickMatch(userId, req.body || {});
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async createRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const view = await ChessMatchService.createRoom(userId, {
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
      const userId = req.user!.userId;
      const codeOrId = req.body?.roomId || req.body?.roomCode || '';
      const view = await ChessMatchService.joinRoom(userId, codeOrId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async leaveRoom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await ChessMatchService.leaveRoom(req.params.roomId, userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async submitMove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const view = await ChessMatchService.submitMove(req.params.matchId, userId, req.body);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async resignMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const view = await ChessMatchService.resignMatch(req.params.matchId, userId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async drawAction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const action = req.body?.action;
      const view =
        action === 'OFFER'
          ? await ChessMatchService.offerDraw(req.params.matchId, userId)
          : await ChessMatchService.respondDraw(req.params.matchId, userId, action === 'ACCEPT');
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async claimTimeout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const view = await ChessMatchService.claimTimeout(req.params.matchId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async requestRematch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const view = await ChessMatchService.requestRematch(req.params.roomId, userId);
      res.json({ success: true, data: view });
    } catch (err) {
      next(err);
    }
  }

  static async recordAiMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const saved = await ChessMatchService.recordAiMatch(userId, req.body);
      res.status(201).json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }

  static async getAdminOverview(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = await ChessMatchService.getAdminOverview();
      res.json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }

  static async updateAdminConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const updated = await ChessMatchService.updateAdminConfig(adminId, req.body || {});
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async adminAbortMatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const result = await ChessMatchService.adminAbortMatch(
        adminId,
        req.params.matchId,
        req.body?.reason
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
