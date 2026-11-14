import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserRepository } from '../repositories/user.repository.js';
import { prisma } from '../config/database.js';
import { CrashAdminService } from '../services/crashAdminService.js';
import { WalletService } from '../services/wallet.service.js';
import { CartellaService } from '../services/cartella.service.js';
import { PlatformSettingsService } from '../services/platformSettings.service.js';
import { WalletServiceLogic } from '@nova/wallet';

export class AdminController {
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userCount = await prisma.user.count();
      const activeUserCount = await prisma.user.count({ where: { isActive: true } });
      const betCount = await prisma.bet.count();
      const totalVolume = await prisma.bet.aggregate({ _sum: { amount: true } });
      const totalPayouts = await prisma.bet.aggregate({ _sum: { payout: true } });
      const totalDeposits = await prisma.transaction.aggregate({
        where: { type: 'DEPOSIT', status: 'COMPLETED' },
        _sum: { amount: true },
      });
      const totalWithdrawals = await prisma.transaction.aggregate({
        where: { type: 'WITHDRAWAL', status: 'COMPLETED' },
        _sum: { amount: true },
      });
      const pendingDepositsCount = await prisma.transaction.count({
        where: { type: 'DEPOSIT', status: 'PENDING' },
      });
      const pendingWithdrawalsCount = await prisma.transaction.count({
        where: { type: 'WITHDRAWAL', status: 'PENDING' },
      });

      const totalWageredEtb = totalVolume._sum.amount ? totalVolume._sum.amount / 100 : 0;
      const totalPayoutsEtb = totalPayouts._sum.payout ? totalPayouts._sum.payout / 100 : 0;
      const grossGamingRevenue = Math.max(0, totalWageredEtb - totalPayoutsEtb);
      const averageRtp =
        totalWageredEtb > 0 ? Number(((totalPayoutsEtb / totalWageredEtb) * 100).toFixed(1)) : 0;

      // Build 7-day real turnover & revenue series
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentBetsForChart = await prisma.bet.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { amount: true, payout: true, createdAt: true },
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyMap = new Map<string, { label: string; turnover: number; revenue: number }>();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dailyMap.set(key, { label: dayNames[d.getDay()], turnover: 0, revenue: 0 });
      }

      for (const b of recentBetsForChart) {
        const key = b.createdAt.toISOString().slice(0, 10);
        const entry = dailyMap.get(key);
        if (entry) {
          const amt = b.amount / 100;
          const pay = b.payout / 100;
          entry.turnover += amt;
          entry.revenue += Math.max(0, amt - pay);
        }
      }

      const dailySeries = Array.from(dailyMap.values());

      // Build real Live Activity Feed from latest bets & transactions
      const [latestBets, latestTxs] = await Promise.all([
        prisma.bet.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { username: true } } },
        }),
        prisma.transaction.findMany({
          take: 6,
          where: { type: { in: ['DEPOSIT', 'WITHDRAWAL'] } },
          orderBy: { createdAt: 'desc' },
          include: { wallet: { include: { user: { select: { username: true } } } } },
        }),
      ]);

      const activityItems = [
        ...latestBets.map((b) => ({
          id: `bet-${b.id}`,
          kind: b.won ? 'WIN' : 'BET',
          username: b.user?.username || 'Player',
          gameId: b.gameId,
          amount: b.won ? b.payout / 100 : b.amount / 100,
          multiplier: b.multiplier,
          createdAt: b.createdAt.toISOString(),
        })),
        ...latestTxs.map((t) => ({
          id: `tx-${t.id}`,
          kind: t.type,
          username: t.wallet?.user?.username || 'Player',
          method: t.paymentMethod || 'Wallet',
          amount: t.amount / 100,
          status: t.status,
          createdAt: t.createdAt.toISOString(),
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          totalUsers: userCount,
          activeUsers: activeUserCount,
          totalBets: betCount,
          totalWagered: totalWageredEtb,
          totalPayouts: totalPayoutsEtb,
          platformRevenue: grossGamingRevenue,
          averageRtp,
          totalDeposits: totalDeposits._sum.amount ? totalDeposits._sum.amount / 100 : 0,
          totalWithdrawals: totalWithdrawals._sum.amount ? totalWithdrawals._sum.amount / 100 : 0,
          pendingDepositsCount,
          pendingWithdrawalsCount,
          dailySeries,
          recentActivity: activityItems,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await UserRepository.findAllUsers();
      const sanitized = users.map((u: any) => {
        const { passwordHash: _, ...rest } = u;
        return {
          ...rest,
          wallet: u.wallet
            ? {
                ...u.wallet,
                balance: WalletServiceLogic.santimToEtb(u.wallet.balance),
              }
            : null,
        };
      });
      res.json({ success: true, data: sanitized });
    } catch (err) {
      next(err);
    }
  }

  static async toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserRepository.findById(id);
      if (!user) throw { statusCode: 404, message: 'User not found' };
      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
      });

      if (req.user?.userId) {
        await prisma.adminAuditLog
          .create({
            data: {
              adminId: req.user.userId,
              action: 'USER_STATUS_TOGGLED',
              targetId: id,
              details: JSON.stringify({ isActive: updated.isActive }),
            },
          })
          .catch(() => {});
      }

      const { passwordHash: _, ...safe } = updated;
      res.json({ success: true, data: safe });
    } catch (err) {
      next(err);
    }
  }

  static async getCrashMonitor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = CrashAdminService.getMonitorData();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async pauseCrashEngine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body || {};
      const result = await CrashAdminService.pauseCrashEngine(reason);
      res.json({ success: true, data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  static async resumeCrashEngine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = CrashAdminService.resumeCrashEngine();
      res.json({ success: true, data: result, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  static async getPendingDeposits(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deposits = await WalletService.getPendingDeposits();
      const normalized = deposits.map((d: any) => ({
        ...d,
        amount: d.amountInEtb ?? WalletServiceLogic.santimToEtb(d.amount),
      }));
      res.json({ success: true, data: normalized });
    } catch (err) {
      next(err);
    }
  }

  static async approveDeposit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.userId;
      const result = await WalletService.approveDeposit(id, adminId);
      res.json({
        success: true,
        message: 'Deposit approved and player wallet credited',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async rejectDeposit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.userId;
      const result = await WalletService.rejectDeposit(id, adminId);
      res.json({
        success: true,
        message: 'Deposit request rejected',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  static async getBingoRoundConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const config = await CartellaService.getRoundConfig();
      res.json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  static async updateBingoRoundConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      const updated = await CartellaService.updateRoundConfig(updates);

      if (req.user?.userId) {
        await prisma.adminAuditLog
          .create({
            data: {
              adminId: req.user.userId,
              action: 'NOVAGAME_ROUND_CONFIG_UPDATED',
              details: JSON.stringify(updates),
            },
          })
          .catch(() => {});
      }

      res.json({
        success: true,
        message: 'NovaGame round configuration successfully updated',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPendingWithdrawals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const withdrawals = await WalletService.getPendingWithdrawals();
      const normalized = withdrawals.map((w: any) => ({
        ...w,
        amount: w.amountInEtb ?? WalletServiceLogic.santimToEtb(w.amount),
        wallet: w.wallet
          ? {
              ...w.wallet,
              balance: WalletServiceLogic.santimToEtb(w.wallet.balance),
            }
          : null,
      }));
      res.json({ success: true, data: normalized });
    } catch (err) {
      next(err);
    }
  }

  static async approveWithdrawal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user!.userId;
      const result = await WalletService.approveWithdrawal(id, adminId);
      res.json({ success: true, message: 'Withdrawal marked as completed', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async rejectWithdrawal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const adminId = req.user!.userId;
      const result = await WalletService.rejectWithdrawal(id, adminId, reason);
      res.json({ success: true, message: 'Withdrawal rejected and funds refunded', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getLedger(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, limit } = req.query;
      const entries = await WalletService.getLedgerEntries(
        limit ? parseInt(String(limit), 10) : 100,
        type ? String(type) : undefined
      );
      const normalized = entries.map((e: any) => ({
        ...e,
        amount: e.amountInEtb ?? WalletServiceLogic.santimToEtb(e.amount),
        balanceAfter: e.balanceAfterInEtb,
      }));
      res.json({ success: true, data: normalized });
    } catch (err) {
      next(err);
    }
  }

  static async getGames(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const games = await prisma.gameConfig.findMany({
        where: { gameId: { not: '__platform_settings__' } },
        orderBy: { gameId: 'asc' },
      });
      res.json({ success: true, data: games });
    } catch (err) {
      next(err);
    }
  }

  static async updateGameConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { gameId } = req.params;
      const { enabled, houseEdgePercent, minBet, maxBet } = req.body;
      const updated = await prisma.gameConfig.upsert({
        where: { gameId },
        update: {
          ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
          ...(houseEdgePercent !== undefined ? { houseEdgePercent: Number(houseEdgePercent) } : {}),
          ...(minBet !== undefined ? { minBet: Number(minBet) } : {}),
          ...(maxBet !== undefined ? { maxBet: Number(maxBet) } : {}),
        },
        create: {
          gameId,
          name: gameId.toUpperCase(),
          enabled: enabled ?? true,
          houseEdgePercent: houseEdgePercent ?? 1.0,
          minBet: minBet ?? 1.0,
          maxBet: maxBet ?? 5000.0,
        },
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await PlatformSettingsService.getSettings();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await PlatformSettingsService.updateSettings(req.body);
      if (req.user?.userId) {
        await prisma.adminAuditLog
          .create({
            data: {
              adminId: req.user.userId,
              action: 'PLATFORM_SETTINGS_UPDATED',
              details: JSON.stringify(updated),
            },
          })
          .catch(() => {});
      }
      res.json({ success: true, message: 'Platform settings persisted to database', data: updated });
    } catch (err) {
      next(err);
    }
  }
}
