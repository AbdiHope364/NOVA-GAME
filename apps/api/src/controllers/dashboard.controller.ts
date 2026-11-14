import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { DashboardService } from '../services/dashboard.service.js';

export class DashboardController {
  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || 'demo-guest';
      const data = await DashboardService.getOverview(userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getUnifiedHistory(req.user!.userId, {
        gameId: req.query.gameId as string | undefined,
        result: req.query.result as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : 100,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as any) || 'weekly';
      const metric = (req.query.metric as any) || 'points';
      const validPeriod = ['daily', 'weekly', 'monthly', 'all'].includes(period) ? period : 'weekly';
      const validMetric = ['points', 'wins', 'wagered'].includes(metric) ? metric : 'points';
      const data = await DashboardService.getLeaderboard(
        validPeriod,
        validMetric,
        req.user?.userId
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getNotifications(req.user!.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async markNotificationsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.markNotificationsRead(req.user!.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
