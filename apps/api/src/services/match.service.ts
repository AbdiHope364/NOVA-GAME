import { prisma } from '../config/database.js';
import {
  createInitialState,
  applyMove,
  DEFAULT_OPTIONS,
  type GameState,
  type Pos,
  type Move,
  type RuleOptions,
  IllegalMoveError,
} from '@nova/game-dama';
import { LedgerService } from './ledger.service.js';
import { AbuseService } from './abuse.service.js';

export interface MatchClocks {
  whiteTimeMs: number;
  blackTimeMs: number;
  lastMoveTimestamp: number;
}

export class MatchService {
  static readonly CLOCK_START_MS = 300000; // 5 minutes
  static readonly CLOCK_INCREMENT_MS = 2000; // 2 seconds per move
  static readonly RECONNECT_GRACE_MS = 45000; // 45 seconds disconnect grace period

  /**
   * Generates a unique 6-character uppercase invite code for private matches.
   */
  static generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Creates a new match challenge in LOBBY status.
   * Supports Free-to-Play matches with stakeMinor === 0n.
   */
  static async createChallenge(
    userId: string,
    stakeMinor: bigint | number,
    isPrivate = false
  ) {
    const stake = BigInt(stakeMinor);

    // 1. Abuse & limit checks
    const check = await AbuseService.validateMatchPreconditions(userId, stake);
    if (!check.allowed) {
      throw { statusCode: 400, message: check.reason };
    }

    // 2. Wallet balance check (only for paid matches)
    if (stake > 0n) {
      let wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await prisma.wallet.create({ data: { userId, balance: 100000 } });
      }

      if (wallet.balance < Number(stake)) {
        throw { statusCode: 400, message: 'Insufficient wallet balance for this stake' };
      }
    }

    AbuseService.recordUserActivity(userId);

    const inviteCode = isPrivate ? this.generateInviteCode() : null;
    const initialState = createInitialState('W');

    const match = await prisma.match.create({
      data: {
        stakeMinor: stake,
        rakeBps: stake > 0n ? 500 : 0, // 0% rake on free play, 5% on paid
        whiteUserId: userId, // Creator placeholder
        state: JSON.stringify(initialState),
        rulesetVersion: '1.0.0',
        ruleOptions: JSON.stringify(DEFAULT_OPTIONS),
        status: 'LOBBY',
        isPrivate,
        inviteCode,
        moveCount: 0,
      },
    });

    return {
      id: match.id,
      stakeMinor: match.stakeMinor.toString(),
      stakeEtb: Number(match.stakeMinor) / 100,
      isFreePlay: match.stakeMinor === 0n,
      status: match.status,
      isPrivate: match.isPrivate,
      inviteCode: match.inviteCode,
      rulesetVersion: match.rulesetVersion,
      createdAt: match.createdAt,
    };
  }

  /**
   * Lists open public challenges in LOBBY (excludes challenges > 30 minutes old).
   */
  static async listLobby() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const matches = await prisma.match.findMany({
      where: {
        status: 'LOBBY',
        isPrivate: false,
        createdAt: { gte: thirtyMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Populate creator username
    const creatorIds = matches.map((m) => m.whiteUserId!).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return matches.map((m) => ({
      id: m.id,
      stakeMinor: m.stakeMinor.toString(),
      stakeEtb: Number(m.stakeMinor) / 100,
      isFreePlay: m.stakeMinor === 0n,
      status: m.status,
      createdAt: m.createdAt,
      creator: userMap.get(m.whiteUserId!) || { id: m.whiteUserId, username: 'Player' },
    }));
  }

  /**
   * Retrieves match state and history.
   */
  static async getMatch(matchIdOrCode: string) {
    const match = await prisma.match.findFirst({
      where: {
        OR: [{ id: matchIdOrCode }, { inviteCode: matchIdOrCode.toUpperCase() }],
      },
      include: {
        moves: {
          orderBy: { ply: 'asc' },
        },
      },
    });

    if (!match) {
      throw { statusCode: 404, message: 'Match not found' };
    }

    const playerIds = [match.whiteUserId, match.blackUserId].filter(Boolean) as string[];
    const players = await prisma.user.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    return {
      id: match.id,
      status: match.status,
      stakeMinor: match.stakeMinor.toString(),
      stakeEtb: Number(match.stakeMinor) / 100,
      isFreePlay: match.stakeMinor === 0n,
      rulesetVersion: match.rulesetVersion,
      ruleOptions: match.ruleOptions ? (JSON.parse(match.ruleOptions) as RuleOptions) : DEFAULT_OPTIONS,
      rakeBps: match.rakeBps,
      whiteUserId: match.whiteUserId,
      blackUserId: match.blackUserId,
      whitePlayer: match.whiteUserId
        ? playerMap.get(match.whiteUserId) || { id: match.whiteUserId, username: match.whiteUserId === 'demo-guest' ? 'Guest Player' : 'Player W' }
        : null,
      blackPlayer: match.blackUserId
        ? playerMap.get(match.blackUserId) || { id: match.blackUserId, username: match.blackUserId === 'demo-guest' ? 'Guest Player' : 'Player B' }
        : null,
      state: JSON.parse(match.state) as GameState,
      clocks: match.clocks ? (JSON.parse(match.clocks) as MatchClocks) : null,
      moveCount: match.moveCount,
      winnerId: match.winnerId,
      result: match.result,
      isPrivate: match.isPrivate,
      inviteCode: match.inviteCode,
      createdAt: match.createdAt,
      finishedAt: match.finishedAt,
      moves: match.moves.map((m) => ({
        ply: m.ply,
        userId: m.userId,
        from: JSON.parse(m.fromPos) as Pos,
        path: JSON.parse(m.pathPos) as Pos[],
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Accepts/joins a challenge.
   * In ONE database transaction: checks balances, locks stakes through ledger, sets ACTIVE and randomly assigns colors.
   */
  static async joinMatch(matchId: string, joiningUserId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw { statusCode: 404, message: 'Match not found' };
    }

    if (match.status !== 'LOBBY') {
      throw { statusCode: 400, message: `Match is not in lobby (currently ${match.status})` };
    }

    const hostUserId = match.whiteUserId!;
    if (hostUserId === joiningUserId) {
      throw { statusCode: 400, message: 'Cannot join your own challenge' };
    }

    const check = await AbuseService.validateMatchPreconditions(joiningUserId, match.stakeMinor);
    if (!check.allowed) {
      throw { statusCode: 400, message: check.reason };
    }

    AbuseService.recordUserActivity(joiningUserId);

    // Single atomic database transaction for stake locking and color assignment
    const updatedMatch = await prisma.$transaction(async (tx) => {
      // 1. Double check match is still LOBBY under lock
      const current = await tx.match.findUnique({ where: { id: matchId } });
      if (!current || current.status !== 'LOBBY') {
        throw { statusCode: 409, message: 'Match has already been joined or cancelled' };
      }

      // 2. Lock stakes for both players through ledger (skipped for free-to-play)
      if (current.stakeMinor > 0n) {
        await LedgerService.lockStake(matchId, hostUserId, current.stakeMinor, tx);
        await LedgerService.lockStake(matchId, joiningUserId, current.stakeMinor, tx);
      }

      // 3. Random color assignment
      const hostIsWhite = Math.random() < 0.5;
      const whiteUserId = hostIsWhite ? hostUserId : joiningUserId;
      const blackUserId = hostIsWhite ? joiningUserId : hostUserId;

      // 4. Initialize clocks
      const clocks: MatchClocks = {
        whiteTimeMs: this.CLOCK_START_MS,
        blackTimeMs: this.CLOCK_START_MS,
        lastMoveTimestamp: Date.now(),
      };

      return tx.match.update({
        where: { id: matchId },
        data: {
          status: 'ACTIVE',
          whiteUserId,
          blackUserId,
          clocks: JSON.stringify(clocks),
        },
      });
    });

    // Run anti-collusion background check
    AbuseService.checkPairingCollusion(hostUserId, joiningUserId, matchId).catch(() => {});

    return this.getMatch(updatedMatch.id);
  }

  /**
   * Executes a move on the server: validates turn, applies clocks, checks legal move via rules engine,
   * records MatchMove dispute entry, and triggers settlement on game over.
   */
  static async handleMove(
    matchId: string,
    userId: string,
    from: Pos,
    path: Pos[]
  ) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw { statusCode: 404, message: 'Match not found' };
    }

    if (match.status !== 'ACTIVE') {
      throw { statusCode: 400, message: 'Match is not active' };
    }

    if (match.whiteUserId !== userId && match.blackUserId !== userId) {
      throw { statusCode: 403, message: 'You are not a participant in this match' };
    }

    const state = JSON.parse(match.state) as GameState;
    const expectedUserId = state.turn === 'W' ? match.whiteUserId : match.blackUserId;

    if (userId !== expectedUserId) {
      throw { statusCode: 400, message: 'Not your turn' };
    }

    const clocks = match.clocks ? (JSON.parse(match.clocks) as MatchClocks) : {
      whiteTimeMs: this.CLOCK_START_MS,
      blackTimeMs: this.CLOCK_START_MS,
      lastMoveTimestamp: Date.now(),
    };

    const now = Date.now();
    const elapsed = Math.max(0, now - clocks.lastMoveTimestamp);

    // Update active player's clock
    if (state.turn === 'W') {
      clocks.whiteTimeMs -= elapsed;
    } else {
      clocks.blackTimeMs -= elapsed;
    }

    // Check for clock expiry / forfeit
    if (clocks.whiteTimeMs <= 0 || clocks.blackTimeMs <= 0) {
      const winnerId = state.turn === 'W' ? match.blackUserId! : match.whiteUserId!;
      const result = state.turn === 'W' ? 'FORFEIT_WHITE' : 'FORFEIT_BLACK';
      return this.settleMatch(match.id, winnerId, result, state, clocks);
    }

    // Add increment to current player
    if (state.turn === 'W') {
      clocks.whiteTimeMs += this.CLOCK_INCREMENT_MS;
    } else {
      clocks.blackTimeMs += this.CLOCK_INCREMENT_MS;
    }
    clocks.lastMoveTimestamp = now;

    // Validate and apply move through pure rules engine
    let moveResult: ReturnType<typeof applyMove>;
    try {
      moveResult = applyMove(state, { from, path }, DEFAULT_OPTIONS);
    } catch (err: any) {
      if (err instanceof IllegalMoveError || err.name === 'IllegalMoveError') {
        throw { statusCode: 400, message: err.message || 'Illegal move' };
      }
      throw err;
    }

    const nextState = moveResult.state;
    const gameResult = moveResult.result;
    const nextPly = match.moveCount + 1;

    // Append to MatchMove dispute record
    await prisma.matchMove.create({
      data: {
        matchId: match.id,
        ply: nextPly,
        userId,
        fromPos: JSON.stringify(from),
        pathPos: JSON.stringify(path),
      },
    });

    // Handle game completion
    if (gameResult.status === 'win') {
      const winnerId = gameResult.winner === 'W' ? match.whiteUserId! : match.blackUserId!;
      const result = gameResult.winner === 'W' ? 'WHITE_WIN' : 'BLACK_WIN';
      return this.settleMatch(match.id, winnerId, result, nextState, clocks);
    } else if (gameResult.status === 'draw') {
      return this.settleMatch(match.id, null, 'DRAW', nextState, clocks);
    }

    // Ongoing game: save state
    const updated = await prisma.match.update({
      where: { id: match.id },
      data: {
        state: JSON.stringify(nextState),
        clocks: JSON.stringify(clocks),
        moveCount: nextPly,
      },
    });

    return {
      matchId: updated.id,
      state: nextState,
      clocks,
      lastMove: {
        from,
        path,
        captured: moveResult.move.captured,
      },
      ply: nextPly,
      isFinished: false,
    };
  }

  /**
   * Resigns the match for a player.
   */
  static async resignMatch(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw { statusCode: 404, message: 'Match not found' };
    }

    if (match.status !== 'ACTIVE') {
      throw { statusCode: 400, message: 'Match is not active' };
    }

    if (match.whiteUserId !== userId && match.blackUserId !== userId) {
      throw { statusCode: 403, message: 'You are not a participant in this match' };
    }

    const winnerId = userId === match.whiteUserId ? match.blackUserId! : match.whiteUserId!;
    const result = userId === match.whiteUserId ? 'RESIGN_WHITE' : 'RESIGN_BLACK';

    return this.settleMatch(match.id, winnerId, result);
  }

  /**
   * Atomic single-execution settlement.
   * Settles winner payout (total pot - rake) or dual refund on draw.
   */
  static async settleMatch(
    matchId: string,
    winnerId: string | null,
    result: string,
    finalState?: GameState,
    finalClocks?: MatchClocks
  ) {
    // Single-execution invariant: update status ACTIVE -> FINISHED
    const updated = await prisma.match.updateMany({
      where: { id: matchId, status: 'ACTIVE' },
      data: {
        status: 'FINISHED',
        winnerId,
        result,
        state: finalState ? JSON.stringify(finalState) : undefined,
        clocks: finalClocks ? JSON.stringify(finalClocks) : undefined,
        finishedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      // Already settled or cancelled by another thread/request
      const existing = await prisma.match.findUnique({ where: { id: matchId } });
      return {
        matchId,
        alreadySettled: true,
        match: existing,
      };
    }

    const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });
    const totalPot = match.stakeMinor * 2n;
    const rakeMinor = (totalPot * BigInt(match.rakeBps)) / 10000n;
    const payoutMinor = totalPot - rakeMinor;

    // Financial settlement only applies to paid matches with stakes > 0
    if (match.stakeMinor > 0n) {
      if (winnerId) {
        await LedgerService.settlePayout(match.id, winnerId, payoutMinor, rakeMinor);
      } else if (result === 'DRAW' || result === 'CANCELLED') {
        if (match.whiteUserId) {
          await LedgerService.refundStake(match.id, match.whiteUserId, match.stakeMinor, 'Draw/Cancelled refund');
        }
        if (match.blackUserId) {
          await LedgerService.refundStake(match.id, match.blackUserId, match.stakeMinor, 'Draw/Cancelled refund');
        }
      }
    }

    return {
      matchId: match.id,
      status: 'FINISHED',
      winnerId,
      result,
      isFreePlay: match.stakeMinor === 0n,
      payoutMinor: winnerId && match.stakeMinor > 0n ? payoutMinor.toString() : '0',
      payoutEtb: winnerId && match.stakeMinor > 0n ? Number(payoutMinor) / 100 : 0,
      rakeMinor: winnerId && match.stakeMinor > 0n ? rakeMinor.toString() : '0',
      rakeEtb: winnerId && match.stakeMinor > 0n ? Number(rakeMinor) / 100 : 0,
      state: finalState || (JSON.parse(match.state) as GameState),
      clocks: finalClocks || (match.clocks ? (JSON.parse(match.clocks) as MatchClocks) : null),
      finishedAt: match.finishedAt,
      isFinished: true,
    };
  }

  /**
   * Cancels an open challenge in LOBBY status.
   * Can only be performed by the creator while in LOBBY.
   */
  static async cancelChallenge(matchId: string, userId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw { statusCode: 404, message: 'Challenge not found' };
    }

    if (match.status !== 'LOBBY') {
      throw { statusCode: 400, message: `Challenge is already ${match.status.toLowerCase()} and cannot be cancelled` };
    }

    if (match.whiteUserId !== userId) {
      throw { statusCode: 403, message: 'Only the challenge creator can cancel this challenge' };
    }

    const cancelledMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'CANCELLED',
        result: 'CANCELLED',
        finishedAt: new Date(),
      },
    });

    return {
      id: cancelledMatch.id,
      status: cancelledMatch.status,
      message: 'Challenge cancelled successfully',
    };
  }

  /**
   * Retrieves paginated match history for a specific authenticated user.
   */
  static async getUserMatchHistory(userId: string, page = 1, limit = 20) {
    const skip = Math.max(0, (page - 1) * limit);
    const take = Math.min(Math.max(1, limit), 50);

    const where = {
      status: 'FINISHED',
      OR: [{ whiteUserId: userId }, { blackUserId: userId }],
    };

    const [total, matches] = await Promise.all([
      prisma.match.count({ where }),
      prisma.match.findMany({
        where,
        orderBy: { finishedAt: 'desc' },
        skip,
        take,
        include: {
          moves: {
            orderBy: { ply: 'asc' },
          },
        },
      }),
    ]);

    // Fetch opponent user profiles
    const opponentIds = matches
      .map((m) => (m.whiteUserId === userId ? m.blackUserId : m.whiteUserId))
      .filter(Boolean) as string[];

    const users = await prisma.user.findMany({
      where: { id: { in: opponentIds } },
      select: { id: true, username: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedMatches = matches.map((m) => {
      const isWhite = m.whiteUserId === userId;
      const opponentId = isWhite ? m.blackUserId : m.whiteUserId;
      const opponent = opponentId
        ? userMap.get(opponentId) || { id: opponentId, username: opponentId === 'demo-guest' ? 'Guest Player' : 'Player' }
        : null;

      const isWinner = m.winnerId === userId;
      const isDraw = m.result === 'DRAW';

      const durationMs =
        m.finishedAt && m.createdAt
          ? m.finishedAt.getTime() - m.createdAt.getTime()
          : 0;

      return {
        id: m.id,
        status: m.status,
        result: m.result,
        isWinner,
        isDraw,
        playerColor: isWhite ? 'W' : 'B',
        stakeMinor: m.stakeMinor.toString(),
        stakeEtb: Number(m.stakeMinor) / 100,
        isFreePlay: m.stakeMinor === 0n,
        rulesetVersion: m.rulesetVersion,
        ruleOptions: m.ruleOptions ? (JSON.parse(m.ruleOptions) as RuleOptions) : DEFAULT_OPTIONS,
        moveCount: m.moveCount,
        durationSeconds: Math.round(durationMs / 1000),
        opponent,
        createdAt: m.createdAt,
        finishedAt: m.finishedAt,
        moves: m.moves.map((mv) => ({
          ply: mv.ply,
          userId: mv.userId,
          from: JSON.parse(mv.fromPos) as Pos,
          path: JSON.parse(mv.pathPos) as Pos[],
          createdAt: mv.createdAt,
        })),
      };
    });

    return {
      matches: formattedMatches,
      pagination: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Handles disconnect forfeit after grace period expires.
   */
  static async handleDisconnectForfeit(matchId: string, disconnectedUserId: string) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.status !== 'ACTIVE') return null;

    const winnerId = disconnectedUserId === match.whiteUserId ? match.blackUserId! : match.whiteUserId!;
    const result = disconnectedUserId === match.whiteUserId ? 'FORFEIT_WHITE' : 'FORFEIT_BLACK';

    return this.settleMatch(match.id, winnerId, result);
  }
}
