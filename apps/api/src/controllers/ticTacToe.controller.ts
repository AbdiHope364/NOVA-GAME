import { Request, Response } from 'express';
import {
  ticTacToeMatchService,
  ENABLE_REAL_MONEY_COMPETITIVE,
} from '../services/ticTacToeMatch.service.js';

export class TicTacToeController {
  /**
   * GET /api/v1/games/tic-tac-toe
   * Game overview and configurations
   */
  static getOverview(req: Request, res: Response) {
    const userId = (req as any).user?.userId || 'guest';
    const username = (req as any).user?.username || 'Guest';
    const stats = ticTacToeMatchService.getOrCreateStats(userId, username);

    return res.json({
      gameId: 'tic-tac-toe',
      name: 'NOVA Tic-Tac-Toe Arena',
      realMoneyEnabled: ENABLE_REAL_MONEY_COMPETITIVE,
      turnTimeoutSeconds: 15,
      reconnectGraceSeconds: 30,
      userStats: stats,
      modes: [
        {
          id: 'PRACTICE',
          name: 'Practice vs AI',
          description: 'Play against AI on Easy, Medium, or Hard difficulty.',
          stakeRequired: false,
          ratingAffected: false,
        },
        {
          id: 'FREE',
          name: 'Free Multiplayer',
          description: 'Instant matchmaking with real opponents without entry fee.',
          stakeRequired: false,
          ratingAffected: false,
        },
        {
          id: 'RANKED',
          name: 'Ranked Arena',
          description: 'Competitive skill-based matchmaking with seasonal Elo rating.',
          stakeRequired: false,
          ratingAffected: true,
        },
        {
          id: 'PRIVATE',
          name: 'Private Challenge',
          description: 'Create or join a private room with a 6-character room code.',
          stakeRequired: false,
          ratingAffected: false,
        },
        {
          id: 'COMPETITIVE',
          name: 'Competitive Match',
          description: 'Compete for an entry stake with 100% draw refund (staging flag: disabled).',
          stakeRequired: true,
          ratingAffected: true,
          enabled: ENABLE_REAL_MONEY_COMPETITIVE,
        },
      ],
    });
  }

  /**
   * GET /api/v1/games/tic-tac-toe/leaderboard
   */
  static getLeaderboard(req: Request, res: Response) {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const leaderboard = ticTacToeMatchService.getLeaderboard(limit);
    return res.json({ leaderboard });
  }

  /**
   * GET /api/v1/games/tic-tac-toe/my-stats
   */
  static getMyStats(req: Request, res: Response) {
    const userId = (req as any).user?.userId || req.query.userId?.toString() || 'guest';
    const username = (req as any).user?.username || req.query.username?.toString() || 'Player';
    const stats = ticTacToeMatchService.getOrCreateStats(userId, username);
    return res.json({ stats });
  }

  /**
   * GET /api/v1/games/tic-tac-toe/history
   */
  static getHistory(req: Request, res: Response) {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const history = ticTacToeMatchService.getRecentMatches(limit);
    return res.json({ history });
  }

  /**
   * GET /api/v1/games/tic-tac-toe/admin/overview
   */
  static getAdminOverview(req: Request, res: Response) {
    const overview = ticTacToeMatchService.getAdminOverview();
    return res.json({ overview });
  }
}
