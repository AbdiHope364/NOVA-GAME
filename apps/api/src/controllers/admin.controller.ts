import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserRepository } from '../repositories/user.repository.js';
import { prisma } from '../config/database.js';

export class AdminController {
  static async getOverviewStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userCount = await prisma.user.count();
      const betCount = await prisma.bet.count();
      const totalTurnover = await prisma.bet.aggregate({ _sum: { amount: true } });
      const totalPayout = await prisma.bet.aggregate({ _sum: { payout: true } });

      const grossGamingRevenue = (totalTurnover._sum.amount || 0) - (totalPayout._sum.payout || 0);

      res.json({
        success: true,
        data: {
          userCount,
          betCount,
          totalTurnover: totalTurnover._sum.amount || 0,
          totalPayout: totalPayout._sum.payout || 0,
          grossGamingRevenue,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await UserRepository.findAllUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }
}
