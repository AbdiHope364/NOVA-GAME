import crypto from 'crypto';
import {
  CHESS_TIME_CONTROLS,
  ChessEngine,
  ChessMoveRecord,
  ChessTermination,
  ChessTimeCategory,
  ChessTimeControlKey,
  PromotionPiece,
  STARTING_FEN,
  calculateChessElo,
} from '@nova/game-chess';
import { prisma } from '../config/database.js';
import { EngagementService } from './engagement.service.js';

const AI_BOT_ID = 'nova-chess-ai';

function generateRoomCode(): string {
  return `CH-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function getTimeControlSpec(key?: string) {
  if (key && key in CHESS_TIME_CONTROLS) {
    return CHESS_TIME_CONTROLS[key as ChessTimeControlKey];
  }
  return CHESS_TIME_CONTROLS.BLITZ_5_0;
}

export class ChessMatchService {
  static async getConfig(tx: any = prisma) {
    let cfg = await tx.chessConfig.findUnique({ where: { id: 'default' } });
    if (!cfg) {
      cfg = await tx.chessConfig.create({
        data: {
          id: 'default',
          enabled: true,
          rankedEnabled: true,
          casualEnabled: true,
          aiEnabled: true,
          maxAiDifficulty: 'EXPERT',
          enabledTimeControlsJson: JSON.stringify(Object.keys(CHESS_TIME_CONTROLS)),
          disconnectGraceSeconds: 45,
          abortWindowPlies: 2,
        },
      });
    }
    let enabledTimeControls: string[] = Object.keys(CHESS_TIME_CONTROLS);
    try {
      const parsed = JSON.parse(cfg.enabledTimeControlsJson || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) enabledTimeControls = parsed;
    } catch {}
    return {
      ...cfg,
      enabledTimeControls,
    };
  }

  static async getOrCreateCategoryRating(
    userId: string,
    category: ChessTimeCategory,
    tx: any = prisma
  ) {
    let rec = await tx.chessPlayerRating.findUnique({
      where: { userId_category: { userId, category } },
    });
    if (!rec) {
      rec = await tx.chessPlayerRating.create({
        data: {
          userId,
          category,
          rating: 1200,
          peakRating: 1200,
        },
      });
    }
    return rec;
  }

  static async getUserCategoryRatings(userId: string) {
    const categories: ChessTimeCategory[] = ['BULLET', 'BLITZ', 'RAPID', 'CLASSICAL'];
    const rows = await prisma.chessPlayerRating.findMany({
      where: { userId },
    });
    const map = new Map(rows.map((r) => [r.category, r]));
    return categories.map((cat) => {
      const existing = map.get(cat);
      return (
        existing || {
          userId,
          category: cat,
          rating: 1200,
          peakRating: 1200,
          gamesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          winStreak: 0,
          bestWinStreak: 0,
        }
      );
    });
  }

  static async getLobby() {
    const [cfg, waitingRooms, liveMatches] = await Promise.all([
      this.getConfig(),
      prisma.chessRoom.findMany({
        where: { status: 'WAITING' },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.chessMatch.findMany({
        where: { status: 'ACTIVE', mode: 'PVP' },
        include: { room: true },
        orderBy: { startedAt: 'desc' },
        take: 15,
      }),
    ]);

    const userIds = Array.from(
      new Set([
        ...waitingRooms.map((r) => r.hostId),
        ...liveMatches.flatMap((m) => [m.whiteUserId, m.blackUserId]),
      ])
    );
    const [users, ratings] = await Promise.all([
      userIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, chessElo: true },
          })
        : Promise.resolve([]),
      userIds.length > 0
        ? prisma.chessPlayerRating.findMany({
            where: { userId: { in: userIds } },
          })
        : Promise.resolve([]),
    ]);
    const userMap = new Map(users.map((u) => [u.id, u]));
    const ratingMap = new Map(ratings.map((r) => [`${r.userId}:${r.category}`, r.rating]));

    return {
      config: cfg,
      waitingRooms: waitingRooms.map((r) => {
        const host = userMap.get(r.hostId);
        const catRating = ratingMap.get(`${r.hostId}:${r.category}`) ?? host?.chessElo ?? 1200;
        return {
          roomId: r.id,
          roomCode: r.roomCode,
          roomType: r.roomType,
          timeControl: r.timeControl,
          category: r.category,
          baseTimeMs: r.baseTimeMs,
          incrementMs: r.incrementMs,
          isRanked: r.isRanked,
          hostId: r.hostId,
          hostUsername: host?.username || 'Player',
          hostElo: catRating,
          createdAt: r.createdAt.toISOString(),
        };
      }),
      liveMatches: liveMatches.map((m) => ({
        matchId: m.id,
        roomId: m.roomId,
        roomCode: m.room.roomCode,
        timeControl: m.room.timeControl,
        category: m.category,
        isRanked: m.isRanked,
        moveCount: m.moveCount,
        whiteUsername: userMap.get(m.whiteUserId)?.username || 'White',
        whiteElo: m.whiteEloBefore,
        blackUsername: userMap.get(m.blackUserId)?.username || 'Black',
        blackElo: m.blackEloBefore,
        startedAt: m.startedAt.toISOString(),
      })),
    };
  }

  static async getLeaderboard(category: ChessTimeCategory = 'BLITZ') {
    const categoryRows = await prisma.chessPlayerRating.findMany({
      where: { category },
      orderBy: [{ rating: 'desc' }, { wins: 'desc' }],
      take: 25,
    });

    if (categoryRows.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: categoryRows.map((r) => r.userId) }, isActive: true },
        select: { id: true, username: true, avatarFrame: true, equippedBadge: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return categoryRows
        .filter((r) => userMap.has(r.userId))
        .map((r, idx) => {
          const u = userMap.get(r.userId)!;
          return {
            rank: idx + 1,
            id: u.id,
            username: u.username,
            category: r.category,
            chessElo: r.rating,
            peakRating: r.peakRating,
            chessGamesPlayed: r.gamesPlayed,
            chessWins: r.wins,
            chessDraws: r.draws,
            chessLosses: r.losses,
            avatarFrame: u.avatarFrame,
            equippedBadge: u.equippedBadge,
          };
        });
    }

    const players = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ chessElo: 'desc' }, { chessWins: 'desc' }],
      take: 25,
      select: {
        id: true,
        username: true,
        chessElo: true,
        chessGamesPlayed: true,
        chessWins: true,
        chessDraws: true,
        chessLosses: true,
        avatarFrame: true,
        equippedBadge: true,
      },
    });
    return players.map((p, idx) => ({
      rank: idx + 1,
      category,
      peakRating: p.chessElo,
      ...p,
    }));
  }

  static async getUserHistory(userId: string) {
    const matches = await prisma.chessMatch.findMany({
      where: {
        status: { in: ['COMPLETED', 'ABORTED'] },
        OR: [{ whiteUserId: userId }, { blackUserId: userId }],
      },
      include: { room: true },
      orderBy: { completedAt: 'desc' },
      take: 30,
    });

    const userIds = Array.from(
      new Set(
        matches
          .flatMap((m) => [m.whiteUserId, m.blackUserId])
          .filter((id) => id !== AI_BOT_ID)
      )
    );
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true, chessElo: true },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return matches.map((m) => {
      const isWhite = m.whiteUserId === userId;
      const opponentId = isWhite ? m.blackUserId : m.whiteUserId;
      const opponentUsername =
        opponentId === AI_BOT_ID
          ? `Nova AI (${m.aiDifficulty || 'MEDIUM'})`
          : userMap.get(opponentId)?.username || 'Player';
      const outcome =
        m.status === 'ABORTED'
          ? 'ABORTED'
          : m.winnerId === null
          ? 'DRAW'
          : m.winnerId === userId
          ? 'WIN'
          : 'LOSS';
      const eloBefore = isWhite ? m.whiteEloBefore : m.blackEloBefore;
      const eloAfter = isWhite ? m.whiteEloAfter : m.blackEloAfter;

      return {
        matchId: m.id,
        roomId: m.roomId,
        roomCode: m.room.roomCode,
        mode: m.mode,
        timeControl: m.room.timeControl,
        category: m.category,
        isRanked: m.isRanked,
        myColor: isWhite ? 'w' : 'b',
        opponentUsername,
        outcome,
        termination: m.termination,
        moveCount: m.moveCount,
        pgn: m.pgn,
        eloBefore,
        eloAfter,
        eloDelta: eloAfter !== null && eloAfter !== undefined ? eloAfter - eloBefore : 0,
        completedAt: (m.completedAt || m.startedAt).toISOString(),
      };
    });
  }

  static async getActiveRoomForUser(userId: string) {
    const activeMatch = await prisma.chessMatch.findFirst({
      where: {
        status: 'ACTIVE',
        mode: 'PVP',
        OR: [{ whiteUserId: userId }, { blackUserId: userId }],
      },
      orderBy: { startedAt: 'desc' },
    });
    if (activeMatch) {
      return this.getRoomView(activeMatch.roomId, userId);
    }

    const waitingRoom = await prisma.chessRoom.findFirst({
      where: { status: 'WAITING', hostId: userId },
      orderBy: { createdAt: 'desc' },
    });
    if (waitingRoom) {
      return this.getRoomView(waitingRoom.id, userId);
    }
    return null;
  }

  private static async enforceConfig(timeControlKey: ChessTimeControlKey, isRanked: boolean) {
    const cfg = await this.getConfig();
    if (!cfg.enabled) {
      throw { statusCode: 503, message: 'NOVA Chess is temporarily disabled by administration.' };
    }
    if (isRanked && !cfg.rankedEnabled) {
      throw { statusCode: 403, message: 'Ranked Chess matches are currently disabled.' };
    }
    if (!isRanked && !cfg.casualEnabled) {
      throw { statusCode: 403, message: 'Casual Chess matches are currently disabled.' };
    }
    if (!cfg.enabledTimeControls.includes(timeControlKey)) {
      throw { statusCode: 400, message: `Time control ${timeControlKey} is disabled.` };
    }
    return cfg;
  }

  static async createRoom(
    userId: string,
    opts: { timeControl?: string; isRanked?: boolean; roomType?: 'PRIVATE' | 'QUICK_MATCH' }
  ) {
    const tc = getTimeControlSpec(opts.timeControl);
    const isRanked = opts.isRanked !== false;
    const roomType = opts.roomType || 'PRIVATE';

    await this.enforceConfig(tc.key, isRanked);

    await prisma.chessRoom.updateMany({
      where: { hostId: userId, status: 'WAITING' },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });

    let roomCode = generateRoomCode();
    while (await prisma.chessRoom.findUnique({ where: { roomCode } })) {
      roomCode = generateRoomCode();
    }

    const room = await prisma.chessRoom.create({
      data: {
        roomCode,
        roomType,
        status: 'WAITING',
        timeControl: tc.key,
        category: tc.category,
        baseTimeMs: tc.baseTimeMs,
        incrementMs: tc.incrementMs,
        isRanked,
        hostId: userId,
      },
    });

    return this.getRoomView(room.id, userId);
  }

  static async quickMatch(userId: string, opts: { timeControl?: string; isRanked?: boolean }) {
    const tc = getTimeControlSpec(opts.timeControl);
    const isRanked = opts.isRanked !== false;

    await this.enforceConfig(tc.key, isRanked);

    // Prevent matching player twice or matching their own stale queue room
    const candidates = await prisma.chessRoom.findMany({
      where: {
        status: 'WAITING',
        roomType: 'QUICK_MATCH',
        timeControl: tc.key,
        isRanked,
        hostId: { not: userId },
      },
      orderBy: { createdAt: 'asc' },
      take: 3,
    });

    for (const candidate of candidates) {
      try {
        return await this.joinRoom(userId, candidate.id);
      } catch (err: any) {
        // 409 means another concurrent player atomically claimed it first -> try next candidate
        if (err?.statusCode === 409) continue;
        throw err;
      }
    }

    return this.createRoom(userId, { timeControl: tc.key, isRanked, roomType: 'QUICK_MATCH' });
  }

  static async joinRoom(userId: string, codeOrId: string) {
    const clean = codeOrId.trim();
    const room = await prisma.chessRoom.findFirst({
      where: {
        OR: [{ id: clean }, { roomCode: clean.toUpperCase() }],
      },
    });
    if (!room) {
      throw { statusCode: 404, message: 'Chess room not found.' };
    }

    if (room.status === 'PLAYING') {
      const existingMatch = await prisma.chessMatch.findUnique({ where: { roomId: room.id } });
      if (
        existingMatch &&
        (existingMatch.whiteUserId === userId || existingMatch.blackUserId === userId)
      ) {
        return this.getRoomView(room.id, userId);
      }
      throw { statusCode: 409, message: 'This chess room is already in progress.' };
    }

    if (room.status !== 'WAITING') {
      throw { statusCode: 400, message: `Room is ${room.status} and cannot be joined.` };
    }

    if (room.hostId === userId) {
      return this.getRoomView(room.id, userId);
    }

    const tc = getTimeControlSpec(room.timeControl);
    await this.enforceConfig(tc.key, room.isRanked);

    const [hostUser, guestUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: room.hostId }, select: { id: true, chessElo: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, chessElo: true } }),
    ]);
    if (!hostUser || !guestUser) {
      throw { statusCode: 404, message: 'Player record not found.' };
    }

    await prisma.chessRoom.updateMany({
      where: { hostId: userId, status: 'WAITING', id: { not: room.id } },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });

    const hostPlaysWhite = crypto.randomInt(0, 2) === 0;
    const whiteUser = hostPlaysWhite ? hostUser : guestUser;
    const blackUser = hostPlaysWhite ? guestUser : hostUser;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.chessRoom.updateMany({
        where: { id: room.id, status: 'WAITING' },
        data: {
          status: 'PLAYING',
          guestId: userId,
          startedAt: new Date(),
        },
      });
      if (updated.count === 0) {
        throw { statusCode: 409, message: 'Room was just joined by another player.' };
      }

      const [whiteCatRating, blackCatRating] = await Promise.all([
        this.getOrCreateCategoryRating(whiteUser.id, tc.category, tx),
        this.getOrCreateCategoryRating(blackUser.id, tc.category, tx),
      ]);

      const match = await tx.chessMatch.create({
        data: {
          roomId: room.id,
          whiteUserId: whiteUser.id,
          blackUserId: blackUser.id,
          mode: 'PVP',
          category: tc.category,
          status: 'ACTIVE',
          fen: STARTING_FEN,
          pgn: '',
          movesJson: '[]',
          moveCount: 0,
          whiteTimeMs: room.baseTimeMs,
          blackTimeMs: room.baseTimeMs,
          turnColor: 'w',
          lastMoveAt: new Date(),
          isRanked: room.isRanked,
          whiteEloBefore: whiteCatRating.rating,
          blackEloBefore: blackCatRating.rating,
        },
      });

      await tx.chessMatchParticipant.createMany({
        data: [
          {
            matchId: match.id,
            userId: whiteUser.id,
            color: 'w',
            ratingBefore: whiteCatRating.rating,
            connectionStatus: 'CONNECTED',
          },
          {
            matchId: match.id,
            userId: blackUser.id,
            color: 'b',
            ratingBefore: blackCatRating.rating,
            connectionStatus: 'CONNECTED',
          },
        ],
      });
    });

    return this.getRoomView(room.id, userId);
  }

  static async leaveRoom(roomId: string, userId: string) {
    const room = await prisma.chessRoom.findUnique({
      where: { id: roomId },
      include: { match: true },
    });
    if (!room) throw { statusCode: 404, message: 'Chess room not found.' };

    if (room.status === 'WAITING' && room.hostId === userId) {
      await prisma.chessRoom.update({
        where: { id: roomId },
        data: { status: 'CANCELLED', completedAt: new Date() },
      });
      return { cancelled: true, roomId };
    }

    if (room.match && room.match.status === 'ACTIVE') {
      const cfg = await this.getConfig();
      if (room.match.moveCount < cfg.abortWindowPlies) {
        await prisma.$transaction([
          prisma.chessMatch.update({
            where: { id: room.match.id },
            data: {
              status: 'ABORTED',
              termination: 'ABANDONED',
              completedAt: new Date(),
            },
          }),
          prisma.chessRoom.update({
            where: { id: room.id },
            data: { status: 'CANCELLED', completedAt: new Date() },
          }),
        ]);
        return { aborted: true, roomId };
      }
      return this.resignMatch(room.match.id, userId);
    }

    return { ok: true, roomId };
  }

  static async updateConnectionStatus(
    roomId: string,
    userId: string,
    connectionStatus: 'CONNECTED' | 'DISCONNECTED'
  ) {
    const match = await prisma.chessMatch.findUnique({ where: { roomId } });
    if (!match) return;
    await prisma.chessMatchParticipant.updateMany({
      where: { matchId: match.id, userId },
      data: {
        connectionStatus,
        disconnectedAt: connectionStatus === 'DISCONNECTED' ? new Date() : null,
        disconnectCount: connectionStatus === 'DISCONNECTED' ? { increment: 1 } : undefined,
      },
    });
  }

  static async finalizeDisconnectForfeit(roomId: string, disconnectedUserId: string) {
    const match = await prisma.chessMatch.findUnique({ where: { roomId } });
    if (!match || match.status !== 'ACTIVE') return null;

    if (match.whiteUserId !== disconnectedUserId && match.blackUserId !== disconnectedUserId) {
      return null;
    }

    const winnerColor: 'w' | 'b' = match.whiteUserId === disconnectedUserId ? 'b' : 'w';
    await this.finalizeMatch(match.id, { winnerColor, termination: 'ABANDONED' });
    return this.getRoomView(roomId);
  }

  private static computeLiveClocks(match: {
    status: string;
    moveCount: number;
    turnColor: string;
    whiteTimeMs: number;
    blackTimeMs: number;
    lastMoveAt: Date;
  }): { whiteTimeMs: number; blackTimeMs: number } {
    if (match.status !== 'ACTIVE' || match.moveCount < 1) {
      return { whiteTimeMs: match.whiteTimeMs, blackTimeMs: match.blackTimeMs };
    }
    const elapsed = Math.max(0, Date.now() - new Date(match.lastMoveAt).getTime());
    if (match.turnColor === 'w') {
      return {
        whiteTimeMs: Math.max(0, match.whiteTimeMs - elapsed),
        blackTimeMs: match.blackTimeMs,
      };
    }
    return {
      whiteTimeMs: match.whiteTimeMs,
      blackTimeMs: Math.max(0, match.blackTimeMs - elapsed),
    };
  }

  static async finalizeMatch(
    matchId: string,
    result: {
      winnerColor: 'w' | 'b' | null;
      termination: ChessTermination;
    }
  ) {
    const match = await prisma.chessMatch.findUnique({
      where: { id: matchId },
      include: { room: true },
    });
    if (!match || match.status !== 'ACTIVE' || match.ratingsUpdated) {
      return match;
    }

    const winnerId =
      result.winnerColor === 'w'
        ? match.whiteUserId
        : result.winnerColor === 'b'
        ? match.blackUserId
        : null;

    const category = (match.category || 'BLITZ') as ChessTimeCategory;
    const moves: ChessMoveRecord[] = JSON.parse(match.movesJson || '[]');
    const engine = ChessEngine.fromMoves(moves.map((m) => m.uci));
    const pgnResult: '1-0' | '0-1' | '1/2-1/2' =
      result.winnerColor === 'w' ? '1-0' : result.winnerColor === 'b' ? '0-1' : '1/2-1/2';

    const users = await prisma.user.findMany({
      where: { id: { in: [match.whiteUserId, match.blackUserId] } },
      select: { id: true, username: true },
    });
    const uname = new Map(users.map((u) => [u.id, u.username]));
    const pgn = engine.getPgn({
      event: `NOVA Chess (${match.room.timeControl})`,
      white: uname.get(match.whiteUserId) || 'White',
      black: uname.get(match.blackUserId) || 'Black',
      result: pgnResult,
    });

    if (match.mode === 'PVP') {
      await prisma.$transaction(async (tx) => {
        // Atomic idempotent guard against concurrent double settlement
        const claimed = await tx.chessMatch.updateMany({
          where: { id: matchId, status: 'ACTIVE', ratingsUpdated: false },
          data: {
            status: 'COMPLETED',
            ratingsUpdated: true,
            pgn,
            winnerId,
            winnerColor: result.winnerColor,
            termination: result.termination,
            completedAt: new Date(),
          },
        });
        if (claimed.count === 0) return;

        await tx.chessRoom.update({
          where: { id: match.roomId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        const [whiteRatingRec, blackRatingRec] = await Promise.all([
          this.getOrCreateCategoryRating(match.whiteUserId, category, tx),
          this.getOrCreateCategoryRating(match.blackUserId, category, tx),
        ]);

        let whiteAfter = whiteRatingRec.rating;
        let blackAfter = blackRatingRec.rating;
        const whiteScore: 1 | 0.5 | 0 =
          result.winnerColor === 'w' ? 1 : result.winnerColor === 'b' ? 0 : 0.5;
        const blackScore: 1 | 0.5 | 0 =
          result.winnerColor === 'b' ? 1 : result.winnerColor === 'w' ? 0 : 0.5;

        if (match.isRanked) {
          const elo = calculateChessElo(
            whiteRatingRec.rating,
            blackRatingRec.rating,
            whiteScore,
            whiteRatingRec.gamesPlayed,
            blackRatingRec.gamesPlayed
          );
          whiteAfter = elo.whiteAfter;
          blackAfter = elo.blackAfter;
        }

        await tx.chessMatch.update({
          where: { id: matchId },
          data: {
            whiteEloBefore: whiteRatingRec.rating,
            whiteEloAfter: whiteAfter,
            blackEloBefore: blackRatingRec.rating,
            blackEloAfter: blackAfter,
          },
        });

        await Promise.all([
          tx.chessMatchParticipant.updateMany({
            where: { matchId, userId: match.whiteUserId },
            data: {
              ratingBefore: whiteRatingRec.rating,
              ratingAfter: whiteAfter,
              ratingDelta: whiteAfter - whiteRatingRec.rating,
              score: whiteScore,
            },
          }),
          tx.chessMatchParticipant.updateMany({
            where: { matchId, userId: match.blackUserId },
            data: {
              ratingBefore: blackRatingRec.rating,
              ratingAfter: blackAfter,
              ratingDelta: blackAfter - blackRatingRec.rating,
              score: blackScore,
            },
          }),
        ]);

        // Only update category ratings & win/loss counters in Ranked games (Casual leaves ELO untouched)
        if (match.isRanked) {
          const nextWhiteStreak = result.winnerColor === 'w' ? whiteRatingRec.winStreak + 1 : 0;
          const nextBlackStreak = result.winnerColor === 'b' ? blackRatingRec.winStreak + 1 : 0;

          await Promise.all([
            tx.chessPlayerRating.update({
              where: { id: whiteRatingRec.id },
              data: {
                rating: whiteAfter,
                peakRating: Math.max(whiteRatingRec.peakRating, whiteAfter),
                gamesPlayed: { increment: 1 },
                wins: { increment: result.winnerColor === 'w' ? 1 : 0 },
                draws: { increment: result.winnerColor === null ? 1 : 0 },
                losses: { increment: result.winnerColor === 'b' ? 1 : 0 },
                winStreak: nextWhiteStreak,
                bestWinStreak: Math.max(whiteRatingRec.bestWinStreak, nextWhiteStreak),
              },
            }),
            tx.chessPlayerRating.update({
              where: { id: blackRatingRec.id },
              data: {
                rating: blackAfter,
                peakRating: Math.max(blackRatingRec.peakRating, blackAfter),
                gamesPlayed: { increment: 1 },
                wins: { increment: result.winnerColor === 'b' ? 1 : 0 },
                draws: { increment: result.winnerColor === null ? 1 : 0 },
                losses: { increment: result.winnerColor === 'w' ? 1 : 0 },
                winStreak: nextBlackStreak,
                bestWinStreak: Math.max(blackRatingRec.bestWinStreak, nextBlackStreak),
              },
            }),
            tx.user.update({
              where: { id: match.whiteUserId },
              data: {
                chessElo: whiteAfter,
                chessGamesPlayed: { increment: 1 },
                chessWins: { increment: result.winnerColor === 'w' ? 1 : 0 },
                chessDraws: { increment: result.winnerColor === null ? 1 : 0 },
                chessLosses: { increment: result.winnerColor === 'b' ? 1 : 0 },
                xp: { increment: result.winnerColor === 'w' ? 40 : 15 },
              },
            }),
            tx.user.update({
              where: { id: match.blackUserId },
              data: {
                chessElo: blackAfter,
                chessGamesPlayed: { increment: 1 },
                chessWins: { increment: result.winnerColor === 'b' ? 1 : 0 },
                chessDraws: { increment: result.winnerColor === null ? 1 : 0 },
                chessLosses: { increment: result.winnerColor === 'w' ? 1 : 0 },
                xp: { increment: result.winnerColor === 'b' ? 40 : 15 },
              },
            }),
          ]);
        } else {
          // Casual game: grant small XP without altering ratings
          await Promise.all([
            tx.user.update({
              where: { id: match.whiteUserId },
              data: { xp: { increment: 15 } },
            }),
            tx.user.update({
              where: { id: match.blackUserId },
              data: { xp: { increment: 15 } },
            }),
          ]);
        }
      });

      await Promise.all([
        EngagementService.evaluateAndSyncAchievements(match.whiteUserId).catch(() => {}),
        EngagementService.evaluateAndSyncAchievements(match.blackUserId).catch(() => {}),
      ]);
    }

    return prisma.chessMatch.findUnique({ where: { id: matchId } });
  }

  static async submitMove(
    matchId: string,
    userId: string,
    moveInput: {
      from: string;
      to: string;
      promotion?: PromotionPiece;
      expectedPly?: number;
      idempotencyKey?: string;
    }
  ) {
    const match = await prisma.chessMatch.findUnique({
      where: { id: matchId },
      include: { room: true },
    });
    if (!match) throw { statusCode: 404, message: 'Chess match not found.' };

    // Idempotent duplicate move detection
    if (moveInput.idempotencyKey) {
      const existing = await prisma.chessMove.findUnique({
        where: {
          matchId_idempotencyKey: {
            matchId,
            idempotencyKey: moveInput.idempotencyKey,
          },
        },
      });
      if (existing) {
        return this.getRoomView(match.roomId, userId);
      }
    }

    if (match.status !== 'ACTIVE') {
      throw { statusCode: 409, message: 'Match has already ended.' };
    }

    const expectedUserId =
      match.turnColor === 'w' ? match.whiteUserId : match.blackUserId;
    if (expectedUserId !== userId) {
      throw { statusCode: 403, message: 'Not your turn to move.' };
    }

    if (
      moveInput.expectedPly !== undefined &&
      moveInput.expectedPly !== match.moveCount + 1
    ) {
      throw {
        statusCode: 409,
        message: `Move sequence mismatch (expected ply ${match.moveCount + 1}, got ${moveInput.expectedPly}).`,
      };
    }

    const clocks = this.computeLiveClocks(match);
    if (
      (match.turnColor === 'w' && clocks.whiteTimeMs <= 0) ||
      (match.turnColor === 'b' && clocks.blackTimeMs <= 0)
    ) {
      await this.finalizeMatch(matchId, {
        winnerColor: match.turnColor === 'w' ? 'b' : 'w',
        termination: 'TIMEOUT',
      });
      return this.getRoomView(match.roomId, userId);
    }

    const existingMoves: ChessMoveRecord[] = JSON.parse(match.movesJson || '[]');
    const engine = ChessEngine.fromMoves(existingMoves.map((m) => m.uci));
    if (engine.getFen() !== match.fen && existingMoves.length === 0) {
      engine.loadFen(match.fen);
    }

    const record = engine.makeMove({
      from: moveInput.from,
      to: moveInput.to,
      promotion: moveInput.promotion,
    });
    if (!record) {
      throw { statusCode: 400, message: 'Illegal chess move.' };
    }

    const nextWhiteMs =
      match.turnColor === 'w'
        ? clocks.whiteTimeMs + (match.moveCount >= 1 ? match.room.incrementMs : 0)
        : clocks.whiteTimeMs;
    const nextBlackMs =
      match.turnColor === 'b'
        ? clocks.blackTimeMs + (match.moveCount >= 1 ? match.room.incrementMs : 0)
        : clocks.blackTimeMs;

    const updatedMoves = [...existingMoves, record];

    await prisma.$transaction([
      prisma.chessMove.create({
        data: {
          matchId: match.id,
          ply: record.ply,
          userId,
          uci: record.uci,
          san: record.san,
          fenAfter: record.fenAfter,
          whiteTimeMs: nextWhiteMs,
          blackTimeMs: nextBlackMs,
          idempotencyKey: moveInput.idempotencyKey || null,
        },
      }),
      prisma.chessMatch.update({
        where: { id: match.id },
        data: {
          fen: record.fenAfter,
          movesJson: JSON.stringify(updatedMoves),
          moveCount: updatedMoves.length,
          whiteTimeMs: nextWhiteMs,
          blackTimeMs: nextBlackMs,
          turnColor: engine.getTurn(),
          lastMoveAt: new Date(),
          drawOfferedBy: null,
        },
      }),
    ]);

    const over = engine.getGameOverResult();
    if (over.isOver && over.termination) {
      await this.finalizeMatch(match.id, {
        winnerColor: over.winnerColor,
        termination: over.termination,
      });
    }

    return this.getRoomView(match.roomId, userId);
  }

  static async claimTimeout(matchId: string) {
    const match = await prisma.chessMatch.findUnique({ where: { id: matchId } });
    if (!match || match.status !== 'ACTIVE') return null;

    const clocks = this.computeLiveClocks(match);
    if (match.turnColor === 'w' && clocks.whiteTimeMs <= 0) {
      await this.finalizeMatch(matchId, { winnerColor: 'b', termination: 'TIMEOUT' });
    } else if (match.turnColor === 'b' && clocks.blackTimeMs <= 0) {
      await this.finalizeMatch(matchId, { winnerColor: 'w', termination: 'TIMEOUT' });
    }
    return this.getRoomView(match.roomId);
  }

  static async resignMatch(matchId: string, userId: string) {
    const match = await prisma.chessMatch.findUnique({ where: { id: matchId } });
    if (!match) throw { statusCode: 404, message: 'Chess match not found.' };
    if (match.whiteUserId !== userId && match.blackUserId !== userId) {
      throw { statusCode: 403, message: 'Not a participant in this match.' };
    }
    if (match.status !== 'ACTIVE') {
      return this.getRoomView(match.roomId, userId);
    }

    const winnerColor = match.whiteUserId === userId ? 'b' : 'w';
    await this.finalizeMatch(matchId, { winnerColor, termination: 'RESIGNATION' });
    return this.getRoomView(match.roomId, userId);
  }

  static async offerDraw(matchId: string, userId: string) {
    const match = await prisma.chessMatch.findUnique({ where: { id: matchId } });
    if (!match) throw { statusCode: 404, message: 'Chess match not found.' };
    if (match.status !== 'ACTIVE') throw { statusCode: 409, message: 'Match is not active.' };
    if (match.whiteUserId !== userId && match.blackUserId !== userId) {
      throw { statusCode: 403, message: 'Not a participant.' };
    }

    await prisma.chessMatch.update({
      where: { id: matchId },
      data: { drawOfferedBy: userId },
    });
    return this.getRoomView(match.roomId, userId);
  }

  static async respondDraw(matchId: string, userId: string, accept: boolean) {
    const match = await prisma.chessMatch.findUnique({ where: { id: matchId } });
    if (!match) throw { statusCode: 404, message: 'Chess match not found.' };
    if (match.status !== 'ACTIVE') throw { statusCode: 409, message: 'Match is not active.' };
    if (match.whiteUserId !== userId && match.blackUserId !== userId) {
      throw { statusCode: 403, message: 'Not a participant.' };
    }
    if (!match.drawOfferedBy || match.drawOfferedBy === userId) {
      throw { statusCode: 400, message: 'No incoming draw offer to respond to.' };
    }

    if (accept) {
      await this.finalizeMatch(matchId, { winnerColor: null, termination: 'DRAW_AGREEMENT' });
    } else {
      await prisma.chessMatch.update({
        where: { id: matchId },
        data: { drawOfferedBy: null },
      });
    }
    return this.getRoomView(match.roomId, userId);
  }

  static async requestRematch(roomId: string, userId: string) {
    const room = await prisma.chessRoom.findUnique({
      where: { id: roomId },
      include: { match: true },
    });
    if (!room || !room.match) throw { statusCode: 404, message: 'Chess match not found.' };
    if (room.match.whiteUserId !== userId && room.match.blackUserId !== userId) {
      throw { statusCode: 403, message: 'Not a participant.' };
    }

    if (room.rematchNextRoomId) {
      return this.getRoomView(room.rematchNextRoomId, userId);
    }

    const acceptedBy: string[] = JSON.parse(room.rematchAcceptedBy || '[]');
    if (!acceptedBy.includes(userId)) {
      acceptedBy.push(userId);
    }

    const bothAccepted =
      acceptedBy.includes(room.match.whiteUserId) &&
      acceptedBy.includes(room.match.blackUserId);

    if (!bothAccepted) {
      await prisma.chessRoom.update({
        where: { id: roomId },
        data: { rematchAcceptedBy: JSON.stringify(acceptedBy) },
      });
      return this.getRoomView(roomId, userId);
    }

    const tc = getTimeControlSpec(room.timeControl);

    let nextCode = generateRoomCode();
    while (await prisma.chessRoom.findUnique({ where: { roomCode: nextCode } })) {
      nextCode = generateRoomCode();
    }

    const nextRoom = await prisma.$transaction(async (tx) => {
      const [newWhiteRating, newBlackRating] = await Promise.all([
        this.getOrCreateCategoryRating(room.match!.blackUserId, tc.category, tx),
        this.getOrCreateCategoryRating(room.match!.whiteUserId, tc.category, tx),
      ]);

      const created = await tx.chessRoom.create({
        data: {
          roomCode: nextCode,
          roomType: 'PRIVATE',
          status: 'PLAYING',
          timeControl: room.timeControl,
          category: tc.category,
          baseTimeMs: room.baseTimeMs,
          incrementMs: room.incrementMs,
          isRanked: room.isRanked,
          hostId: room.match!.blackUserId,
          guestId: room.match!.whiteUserId,
          startedAt: new Date(),
        },
      });

      const newMatch = await tx.chessMatch.create({
        data: {
          roomId: created.id,
          whiteUserId: room.match!.blackUserId,
          blackUserId: room.match!.whiteUserId,
          mode: 'PVP',
          category: tc.category,
          status: 'ACTIVE',
          fen: STARTING_FEN,
          pgn: '',
          movesJson: '[]',
          moveCount: 0,
          whiteTimeMs: room.baseTimeMs,
          blackTimeMs: room.baseTimeMs,
          turnColor: 'w',
          lastMoveAt: new Date(),
          isRanked: room.isRanked,
          whiteEloBefore: newWhiteRating.rating,
          blackEloBefore: newBlackRating.rating,
        },
      });

      await tx.chessMatchParticipant.createMany({
        data: [
          {
            matchId: newMatch.id,
            userId: room.match!.blackUserId,
            color: 'w',
            ratingBefore: newWhiteRating.rating,
          },
          {
            matchId: newMatch.id,
            userId: room.match!.whiteUserId,
            color: 'b',
            ratingBefore: newBlackRating.rating,
          },
        ],
      });

      await tx.chessRoom.update({
        where: { id: roomId },
        data: {
          rematchAcceptedBy: JSON.stringify(acceptedBy),
          rematchNextRoomId: created.id,
        },
      });

      return created;
    });

    return this.getRoomView(nextRoom.id, userId);
  }

  static async recordAiMatch(
    userId: string,
    payload: {
      playerColor: 'w' | 'b';
      difficulty: 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
      timeControl: string;
      fen: string;
      moves: ChessMoveRecord[];
      winnerColor: 'w' | 'b' | null;
      termination: ChessTermination;
    }
  ) {
    const tc = getTimeControlSpec(payload.timeControl);
    const playerWon = payload.winnerColor === payload.playerColor;
    const winnerId =
      payload.winnerColor === null ? null : playerWon ? userId : AI_BOT_ID;
    const roomCode = generateRoomCode();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, chessElo: true },
    });

    const engine = ChessEngine.fromMoves((payload.moves || []).map((m) => m.uci));
    const pgnResult: '1-0' | '0-1' | '1/2-1/2' =
      payload.winnerColor === 'w' ? '1-0' : payload.winnerColor === 'b' ? '0-1' : '1/2-1/2';
    const pgn = engine.getPgn({
      event: `NOVA Chess AI (${payload.difficulty})`,
      white: payload.playerColor === 'w' ? user?.username || 'Player' : `Nova AI (${payload.difficulty})`,
      black: payload.playerColor === 'b' ? user?.username || 'Player' : `Nova AI (${payload.difficulty})`,
      result: pgnResult,
    });

    const room = await prisma.chessRoom.create({
      data: {
        roomCode,
        roomType: 'AI',
        status: 'COMPLETED',
        timeControl: tc.key,
        category: tc.category,
        baseTimeMs: tc.baseTimeMs,
        incrementMs: tc.incrementMs,
        isRanked: false,
        hostId: userId,
        guestId: AI_BOT_ID,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    const match = await prisma.chessMatch.create({
      data: {
        roomId: room.id,
        whiteUserId: payload.playerColor === 'w' ? userId : AI_BOT_ID,
        blackUserId: payload.playerColor === 'b' ? userId : AI_BOT_ID,
        mode: 'AI',
        category: tc.category,
        aiDifficulty: payload.difficulty,
        status: 'COMPLETED',
        fen: payload.fen,
        pgn,
        movesJson: JSON.stringify(payload.moves || []),
        moveCount: (payload.moves || []).length,
        whiteTimeMs: tc.baseTimeMs,
        blackTimeMs: tc.baseTimeMs,
        turnColor: 'w',
        winnerId,
        winnerColor: payload.winnerColor,
        termination: payload.termination,
        isRanked: false,
        ratingsUpdated: true,
        whiteEloBefore: user?.chessElo ?? 1200,
        whiteEloAfter: user?.chessElo ?? 1200,
        blackEloBefore: 1200,
        blackEloAfter: 1200,
        completedAt: new Date(),
      },
    });

    // Grant practice XP only — AI games never change multiplayer ratings
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: playerWon ? 25 : 10 } },
    });

    await EngagementService.evaluateAndSyncAchievements(userId).catch(() => {});

    return { matchId: match.id, roomId: room.id, pgn };
  }

  static async getRoomView(roomId: string, viewerUserId?: string) {
    const room = await prisma.chessRoom.findUnique({
      where: { id: roomId },
      include: { match: { include: { participants: true } } },
    });
    if (!room) throw { statusCode: 404, message: 'Chess room not found.' };

    const tc = getTimeControlSpec(room.timeControl);
    const match = room.match;

    const userIds = Array.from(
      new Set(
        [
          room.hostId,
          room.guestId,
          match?.whiteUserId,
          match?.blackUserId,
        ].filter((id): id is string => Boolean(id && id !== AI_BOT_ID))
      )
    );
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              username: true,
              chessElo: true,
              chessWins: true,
              chessGamesPlayed: true,
              avatarFrame: true,
              equippedBadge: true,
            },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    let matchDto: any = null;
    if (match) {
      const moves: ChessMoveRecord[] = JSON.parse(match.movesJson || '[]');
      const engine = ChessEngine.fromMoves(moves.map((m) => m.uci));
      if (engine.getFen() !== match.fen && moves.length === 0) {
        engine.loadFen(match.fen);
      }
      const clocks = this.computeLiveClocks(match);
      const isParticipant = Boolean(
        viewerUserId &&
          (match.whiteUserId === viewerUserId || match.blackUserId === viewerUserId)
      );
      const myColor: 'w' | 'b' | null =
        viewerUserId === match.whiteUserId
          ? 'w'
          : viewerUserId === match.blackUserId
          ? 'b'
          : null;

      matchDto = {
        matchId: match.id,
        status: match.status,
        mode: match.mode,
        category: match.category,
        fen: match.fen,
        pgn: match.pgn,
        moves,
        moveCount: match.moveCount,
        turnColor: match.turnColor,
        inCheck: engine.isInCheck(),
        kingSquare: engine.isInCheck() ? engine.getKingSquare(engine.getTurn()) : null,
        capturedSummary: engine.getCapturedSummary(),
        whiteTimeMs: clocks.whiteTimeMs,
        blackTimeMs: clocks.blackTimeMs,
        lastMoveAt: match.lastMoveAt.toISOString(),
        drawOfferedBy: match.drawOfferedBy,
        winnerId: match.winnerId,
        winnerColor: match.winnerColor,
        termination: match.termination,
        isRanked: match.isRanked,
        whiteEloBefore: match.whiteEloBefore,
        whiteEloAfter: match.whiteEloAfter,
        blackEloBefore: match.blackEloBefore,
        blackEloAfter: match.blackEloAfter,
        participants: match.participants,
        whitePlayer: userMap.get(match.whiteUserId) || {
          id: match.whiteUserId,
          username: 'White',
          chessElo: match.whiteEloBefore,
        },
        blackPlayer: userMap.get(match.blackUserId) || {
          id: match.blackUserId,
          username: 'Black',
          chessElo: match.blackEloBefore,
        },
        isParticipant,
        myColor,
        serverNow: Date.now(),
      };
    }

    return {
      roomId: room.id,
      roomCode: room.roomCode,
      roomType: room.roomType,
      status: room.status,
      timeControl: tc,
      category: room.category,
      isRanked: room.isRanked,
      host: userMap.get(room.hostId) || { id: room.hostId, username: 'Host', chessElo: 1200 },
      rematchAcceptedBy: JSON.parse(room.rematchAcceptedBy || '[]') as string[],
      rematchNextRoomId: room.rematchNextRoomId,
      match: matchDto,
    };
  }

  // ============================================================================
  // ADMIN OVERVIEW, CONFIGURATION & MODERATION
  // ============================================================================

  static async getAdminOverview() {
    const [
      config,
      totalMatches,
      activeMatches,
      waitingRooms,
      recentMatches,
      topRatings,
      chessReports,
      auditLogs,
    ] = await Promise.all([
      this.getConfig(),
      prisma.chessMatch.count(),
      prisma.chessMatch.findMany({
        where: { status: 'ACTIVE', mode: 'PVP' },
        include: { room: true },
        orderBy: { startedAt: 'desc' },
        take: 25,
      }),
      prisma.chessRoom.findMany({
        where: { status: 'WAITING' },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.chessMatch.findMany({
        where: { status: { in: ['COMPLETED', 'ABORTED'] } },
        include: { room: true },
        orderBy: { completedAt: 'desc' },
        take: 20,
      }),
      prisma.chessPlayerRating.findMany({
        orderBy: [{ rating: 'desc' }, { wins: 'desc' }],
        take: 30,
      }),
      prisma.userReport.findMany({
        where: { reason: { contains: 'Chess' } },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.adminAuditLog.findMany({
        where: { action: { startsWith: 'CHESS_' } },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const userIds = Array.from(
      new Set([
        ...activeMatches.flatMap((m) => [m.whiteUserId, m.blackUserId]),
        ...waitingRooms.map((r) => r.hostId),
        ...recentMatches.flatMap((m) => [m.whiteUserId, m.blackUserId]).filter((id) => id !== AI_BOT_ID),
        ...topRatings.map((r) => r.userId),
        ...chessReports.flatMap((rep) => [rep.reporterId, rep.reportedUserId]),
      ])
    );

    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, username: true },
          })
        : [];
    const uname = new Map(users.map((u) => [u.id, u.username]));

    return {
      config,
      stats: {
        totalMatches,
        activeMatchesCount: activeMatches.length,
        waitingRoomsCount: waitingRooms.length,
        openReportsCount: chessReports.filter((r) => r.status === 'OPEN').length,
      },
      activeMatches: activeMatches.map((m) => ({
        matchId: m.id,
        roomId: m.roomId,
        roomCode: m.room.roomCode,
        timeControl: m.room.timeControl,
        isRanked: m.isRanked,
        moveCount: m.moveCount,
        whiteUsername: uname.get(m.whiteUserId) || 'White',
        blackUsername: uname.get(m.blackUserId) || 'Black',
        startedAt: m.startedAt.toISOString(),
      })),
      waitingRooms: waitingRooms.map((r) => ({
        roomId: r.id,
        roomCode: r.roomCode,
        roomType: r.roomType,
        timeControl: r.timeControl,
        isRanked: r.isRanked,
        hostUsername: uname.get(r.hostId) || 'Host',
        createdAt: r.createdAt.toISOString(),
      })),
      recentMatches: recentMatches.map((m) => ({
        matchId: m.id,
        roomCode: m.room.roomCode,
        mode: m.mode,
        timeControl: m.room.timeControl,
        isRanked: m.isRanked,
        termination: m.termination,
        moveCount: m.moveCount,
        whiteUsername: m.whiteUserId === AI_BOT_ID ? `AI (${m.aiDifficulty})` : uname.get(m.whiteUserId) || 'White',
        blackUsername: m.blackUserId === AI_BOT_ID ? `AI (${m.aiDifficulty})` : uname.get(m.blackUserId) || 'Black',
        completedAt: (m.completedAt || m.startedAt).toISOString(),
      })),
      ratings: topRatings.map((r) => ({
        ...r,
        username: uname.get(r.userId) || 'Player',
      })),
      reports: chessReports.map((rep) => ({
        ...rep,
        reporterUsername: uname.get(rep.reporterId) || 'Reporter',
        reportedUsername: uname.get(rep.reportedUserId) || 'Reported',
      })),
      auditLogs,
    };
  }

  static async updateAdminConfig(adminId: string, body: any) {
    const current = await this.getConfig();
    const nextEnabledTimeControls = Array.isArray(body.enabledTimeControls)
      ? body.enabledTimeControls.filter((k: string) => k in CHESS_TIME_CONTROLS)
      : current.enabledTimeControls;

    const updated = await prisma.$transaction(async (tx) => {
      const cfg = await tx.chessConfig.update({
        where: { id: 'default' },
        data: {
          enabled: body.enabled !== undefined ? Boolean(body.enabled) : current.enabled,
          rankedEnabled:
            body.rankedEnabled !== undefined ? Boolean(body.rankedEnabled) : current.rankedEnabled,
          casualEnabled:
            body.casualEnabled !== undefined ? Boolean(body.casualEnabled) : current.casualEnabled,
          aiEnabled: body.aiEnabled !== undefined ? Boolean(body.aiEnabled) : current.aiEnabled,
          maxAiDifficulty: body.maxAiDifficulty || current.maxAiDifficulty,
          enabledTimeControlsJson: JSON.stringify(
            nextEnabledTimeControls.length > 0
              ? nextEnabledTimeControls
              : ['BLITZ_5_0']
          ),
          disconnectGraceSeconds:
            body.disconnectGraceSeconds !== undefined
              ? Math.min(180, Math.max(10, Number(body.disconnectGraceSeconds)))
              : current.disconnectGraceSeconds,
          abortWindowPlies:
            body.abortWindowPlies !== undefined
              ? Math.min(10, Math.max(1, Number(body.abortWindowPlies)))
              : current.abortWindowPlies,
        },
      });

      await tx.gameConfig.upsert({
        where: { gameId: 'chess' },
        update: { enabled: cfg.enabled },
        create: {
          gameId: 'chess',
          name: 'NOVA Chess',
          houseEdgePercent: 0,
          minBet: 0,
          maxBet: 0,
          enabled: cfg.enabled,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'CHESS_CONFIG_UPDATED',
          targetId: 'default',
          details: JSON.stringify({
            enabled: cfg.enabled,
            rankedEnabled: cfg.rankedEnabled,
            casualEnabled: cfg.casualEnabled,
            aiEnabled: cfg.aiEnabled,
            maxAiDifficulty: cfg.maxAiDifficulty,
            enabledTimeControls: nextEnabledTimeControls,
            disconnectGraceSeconds: cfg.disconnectGraceSeconds,
          }),
        },
      });

      return cfg;
    });

    return {
      ...updated,
      enabledTimeControls: nextEnabledTimeControls,
    };
  }

  static async adminAbortMatch(adminId: string, matchId: string, reason?: string) {
    const match = await prisma.chessMatch.findUnique({ where: { id: matchId } });
    if (!match) throw { statusCode: 404, message: 'Chess match not found.' };
    if (match.status !== 'ACTIVE') {
      throw { statusCode: 409, message: 'Match is not active.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.chessMatch.update({
        where: { id: matchId },
        data: {
          status: 'ABORTED',
          termination: 'ADMIN_ABORTED',
          ratingsUpdated: true,
          completedAt: new Date(),
        },
      });
      await tx.chessRoom.update({
        where: { id: match.roomId },
        data: { status: 'CANCELLED', completedAt: new Date() },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'CHESS_MATCH_ABORTED',
          targetId: matchId,
          details: reason || 'Aborted by admin moderation',
        },
      });
    });

    return { aborted: true, matchId };
  }
}
