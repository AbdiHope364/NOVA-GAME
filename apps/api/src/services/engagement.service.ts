import { WalletServiceLogic } from '@nova/wallet';
import { prisma } from '../config/database.js';
import { emitWalletUpdate } from '../websocket/socket.js';

export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  category: 'DAILY' | 'GAME' | 'STREAK' | 'SOCIAL';
  xpReward: number;
  badgeLabel: string;
}

export interface MissionDef {
  code: string;
  title: string;
  description: string;
  period: 'DAILY' | 'WEEKLY';
  target: number;
  xpReward: number;
  bonusEtb: number;
}

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  {
    code: 'FIRST_VICTORY',
    title: 'First Victory',
    description: 'Win your first solo or multiplayer match on NOVA GAMING.',
    category: 'STREAK',
    xpReward: 50,
    badgeLabel: 'Victor',
  },
  {
    code: 'WIN_STREAK_3',
    title: 'Hot Hand (3-Streak)',
    description: 'Win 3 solo or PvP games in a row.',
    category: 'STREAK',
    xpReward: 120,
    badgeLabel: '3-Streak',
  },
  {
    code: 'WIN_STREAK_5',
    title: 'Unstoppable (5-Streak)',
    description: 'Achieve 5 consecutive wins.',
    category: 'STREAK',
    xpReward: 250,
    badgeLabel: '5-Streak',
  },
  {
    code: 'DAILY_CHECKIN_1',
    title: 'Daily Regular',
    description: 'Claim your first Daily Login Check-in reward.',
    category: 'DAILY',
    xpReward: 40,
    badgeLabel: 'Daily Star',
  },
  {
    code: 'DAILY_STREAK_7',
    title: '7-Day Dedicated',
    description: 'Complete a full 7-day consecutive login streak.',
    category: 'DAILY',
    xpReward: 300,
    badgeLabel: '7-Day Pro',
  },
  {
    code: 'MISSION_FINISHER',
    title: 'Mission Specialist',
    description: 'Claim 3 Daily or Weekly mission rewards.',
    category: 'DAILY',
    xpReward: 150,
    badgeLabel: 'Mission Ace',
  },
  {
    code: 'LETTI_DUELIST',
    title: 'Letti Card Shark',
    description: 'Win a Letti Card 1v1 Face-to-Face multiplayer match.',
    category: 'GAME',
    xpReward: 140,
    badgeLabel: 'Letti Shark',
  },
  {
    code: 'DAMA_TACTICIAN',
    title: 'Ethiopian Dama Master',
    description: 'Win an Ethiopian Dama 1v1 multiplayer match.',
    category: 'GAME',
    xpReward: 160,
    badgeLabel: 'Dama King',
  },
  {
    code: 'CRASH_FLIGHT',
    title: 'Sky Pilot',
    description: 'Win a Crash round at 2.00x multiplier or higher.',
    category: 'GAME',
    xpReward: 100,
    badgeLabel: 'Astronaut',
  },
  {
    code: 'MINES_HUNTER',
    title: 'Gem Hunter',
    description: 'Cash out a winning Mines game.',
    category: 'GAME',
    xpReward: 90,
    badgeLabel: 'Gem Hunter',
  },
  {
    code: 'SOCIAL_BUTTERFLY',
    title: 'Social Player',
    description: 'Connect with your first friend on NOVA GAMING.',
    category: 'SOCIAL',
    xpReward: 60,
    badgeLabel: 'Squad Member',
  },
  {
    code: 'VETERAN_10',
    title: 'Arena Veteran',
    description: 'Complete 10 total rounds across any games.',
    category: 'GAME',
    xpReward: 120,
    badgeLabel: 'Veteran',
  },
];

export const MISSIONS_CATALOG: MissionDef[] = [
  {
    code: 'DAILY_PLAY_3',
    title: 'Warm-Up Trio',
    description: 'Play 3 game rounds today.',
    period: 'DAILY',
    target: 3,
    xpReward: 40,
    bonusEtb: 5,
  },
  {
    code: 'DAILY_WIN_1',
    title: 'Daily Winner',
    description: 'Win 1 solo or multiplayer game today.',
    period: 'DAILY',
    target: 1,
    xpReward: 50,
    bonusEtb: 5,
  },
  {
    code: 'DAILY_PVP_1',
    title: 'Face-to-Face Duel',
    description: 'Complete 1 Letti 1v1 or Ethiopian Dama PvP match today.',
    period: 'DAILY',
    target: 1,
    xpReward: 80,
    bonusEtb: 10,
  },
  {
    code: 'WEEKLY_GAMES_15',
    title: 'Weekly Grinder',
    description: 'Play 15 rounds across any games this week.',
    period: 'WEEKLY',
    target: 15,
    xpReward: 180,
    bonusEtb: 20,
  },
  {
    code: 'WEEKLY_WINS_5',
    title: 'Weekly Champion',
    description: 'Win 5 matches this week.',
    period: 'WEEKLY',
    target: 5,
    xpReward: 240,
    bonusEtb: 25,
  },
];

export const AVATAR_FRAMES = ['violet', 'cyan', 'emerald', 'amber', 'crimson'] as const;

export class EngagementService {
  static getUtcDateKey(date = new Date()): string {
    return date.toISOString().slice(0, 10);
  }

  static getYesterdayDateKey(date = new Date()): string {
    const y = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    return y.toISOString().slice(0, 10);
  }

  static getIsoWeekKey(date = new Date()): string {
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  static getWeekStartDate(date = new Date()): Date {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - (day - 1));
    return d;
  }

  static async getAdminConfig(tx?: any) {
    const client = tx || prisma;
    let cfg = await client.dailyRewardCampaignConfig.findUnique({ where: { id: 'default' } });
    if (!cfg) {
      cfg = await client.dailyRewardCampaignConfig.create({
        data: {
          id: 'default',
          enabled: true,
          dailyStreakEnabled: true,
          missionsEnabled: true,
          dayRewardsJson: '[5,10,15,20,25,35,50]',
          wageringMultiplier: 5.0,
          requireVerifiedAccount: true,
        },
      });
    }
    let dayRewards: number[] = [5, 10, 15, 20, 25, 35, 50];
    try {
      const parsed = JSON.parse(cfg.dayRewardsJson);
      if (Array.isArray(parsed) && parsed.length === 7) {
        dayRewards = parsed.map((n) => Math.max(0, Number(n) || 0));
      }
    } catch {}

    return {
      ...cfg,
      dayRewards,
    };
  }

  private static computeWinStreak(results: boolean[]): number {
    let best = 0;
    let current = 0;
    for (const won of results) {
      if (won) {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    return best;
  }

  /**
   * Evaluates & idempotently unlocks newly earned achievements + awards achievement XP
   */
  static async evaluateAndSyncAchievements(userId: string) {
    if (!userId || userId === 'demo-guest') return [];

    const [
      existingUnlocked,
      bets,
      lettiWins,
      damaWins,
      checkIns,
      missionClaims,
      friendCount,
    ] = await Promise.all([
      prisma.userAchievement.findMany({ where: { userId } }),
      prisma.bet.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { gameId: true, won: true, multiplier: true },
        take: 500,
      }),
      prisma.lettiMatch.count({ where: { status: 'COMPLETED', winnerId: userId } }),
      prisma.match.count({ where: { status: 'FINISHED', winnerId: userId } }),
      prisma.dailyCheckIn.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 14 }),
      prisma.missionProgressClaim.count({ where: { userId } }),
      prisma.friendship.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      }),
    ]);

    const unlockedSet = new Set(existingUnlocked.map((a) => a.code));
    const totalGames = bets.length + lettiWins + damaWins;
    const totalWins = bets.filter((b) => b.won).length + lettiWins + damaWins;
    const bestStreak = this.computeWinStreak(bets.map((b) => b.won));

    const earnedCodes: string[] = [];
    if (totalWins >= 1) earnedCodes.push('FIRST_VICTORY');
    if (bestStreak >= 3) earnedCodes.push('WIN_STREAK_3');
    if (bestStreak >= 5) earnedCodes.push('WIN_STREAK_5');
    if (checkIns.length >= 1) earnedCodes.push('DAILY_CHECKIN_1');
    if (checkIns.some((c) => c.streakDay >= 7)) earnedCodes.push('DAILY_STREAK_7');
    if (missionClaims >= 3) earnedCodes.push('MISSION_FINISHER');
    if (lettiWins >= 1) earnedCodes.push('LETTI_DUELIST');
    if (damaWins >= 1) earnedCodes.push('DAMA_TACTICIAN');
    if (bets.some((b) => b.gameId === 'crash' && b.won && b.multiplier >= 2)) {
      earnedCodes.push('CRASH_FLIGHT');
    }
    if (bets.some((b) => b.gameId === 'mines' && b.won)) earnedCodes.push('MINES_HUNTER');
    if (friendCount >= 1) earnedCodes.push('SOCIAL_BUTTERFLY');
    if (totalGames >= 10) earnedCodes.push('VETERAN_10');

    let addedXp = 0;
    for (const code of earnedCodes) {
      if (unlockedSet.has(code)) continue;
      const def = ACHIEVEMENTS_CATALOG.find((a) => a.code === code);
      if (!def) continue;
      try {
        await prisma.userAchievement.create({
          data: {
            userId,
            code,
            xpAwarded: def.xpReward,
          },
        });
        addedXp += def.xpReward;
      } catch {
        // Concurrent unlock ignored via unique constraint
      }
    }

    if (addedXp > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: addedXp } },
      });
    }

    return prisma.userAchievement.findMany({ where: { userId } });
  }

  /**
   * Computes current daily/weekly mission progress from authoritative game records
   */
  private static async computeMissionProgress(userId: string) {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekStart = this.getWeekStartDate(now);
    const todayKey = this.getUtcDateKey(now);
    const weekKey = this.getIsoWeekKey(now);

    const [dailyBets, weeklyBets, dailyLettis, dailyDamas, weeklyLettis, weeklyDamas, claims] =
      await Promise.all([
        prisma.bet.findMany({
          where: { userId, createdAt: { gte: todayStart } },
          select: { won: true },
        }),
        prisma.bet.findMany({
          where: { userId, createdAt: { gte: weekStart } },
          select: { won: true },
        }),
        prisma.lettiMatch.findMany({
          where: {
            status: 'COMPLETED',
            completedAt: { gte: todayStart },
            OR: [{ playerOneId: userId }, { playerTwoId: userId }],
          },
          select: { winnerId: true },
        }),
        prisma.match.findMany({
          where: {
            status: 'FINISHED',
            finishedAt: { gte: todayStart },
            OR: [{ whiteUserId: userId }, { blackUserId: userId }],
          },
          select: { winnerId: true },
        }),
        prisma.lettiMatch.findMany({
          where: {
            status: 'COMPLETED',
            completedAt: { gte: weekStart },
            OR: [{ playerOneId: userId }, { playerTwoId: userId }],
          },
          select: { winnerId: true },
        }),
        prisma.match.findMany({
          where: {
            status: 'FINISHED',
            finishedAt: { gte: weekStart },
            OR: [{ whiteUserId: userId }, { blackUserId: userId }],
          },
          select: { winnerId: true },
        }),
        prisma.missionProgressClaim.findMany({
          where: {
            userId,
            periodKey: { in: [todayKey, weekKey] },
          },
        }),
      ]);

    const dailyPvpCount = dailyLettis.length + dailyDamas.length;
    const dailyPlays = dailyBets.length + dailyPvpCount;
    const dailyWins =
      dailyBets.filter((b) => b.won).length +
      dailyLettis.filter((m) => m.winnerId === userId).length +
      dailyDamas.filter((m) => m.winnerId === userId).length;

    const weeklyPlays = weeklyBets.length + weeklyLettis.length + weeklyDamas.length;
    const weeklyWins =
      weeklyBets.filter((b) => b.won).length +
      weeklyLettis.filter((m) => m.winnerId === userId).length +
      weeklyDamas.filter((m) => m.winnerId === userId).length;

    const claimSet = new Set(claims.map((c) => `${c.missionCode}:${c.periodKey}`));

    return MISSIONS_CATALOG.map((m) => {
      const periodKey = m.period === 'DAILY' ? todayKey : weekKey;
      let progress = 0;
      if (m.code === 'DAILY_PLAY_3') progress = dailyPlays;
      else if (m.code === 'DAILY_WIN_1') progress = dailyWins;
      else if (m.code === 'DAILY_PVP_1') progress = dailyPvpCount;
      else if (m.code === 'WEEKLY_GAMES_15') progress = weeklyPlays;
      else if (m.code === 'WEEKLY_WINS_5') progress = weeklyWins;

      const clamped = Math.min(progress, m.target);
      const claimed = claimSet.has(`${m.code}:${periodKey}`);
      return {
        ...m,
        periodKey,
        progress: clamped,
        completed: progress >= m.target,
        claimed,
        canClaim: progress >= m.target && !claimed,
      };
    });
  }

  /**
   * Credits promotional bonus ETB without bypassing existing Bonus/Withdrawal restrictions
   */
  private static async creditPromoRewardInTx(
    tx: any,
    params: {
      userId: string;
      amountEtb: number;
      type: string;
      description: string;
      idempotencyKey: string;
      wageringMultiplier: number;
    }
  ) {
    const amountSantim = WalletServiceLogic.etbToSantim(params.amountEtb);
    if (amountSantim <= 0) return;

    const wallet = await tx.wallet.findUnique({ where: { userId: params.userId } });
    if (!wallet) throw { statusCode: 404, message: 'Wallet not found' };

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        bonusBalance: { increment: amountSantim },
        version: { increment: 1 },
      },
    });

    // Attach proportional wagering target onto existing active UserBonus if present
    const activeBonus = await tx.userBonus.findFirst({
      where: { userId: params.userId, status: 'ACTIVE' },
      orderBy: { claimedAt: 'desc' },
    });

    if (activeBonus) {
      const extraTarget = Math.round(amountSantim * Math.max(params.wageringMultiplier, 1));
      await tx.userBonus.update({
        where: { id: activeBonus.id },
        data: {
          remainingBonusSantim: { increment: amountSantim },
          wagerTargetSantim: { increment: extraTarget },
        },
      });
    }

    await tx.bonusTransaction.create({
      data: {
        userBonusId: activeBonus?.id || null,
        userId: params.userId,
        walletId: wallet.id,
        type: params.type,
        amountSantim,
        bonusBalanceAfterSantim: updatedWallet.bonusBalance,
        lockedWinningsAfterSantim: updatedWallet.lockedWinnings,
        cashBalanceAfterSantim: updatedWallet.balance,
        idempotencyKey: params.idempotencyKey,
        description: params.description,
      },
    });

    emitWalletUpdate(params.userId, {
      balance: WalletServiceLogic.santimToEtb(updatedWallet.balance + updatedWallet.bonusBalance),
      type: 'BONUS',
      status: 'COMPLETED',
      amount: params.amountEtb,
      message: `${params.description} (+${params.amountEtb} ETB promo credit)`,
    });
  }

  /**
   * Player Engagement Hub Summary (Level/XP, Daily Login Streak, Missions, Achievements, Customization)
   */
  static async getPlayerEngagementSummary(userId: string) {
    const cfg = await this.getAdminConfig();
    if (!userId || userId === 'demo-guest') {
      return {
        config: cfg,
        profile: { level: 1, xp: 0, xpPercent: 0, avatarFrame: 'violet', equippedBadge: null },
        dailyCheckIn: {
          claimedToday: false,
          nextStreakDay: 1,
          dayRewards: cfg.dayRewards,
        },
        missions: MISSIONS_CATALOG.map((m) => ({
          ...m,
          progress: 0,
          completed: false,
          claimed: false,
          canClaim: false,
        })),
        achievements: ACHIEVEMENTS_CATALOG.map((a) => ({
          ...a,
          unlocked: false,
          unlockedAt: null,
        })),
      };
    }

    const unlockedRows = await this.evaluateAndSyncAchievements(userId);
    const unlockedMap = new Map(unlockedRows.map((r) => [r.code, r]));

    const [user, checkIns, missions, betCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, xp: true, avatarFrame: true, equippedBadge: true },
      }),
      prisma.dailyCheckIn.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.computeMissionProgress(userId),
      prisma.bet.count({ where: { userId } }),
    ]);

    const totalXp = (user?.xp || 0) + betCount * 10;
    const level = Math.max(1, Math.floor(totalXp / 200) + 1);
    const xpPercent = Math.round(((totalXp % 200) / 200) * 100);

    const todayKey = this.getUtcDateKey();
    const yesterdayKey = this.getYesterdayDateKey();
    const latestCheckIn = checkIns[0] || null;
    const claimedToday = latestCheckIn?.checkInDate === todayKey;

    let nextStreakDay = 1;
    if (claimedToday) {
      nextStreakDay = latestCheckIn.streakDay;
    } else if (latestCheckIn?.checkInDate === yesterdayKey) {
      nextStreakDay = latestCheckIn.streakDay >= 7 ? 1 : latestCheckIn.streakDay + 1;
    }

    return {
      config: {
        enabled: cfg.enabled,
        dailyStreakEnabled: cfg.dailyStreakEnabled,
        missionsEnabled: cfg.missionsEnabled,
        dayRewards: cfg.dayRewards,
        wageringMultiplier: cfg.wageringMultiplier,
      },
      profile: {
        level,
        xp: totalXp,
        xpPercent,
        avatarFrame: user?.avatarFrame || 'violet',
        equippedBadge: user?.equippedBadge || null,
      },
      dailyCheckIn: {
        claimedToday,
        nextStreakDay,
        currentStreakDay: claimedToday
          ? latestCheckIn.streakDay
          : latestCheckIn?.checkInDate === yesterdayKey
          ? latestCheckIn.streakDay
          : 0,
        dayRewards: cfg.dayRewards,
      },
      missions,
      achievements: ACHIEVEMENTS_CATALOG.map((def) => {
        const hit = unlockedMap.get(def.code);
        return {
          ...def,
          unlocked: Boolean(hit),
          unlockedAt: hit?.unlockedAt.toISOString() || null,
        };
      }),
    };
  }

  static async claimDailyCheckIn(userId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const cfg = await this.getAdminConfig(tx);
      if (!cfg.enabled || !cfg.dailyStreakEnabled) {
        throw { statusCode: 403, message: 'Daily login rewards are currently paused by admin.' };
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw { statusCode: 404, message: 'User not found' };
      if (cfg.requireVerifiedAccount && !user.isVerified) {
        throw { statusCode: 403, message: 'Account verification required to claim daily rewards.' };
      }

      const todayKey = this.getUtcDateKey();
      const existingToday = await tx.dailyCheckIn.findUnique({
        where: { userId_checkInDate: { userId, checkInDate: todayKey } },
      });
      if (existingToday) {
        throw { statusCode: 409, message: 'Today’s daily check-in reward has already been claimed.' };
      }

      const yesterdayKey = this.getYesterdayDateKey();
      const yesterdayCheckIn = await tx.dailyCheckIn.findUnique({
        where: { userId_checkInDate: { userId, checkInDate: yesterdayKey } },
      });

      const streakDay = yesterdayCheckIn
        ? yesterdayCheckIn.streakDay >= 7
          ? 1
          : yesterdayCheckIn.streakDay + 1
        : 1;

      const rewardEtb = cfg.dayRewards[streakDay - 1] ?? 5;
      const xpAwarded = 25 + streakDay * 10;
      const idempotencyKey = `checkin:${userId}:${todayKey}`;

      await tx.dailyCheckIn.create({
        data: {
          userId,
          checkInDate: todayKey,
          streakDay,
          xpAwarded,
          bonusAwardedSantim: WalletServiceLogic.etbToSantim(rewardEtb),
          idempotencyKey,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: xpAwarded } },
      });

      if (rewardEtb > 0) {
        await this.creditPromoRewardInTx(tx, {
          userId,
          amountEtb: rewardEtb,
          type: 'DAILY_STREAK_CREDIT',
          description: `Day ${streakDay} Daily Login Streak Bonus (Promotional Credit)`,
          idempotencyKey: `btx-${idempotencyKey}`,
          wageringMultiplier: cfg.wageringMultiplier,
        });
      }

      return { streakDay, rewardEtb, xpAwarded };
    });

    await this.evaluateAndSyncAchievements(userId);
    return result;
  }

  static async claimMission(userId: string, missionCode: string) {
    const def = MISSIONS_CATALOG.find((m) => m.code === missionCode);
    if (!def) throw { statusCode: 404, message: 'Mission not found.' };

    const cfg = await this.getAdminConfig();
    if (!cfg.enabled || !cfg.missionsEnabled) {
      throw { statusCode: 403, message: 'Missions are currently disabled by admin.' };
    }

    const progressList = await this.computeMissionProgress(userId);
    const targetMission = progressList.find((m) => m.code === missionCode);
    if (!targetMission || !targetMission.completed) {
      throw { statusCode: 409, message: 'Mission objectives are not yet complete.' };
    }
    if (targetMission.claimed) {
      throw { statusCode: 409, message: 'Mission reward already claimed for this period.' };
    }

    const periodKey = targetMission.periodKey;

    await prisma.$transaction(async (tx) => {
      const idempotencyKey = `mission:${userId}:${missionCode}:${periodKey}`;
      await tx.missionProgressClaim.create({
        data: {
          userId,
          missionCode,
          periodKey,
          xpAwarded: def.xpReward,
          bonusAwardedSantim: WalletServiceLogic.etbToSantim(def.bonusEtb),
          idempotencyKey,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: def.xpReward } },
      });

      if (def.bonusEtb > 0) {
        await this.creditPromoRewardInTx(tx, {
          userId,
          amountEtb: def.bonusEtb,
          type: 'MISSION_REWARD_CREDIT',
          description: `Mission Reward: ${def.title} (Promotional Credit)`,
          idempotencyKey: `btx-${idempotencyKey}`,
          wageringMultiplier: cfg.wageringMultiplier,
        });
      }
    });

    await this.evaluateAndSyncAchievements(userId);
    return {
      missionCode,
      xpAwarded: def.xpReward,
      bonusEtb: def.bonusEtb,
    };
  }

  static async updateCustomization(
    userId: string,
    input: { avatarFrame?: string; equippedBadge?: string | null }
  ) {
    const updates: { avatarFrame?: string; equippedBadge?: string | null } = {};
    if (input.avatarFrame !== undefined) {
      if (!AVATAR_FRAMES.includes(input.avatarFrame as any)) {
        throw { statusCode: 400, message: 'Invalid avatar frame choice.' };
      }
      updates.avatarFrame = input.avatarFrame;
    }

    if (input.equippedBadge !== undefined) {
      if (input.equippedBadge === null || input.equippedBadge === '') {
        updates.equippedBadge = null;
      } else {
        const unlocked = await prisma.userAchievement.findUnique({
          where: { userId_code: { userId, code: input.equippedBadge } },
        });
        if (!unlocked) {
          throw { statusCode: 403, message: 'Unlock that achievement before equipping its badge.' };
        }
        updates.equippedBadge = input.equippedBadge;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { avatarFrame: true, equippedBadge: true },
    });
    return updated;
  }

  // Admin management
  static async getAdminOverview() {
    const [config, reports, totalCheckIns, totalMissionClaims] = await Promise.all([
      this.getAdminConfig(),
      prisma.userReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      prisma.dailyCheckIn.count(),
      prisma.missionProgressClaim.count(),
    ]);

    const userIds = Array.from(
      new Set(reports.flatMap((r) => [r.reporterId, r.reportedUserId]))
    );
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true },
          })
        : [];
    const uMap = new Map(users.map((u) => [u.id, u.username]));

    return {
      config,
      stats: { totalCheckIns, totalMissionClaims },
      reports: reports.map((r) => ({
        ...r,
        reporterUsername: uMap.get(r.reporterId) || 'Player',
        reportedUsername: uMap.get(r.reportedUserId) || 'Player',
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  static async updateAdminConfig(adminId: string, body: any) {
    const current = await this.getAdminConfig();
    let nextRewardsJson = current.dayRewardsJson;
    if (Array.isArray(body.dayRewards) && body.dayRewards.length === 7) {
      nextRewardsJson = JSON.stringify(body.dayRewards.map((n: any) => Math.max(0, Number(n) || 0)));
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cfg = await tx.dailyRewardCampaignConfig.upsert({
        where: { id: 'default' },
        update: {
          enabled: body.enabled !== undefined ? Boolean(body.enabled) : current.enabled,
          dailyStreakEnabled:
            body.dailyStreakEnabled !== undefined
              ? Boolean(body.dailyStreakEnabled)
              : current.dailyStreakEnabled,
          missionsEnabled:
            body.missionsEnabled !== undefined
              ? Boolean(body.missionsEnabled)
              : current.missionsEnabled,
          dayRewardsJson: nextRewardsJson,
          wageringMultiplier:
            body.wageringMultiplier !== undefined
              ? Number(body.wageringMultiplier)
              : current.wageringMultiplier,
          requireVerifiedAccount:
            body.requireVerifiedAccount !== undefined
              ? Boolean(body.requireVerifiedAccount)
              : current.requireVerifiedAccount,
        },
        create: { id: 'default' },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'ENGAGEMENT_CONFIG_UPDATED',
          targetId: 'default',
          details: JSON.stringify(body),
        },
      });

      return cfg;
    });

    return updated;
  }

  static async reviewReport(adminId: string, reportId: string, decision: 'REVIEWED' | 'DISMISSED') {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.userReport.update({
        where: { id: reportId },
        data: {
          status: decision,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: `PLAYER_REPORT_${decision}`,
          targetId: reportId,
        },
      });
      return updated;
    });
  }
}
