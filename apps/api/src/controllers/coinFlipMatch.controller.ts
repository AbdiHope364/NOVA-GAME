import { Request, Response } from 'express';
import { CoinFlipMatchService } from '../services/coinFlipMatch.service.js';

export class CoinFlipMatchController {
  static async getConfig(req: Request, res: Response) {
    try {
      const config = CoinFlipMatchService.getConfig();
      return res.json({ success: true, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAvailableRooms(req: Request, res: Response) {
    try {
      const rooms = CoinFlipMatchService.getAvailableRooms();
      return res.json({ success: true, data: rooms });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRecentWinners(req: Request, res: Response) {
    try {
      const winners = CoinFlipMatchService.getRecentWinners(10);
      return res.json({ success: true, data: winners });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    try {
      const leaderboard = CoinFlipMatchService.getLeaderboard();
      return res.json({ success: true, data: leaderboard });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getUserStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req.query.userId as string);
      if (!userId) {
        return res.json({
          success: true,
          data: { totalMatches: 0, wins: 0, losses: 0, winRate: 0, totalEarnings: 0 },
        });
      }
      const stats = CoinFlipMatchService.getUserStats(userId);
      return res.json({ success: true, data: stats });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createPrivateRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || `guest-${Date.now().toString(36)}`;
      const username = (req as any).user?.username || `Guest_${userId.slice(-4)}`;
      const { stake = 100, choice = 'HEADS' } = req.body;

      const room = await CoinFlipMatchService.createPrivateRoom(
        userId,
        username,
        Number(stake),
        choice
      );
      return res.json({ success: true, data: room });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async joinPrivateRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || `guest-${Date.now().toString(36)}`;
      const username = (req as any).user?.username || `Guest_${userId.slice(-4)}`;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, error: 'Room code is required' });
      }

      const room = await CoinFlipMatchService.joinPrivateRoom(userId, username, code);
      return res.json({ success: true, data: room });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
