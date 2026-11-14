import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { EngagementService } from '../services/engagement.service.js';

export class EngagementController {
  static async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || 'demo-guest';
      const data = await EngagementService.getPlayerEngagementSummary(userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async claimDailyCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await EngagementService.claimDailyCheckIn(req.user!.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async claimMission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await EngagementService.claimMission(
        req.user!.userId,
        req.params.missionCode
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateCustomization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await EngagementService.updateCustomization(req.user!.userId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Admin handlers
  static async getAdminOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await EngagementService.getAdminOverview();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateAdminConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await EngagementService.updateAdminConfig(req.user!.userId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async reviewReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await EngagementService.reviewReport(
        req.user!.userId,
        req.params.reportId,
        req.body.decision
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
