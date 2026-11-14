import { WalletServiceLogic } from '@nova/wallet';
import { prisma } from '../config/database.js';
import { PlatformSettingsService } from './platformSettings.service.js';
import { BonusService } from './bonus.service.js';
import { LettiMatchService } from './lettiMatch.service.js';

export interface UnifiedHistoryItem {
  id: string;
  gameId: string;
  gameName: string;
  mode: 'SOLO' | 'PVP';
  matchCode: string;
  stakeEtb: number;
  payoutEtb: number;
  netProfitEtb: number;
  multiplier: number;
  result: 'WIN' | 'LOSS' | 'DRAW' | 'PENDING';
  status: string;
  createdAt: string;
  details?: Record<string, any>;
}

const GAME_NAME_MAP: Record<string, string> = {
  'coin-flip': '3D Gold Coin Flip',
  dice: 'Provable Dice',
  crash: 'Aviator Crash',
  roulette: 'African Mini Roulette',
  mines: 'Mines Sweeper',
  limbo: 'Limbo Rocket',
  plinko: 'Plinko Pyramid',
  bingo: '75-Ball Bingo',
  hilo: 'Hi-Lo Cards',
  letti: 'Letti Card (Solo)',
  'letti-pvp': 'Letti Card (1v1 PvP)',
  dama: 'Ethiopian Dama',
};

export class DashboardService {
  private static getSinceDate(period: string): Date | null {
    const now = new Date();
    if (period === 'daily') {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    if (period === 'weekly') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (period === 'monthly') {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return null;
  }

  /**
   * Unified, ETB-normalized history across all 11 solo games + Letti 1v1 PvP + Dama PvP
   */
  static async getUnifiedHistory(
    userId: string,
    filters: {
      gameId?: string;
      result?: string;
      from?: string;
      to?: string;
      limit?: number;
    } = {}
  ): Promise<UnifiedHistoryItem[]> {
    if (!userId || userId === 'demo-guest') return [];

    const fromDate = filters.from ? new Date(filters.from) : null;
    const toDate = filters.to ? new Date(filters.to) : null;
    if (toDate && !Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
    }

    const dateFilter =
      fromDate || toDate
        ? {
            ...(fromDate && !Number.isNaN(fromDate.getTime()) ? { gte: fromDate } : {}),
            ...(toDate && !Number.isNaN(toDate.getTime()) ? { lte: toDate } : {}),
          }
        : undefined;

    const [bets, lettiMatches, damaMatches] = await Promise.all([
      prisma.bet.findMany({
        where: {
          userId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 150,
      }),
      prisma.lettiMatch.findMany({
        where: {
          OR: [{ playerOneId: userId }, { playerTwoId: userId }],
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        include: { room: true },
        orderBy: { createdAt: 'desc' },
        take: 60,
      }),
      prisma.match.findMany({
        where: {
          OR: [{ whiteUserId: userId }, { blackUserId: userId }],
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 60,
      }),
    ]);

    const items: UnifiedHistoryItem[] = [];

    for (const b of bets) {
      const stakeEtb = WalletServiceLogic.santimToEtb(b.amount);
      const payoutEtb = WalletServiceLogic.santimToEtb(b.payout);
      const netProfitEtb = Number((payoutEtb - stakeEtb).toFixed(2));
      let parsedOutcome: any = null;
      try {
        parsedOutcome = JSON.parse(b.outcome);
      } catch {}

      items.push({
        id: b.id,
        gameId: b.gameId,
        gameName: GAME_NAME_MAP[b.gameId] || b.gameId,
        mode: 'SOLO',
        matchCode: b.id.slice(0, 8).toUpperCase(),
        stakeEtb,
        payoutEtb,
        netProfitEtb,
        multiplier: Number(b.multiplier || 0),
        result: b.won ? 'WIN' : 'LOSS',
        status: 'COMPLETED',
        createdAt: b.createdAt.toISOString(),
        details: {
          nonce: b.nonce,
          serverSeedHash: b.serverSeedHash,
          outcome: parsedOutcome,
        },
      });
    }

    for (const lm of lettiMatches) {
      const stakeEtb = WalletServiceLogic.santimToEtb(lm.room.stakeSantim);
      const isPending = lm.status !== 'COMPLETED' && lm.status !== 'CANCELLED';
      const isDraw = lm.resultType === 'DRAW' || lm.resultType === 'CANCELLED';
      const didWin = lm.winnerId === userId;
      const payoutEtb = isPending
        ? 0
        : isDraw
        ? stakeEtb
        : didWin
        ? WalletServiceLogic.santimToEtb(lm.payoutSantim)
        : 0;
      const netProfitEtb = isPending ? 0 : Number((payoutEtb - stakeEtb).toFixed(2));

      items.push({
        id: lm.id,
        gameId: 'letti-pvp',
        gameName: 'Letti Card (1v1 PvP)',
        mode: 'PVP',
        matchCode: lm.room.roomCode,
        stakeEtb,
        payoutEtb,
        netProfitEtb,
        multiplier: stakeEtb > 0 && didWin ? Number((payoutEtb / stakeEtb).toFixed(2)) : 0,
        result: isPending ? 'PENDING' : isDraw ? 'DRAW' : didWin ? 'WIN' : 'LOSS',
        status: lm.status,
        createdAt: (lm.completedAt || lm.createdAt).toISOString(),
        details: {
          roomId: lm.roomId,
          resultType: lm.resultType,
          totalPotEtb: WalletServiceLogic.santimToEtb(lm.totalPotSantim),
        },
      });
    }

    for (const dm of damaMatches) {
      const stakeEtb = WalletServiceLogic.santimToEtb(Number(dm.stakeMinor));
      const isPending = dm.status === 'ACTIVE' || dm.status === 'LOBBY';
      const isDraw = dm.result === 'DRAW' || dm.result === 'CANCELLED';
      const didWin = dm.winnerId === userId;
      const potEtb = stakeEtb * 2;
      const rakeEtb = Number(((potEtb * dm.rakeBps) / 10000).toFixed(2));
      const payoutEtb = isPending ? 0 : isDraw ? stakeEtb : didWin ? Number((potEtb - rakeEtb).toFixed(2)) : 0;
      const netProfitEtb = isPending ? 0 : Number((payoutEtb - stakeEtb).toFixed(2));

      items.push({
        id: dm.id,
        gameId: 'dama',
        gameName: 'Ethiopian Dama',
        mode: 'PVP',
        matchCode: dm.inviteCode || dm.id.slice(0, 8).toUpperCase(),
        stakeEtb,
        payoutEtb,
        netProfitEtb,
        multiplier: stakeEtb > 0 && didWin ? Number((payoutEtb / stakeEtb).toFixed(2)) : 0,
        result: isPending ? 'PENDING' : isDraw ? 'DRAW' : didWin ? 'WIN' : 'LOSS',
        status: dm.status,
        createdAt: (dm.finishedAt || dm.createdAt).toISOString(),
        details: {
          moveCount: dm.moveCount,
          resultReason: dm.result,
        },
      });
    }

    let filtered = items;
    if (filters.gameId && filters.gameId !== 'ALL') {
      if (filters.gameId === 'letti') {
        filtered = filtered.filter((i) => i.gameId === 'letti' || i.gameId === 'letti-pvp');
      } else {
        filtered = filtered.filter((i) => i.gameId === filters.gameId);
      }
    }
    if (filters.result && filters.result !== 'ALL') {
      filtered = filtered.filter((i) => i.result === filters.result);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 250);
    return filtered.slice(0, limit);
  }

  /**
   * Safe public leaderboard (never exposes emails, phones, or private credentials)
   */
  static async getLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' | 'all' = 'weekly',
    metric: 'points' | 'wins' | 'wagered' = 'points',
    viewerUserId?: string
  ) {
    const since = this.getSinceDate(period);
    const createdAtWhere = since ? { gte: since } : undefined;

    const [bets, lettiMatches, damaMatches] = await Promise.all([
      prisma.bet.findMany({
        where: {
          userId: { not: 'demo-guest' },
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
        select: { userId: true, amount: true, payout: true, won: true },
        take: 5000,
      }),
      prisma.lettiMatch.findMany({
        where: {
          status: 'COMPLETED',
          ...(createdAtWhere ? { completedAt: createdAtWhere } : {}),
        },
        select: {
          playerOneId: true,
          playerTwoId: true,
          winnerId: true,
          room: { select: { stakeSantim: true } },
        },
        take: 1000,
      }),
      prisma.match.findMany({
        where: {
          status: 'FINISHED',
          ...(createdAtWhere ? { finishedAt: createdAtWhere } : {}),
        },
        select: { whiteUserId: true, blackUserId: true, winnerId: true, stakeMinor: true },
        take: 1000,
      }),
    ]);

    const agg = new Map<
      string,
      { gamesPlayed: number; wins: number; wageredSantim: number }
    >();
    const bump = (uid: string | null | undefined, stakeSantim: number, won: boolean) => {
      if (!uid || uid === 'demo-guest') return;
      const cur = agg.get(uid) || { gamesPlayed: 0, wins: 0, wageredSantim: 0 };
      cur.gamesPlayed += 1;
      if (won) cur.wins += 1;
      cur.wageredSantim += Math.max(0, stakeSantim);
      agg.set(uid, cur);
    };

    for (const b of bets) {
      bump(b.userId, b.amount, b.won);
    }
    for (const lm of lettiMatches) {
      bump(lm.playerOneId, lm.room.stakeSantim, lm.winnerId === lm.playerOneId);
      bump(lm.playerTwoId, lm.room.stakeSantim, lm.winnerId === lm.playerTwoId);
    }
    for (const dm of damaMatches) {
      const stake = Number(dm.stakeMinor);
      bump(dm.whiteUserId, stake, dm.winnerId === dm.whiteUserId);
      bump(dm.blackUserId, stake, dm.winnerId === dm.blackUserId);
    }

    const userIds = Array.from(agg.keys());
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds }, isActive: true },
            select: { id: true, username: true, avatarUrl: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const ranked = Array.from(agg.entries())
      .filter(([uid]) => userMap.has(uid))
      .map(([uid, stats]) => {
        const u = userMap.get(uid)!;
        const wageredEtb = WalletServiceLogic.santimToEtb(stats.wageredSantim);
        const points = stats.wins * 25 + stats.gamesPlayed * 5 + Math.floor(wageredEtb / 50);
        return {
          userId: uid,
          username: u.username,
          avatarUrl: u.avatarUrl || null,
          gamesPlayed: stats.gamesPlayed,
          wins: stats.wins,
          wageredEtb,
          points,
        };
      });

    ranked.sort((a, b) => {
      if (metric === 'wins') return b.wins - a.wins || b.points - a.points;
      if (metric === 'wagered') return b.wageredEtb - a.wageredEtb || b.points - a.points;
      return b.points - a.points || b.wins - a.wins;
    });

    const withRank = ranked.map((entry, idx) => ({
      rank: idx + 1,
      username: entry.username,
      avatarUrl: entry.avatarUrl,
      gamesPlayed: entry.gamesPlayed,
      wins: entry.wins,
      wageredEtb: entry.wageredEtb,
      points: entry.points,
      isCurrentUser: Boolean(viewerUserId && viewerUserId === entry.userId),
    }));

    const myEntry = viewerUserId
      ? withRank.find((e) => e.isCurrentUser) || null
      : null;

    return {
      period,
      metric,
      entries: withRank.slice(0, 25),
      myEntry,
    };
  }

  /**
   * Aggregates real player notifications from transactions, bonuses, referrals, multiplayer & platform announcements
   */
  static async getNotifications(userId: string) {
    if (!userId || userId === 'demo-guest') {
      return { unreadCount: 0, items: [] };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) return { unreadCount: 0, items: [] };

    const lastReadMs = user.notificationsLastReadAt
      ? user.notificationsLastReadAt.getTime()
      : 0;

    const [
      transactions,
      bonusTxs,
      refRewards,
      activeRooms,
      pendingInvites,
      pendingFriends,
      settings,
      campaign,
    ] =
      await Promise.all([
        user.wallet
          ? prisma.transaction.findMany({
              where: {
                walletId: user.wallet.id,
                type: { in: ['DEPOSIT', 'WITHDRAWAL'] },
              },
              orderBy: { createdAt: 'desc' },
              take: 15,
            })
          : Promise.resolve([]),
        prisma.bonusTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 15,
        }),
        prisma.referralReward.findMany({
          where: { referrerId: userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.lettiRoom.findMany({
          where: {
            players: { some: { userId } },
            status: { in: ['WAITING', 'READY', 'PLAYING', 'COMPLETED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.gameInvite.findMany({
          where: { recipientId: userId, status: 'PENDING', expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.friendship.findMany({
          where: { addresseeId: userId, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        PlatformSettingsService.getSettings(),
        BonusService.getOrCreateDefaultCampaign(),
      ]);

    const items: Array<{
      id: string;
      category: 'DEPOSIT' | 'WITHDRAWAL' | 'BONUS' | 'REFERRAL' | 'GAME' | 'MULTIPLAYER' | 'SYSTEM';
      title: string;
      message: string;
      status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
      createdAt: string;
      unread: boolean;
      actionPath: string;
    }> = [];

    for (const tx of transactions) {
      const etb = WalletServiceLogic.santimToEtb(tx.amount);
      const createdAt = tx.createdAt.toISOString();
      const unread = tx.createdAt.getTime() > lastReadMs;
      if (tx.type === 'DEPOSIT') {
        items.push({
          id: `tx-${tx.id}`,
          category: 'DEPOSIT',
          title:
            tx.status === 'COMPLETED'
              ? 'Deposit Confirmed'
              : tx.status === 'REJECTED'
              ? 'Deposit Rejected'
              : 'Deposit Pending Review',
          message: `${etb.toLocaleString()} ETB via ${tx.paymentMethod || 'Mobile Money'} (${tx.status}).`,
          status:
            tx.status === 'COMPLETED'
              ? 'SUCCESS'
              : tx.status === 'REJECTED'
              ? 'ERROR'
              : 'WARNING',
          createdAt,
          unread,
          actionPath: '/wallet?tab=transactions',
        });
      } else {
        items.push({
          id: `tx-${tx.id}`,
          category: 'WITHDRAWAL',
          title:
            tx.status === 'COMPLETED'
              ? 'Withdrawal Processed'
              : tx.status === 'REJECTED'
              ? 'Withdrawal Declined'
              : 'Withdrawal Requested',
          message: `${etb.toLocaleString()} ETB withdrawal status: ${tx.status}.`,
          status:
            tx.status === 'COMPLETED'
              ? 'SUCCESS'
              : tx.status === 'REJECTED'
              ? 'ERROR'
              : 'INFO',
          createdAt,
          unread,
          actionPath: '/wallet?tab=transactions',
        });
      }
    }

    for (const bt of bonusTxs) {
      const etb = WalletServiceLogic.santimToEtb(bt.amountSantim);
      items.push({
        id: `bonus-${bt.id}`,
        category: bt.type === 'REFERRAL_CREDIT' ? 'REFERRAL' : 'BONUS',
        title:
          bt.type === 'REFERRAL_CREDIT'
            ? 'Referral Reward Credited'
            : bt.type === 'WAGER_RELEASE'
            ? 'Bonus Winnings Unlocked'
            : 'Promotional Bonus Update',
        message: `${bt.description || bt.type} (${etb.toLocaleString()} ETB)`,
        status: bt.type === 'BONUS_EXPIRED' ? 'WARNING' : 'SUCCESS',
        createdAt: bt.createdAt.toISOString(),
        unread: bt.createdAt.getTime() > lastReadMs,
        actionPath: bt.type === 'REFERRAL_CREDIT' ? '/referrals' : '/bonuses',
      });
    }

    for (const rr of refRewards) {
      const etb = WalletServiceLogic.santimToEtb(rr.amountSantim);
      items.push({
        id: `ref-${rr.id}`,
        category: 'REFERRAL',
        title: rr.status === 'PAID' ? 'Referral Bonus Paid' : `Referral ${rr.status}`,
        message: `Invite reward of ${etb.toLocaleString()} ETB is currently ${rr.status}.`,
        status: rr.status === 'PAID' ? 'SUCCESS' : 'INFO',
        createdAt: rr.createdAt.toISOString(),
        unread: rr.createdAt.getTime() > lastReadMs,
        actionPath: '/referrals',
      });
    }

    for (const rm of activeRooms) {
      const stakeEtb = WalletServiceLogic.santimToEtb(rm.stakeSantim);
      const roomTs = rm.completedAt || rm.startedAt || rm.createdAt;
      items.push({
        id: `letti-${rm.id}`,
        category: 'MULTIPLAYER',
        title: `Letti 1v1 Room ${rm.roomCode}`,
        message: `${stakeEtb.toLocaleString()} ETB room is ${rm.status}.`,
        status: rm.status === 'PLAYING' ? 'WARNING' : 'INFO',
        createdAt: roomTs.toISOString(),
        unread: roomTs.getTime() > lastReadMs && ['READY', 'PLAYING'].includes(rm.status),
        actionPath: '/games/letti',
      });
    }

    for (const inv of pendingInvites) {
      const gameLabel =
        inv.gameType === 'LETTI_PVP'
          ? 'Letti Card'
          : inv.gameType === 'CHESS_PVP'
          ? 'NOVA Chess'
          : inv.gameType === 'LUDO_PVP'
          ? 'NOVA Ludo'
          : 'Ethiopian Dama';
      items.push({
        id: `invite-${inv.id}`,
        category: 'MULTIPLAYER',
        title: `1v1 Game Invite (${gameLabel})`,
        message:
          inv.gameType === 'CHESS_PVP'
            ? `Invited to Chess room ${inv.roomCode} (Free Ranked 1v1).`
            : `Invited to room ${inv.roomCode} (${inv.stakeEtb.toLocaleString()} ETB stake).`,
        status: 'INFO',
        createdAt: inv.createdAt.toISOString(),
        unread: inv.createdAt.getTime() > lastReadMs,
        actionPath: '/friends',
      });
    }

    for (const fr of pendingFriends) {
      items.push({
        id: `friend-${fr.id}`,
        category: 'SYSTEM',
        title: 'New Friend Request',
        message: 'A player wants to add you as a friend on NOVA GAMING.',
        status: 'INFO',
        createdAt: fr.createdAt.toISOString(),
        unread: fr.createdAt.getTime() > lastReadMs,
        actionPath: '/friends',
      });
    }

    if (settings.maintenanceMode) {
      items.push({
        id: 'sys-maintenance',
        category: 'SYSTEM',
        title: 'Scheduled Maintenance Active',
        message: 'Gameplay is temporarily paused while platform maintenance completes.',
        status: 'WARNING',
        createdAt: new Date().toISOString(),
        unread: true,
        actionPath: '/support',
      });
    } else if (campaign.isActive) {
      items.push({
        id: 'sys-welcome-promo',
        category: 'SYSTEM',
        title: `${campaign.bonusPercent}% Welcome Bonus & Referrals Active`,
        message: `Earn ${WalletServiceLogic.santimToEtb(
          campaign.referralRewardSantim
        )} ETB per eligible friend referral.`,
        status: 'INFO',
        createdAt: campaign.updatedAt.toISOString(),
        unread: false,
        actionPath: '/bonuses',
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = items.filter((i) => i.unread).length;
    return { unreadCount, items: items.slice(0, 40) };
  }

  static async markNotificationsRead(userId: string) {
    if (!userId || userId === 'demo-guest') return { ok: true };
    await prisma.user.update({
      where: { id: userId },
      data: { notificationsLastReadAt: new Date() },
    });
    return { ok: true };
  }

  /**
   * Aggregated Home Player Dashboard payload
   */
  static async getOverview(userId: string) {
    const isGuest = !userId || userId === 'demo-guest';

    const [
      recentActivity,
      leaderboard,
      lettiWaiting,
      damaWaitingCount,
      chessWaitingCount,
      ludoWaitingCount,
      notifications,
      userRecord,
    ] = await Promise.all([
      isGuest ? Promise.resolve([]) : this.getUnifiedHistory(userId, { limit: 8 }),
      this.getLeaderboard('weekly', 'points', isGuest ? undefined : userId),
      LettiMatchService.listWaitingRooms(10),
      prisma.match.count({ where: { status: 'LOBBY', isPrivate: false } }),
      prisma.chessRoom.count({ where: { status: 'WAITING' } }),
      prisma.ludoRoom.count({ where: { status: 'WAITING' } }),
      isGuest ? Promise.resolve({ unreadCount: 0, items: [] }) : this.getNotifications(userId),
      isGuest
        ? Promise.resolve(null)
        : prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              avatarFrame: true,
              equippedBadge: true,
              xp: true,
              isVerified: true,
              soundEnabled: true,
              createdAt: true,
            },
          }),
    ]);

    let playerStats = {
      gamesPlayed: 0,
      wins: 0,
      winRate: 0,
      level: 1,
      xpPercent: 0,
    };

    if (!isGuest) {
      const [betCount, betWins, lettiCount, lettiWins, damaCount, damaWins] = await Promise.all([
        prisma.bet.count({ where: { userId } }),
        prisma.bet.count({ where: { userId, won: true } }),
        prisma.lettiMatch.count({
          where: { status: 'COMPLETED', OR: [{ playerOneId: userId }, { playerTwoId: userId }] },
        }),
        prisma.lettiMatch.count({ where: { status: 'COMPLETED', winnerId: userId } }),
        prisma.match.count({
          where: { status: 'FINISHED', OR: [{ whiteUserId: userId }, { blackUserId: userId }] },
        }),
        prisma.match.count({ where: { status: 'FINISHED', winnerId: userId } }),
      ]);

      const gamesPlayed = betCount + lettiCount + damaCount;
      const wins = betWins + lettiWins + damaWins;
      const xpTotal = (userRecord?.xp || 0) + gamesPlayed * 10 + wins * 25;
      const level = Math.max(1, Math.floor(xpTotal / 200) + 1);
      const xpPercent = Math.round(((xpTotal % 200) / 200) * 100);

      playerStats = {
        gamesPlayed,
        wins,
        winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
        level,
        xpPercent,
      };
    }

    return {
      isGuest,
      user: userRecord,
      playerStats,
      recentActivity,
      leaderboardPreview: leaderboard.entries.slice(0, 5),
      myLeaderboardEntry: leaderboard.myEntry,
      multiplayer: {
        lettiWaitingCount: lettiWaiting.length,
        lettiWaitingRooms: lettiWaiting.slice(0, 4),
        damaWaitingCount,
        chessWaitingCount,
        ludoWaitingCount,
      },
      unreadNotificationsCount: notifications.unreadCount,
    };
  }
}
