import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { BonusService } from '../services/bonus.service.js';

export class BonusController {
  static async getPlayerPromotions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || 'demo-guest';
      const data = await BonusService.getPlayerPromotionsSummary(userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAdminOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await BonusService.getAdminOverview();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateCampaign(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await BonusService.updateCampaign(req.user!.userId, req.body);
      res.json({ success: true, data: updated, message: 'Bonus & Referral campaign updated.' });
    } catch (err) {
      next(err);
    }
  }

  static async reviewReferral(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { referralId } = req.params;
      const { decision, reason } = req.body;
      const result = await BonusService.reviewReferral(req.user!.userId, referralId, decision, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
