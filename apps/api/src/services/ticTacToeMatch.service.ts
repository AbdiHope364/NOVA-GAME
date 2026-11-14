import crypto from 'crypto';
import {
  TttBoard,
  TttSymbol,
  TttWinner,
  WinningLine,
  MatchStatus,
  createInitialBoard,
  applyMove,
  checkWinner,
  calculateEloDelta,
  TURN_TIMEOUT_SECONDS,
  RECONNECT_GRACE_SECONDS,
  DEFAULT_STARTING_RATING,
  DEFAULT_PLATFORM_FEE_BPS,
} from '@nova/game-tic-tac-toe';
import { prisma } from '../config/database.js';
import { LedgerService } from './ledger.service.js';
import { emitWalletUpdate } from '../websocket/socket.js';
import { config } from '../config/env.js';

// Feature flag: competitive real-money play is disabled by default for regulatory compliance
export const ENABLE_REAL_MONEY_COMPETITIVE = process.env.ENABLE_REAL_MONEY_COMPETITIVE === 'true';

export type TttGameMode = 'PRACTICE' | 'FREE' | 'RANKED' | 'COMPETITIVE';

export interface TttPlayerSession {
  userId: string;
  username: string;
  avatarUrl?: string;
  symbol: TttSymbol;
  rating: number;
  isReady: boolean;
  isConnected: boolean;
  socketId?: string;
  disconnectedAt?: number;
}

export interface TttMatch {
  id: string;
  roomCode: string;
  mode: TttGameMode;
  status: MatchStatus;
  board: TttBoard;
  currentTurn: TttSymbol;
  moveCount: number;
  version: number;
  winningLine: WinningLine;
  winnerId: string | null;
  winnerSymbol: TttWinner;
  playerX: TttPlayerSession;
  playerO: TttPlayerSession;
  turnStartedAt: number;
  turnTimeoutSeconds: number;
  reconnectGraceSeconds: number;
  entryStake: number; // in ETB
  pot: number;
  platformFeeBps: number;
  createdAt: Date;
  startedAt?: Date;
  settledAt?: Date;
  endReason?: 'WIN' | 'DRAW' | 'FORFEIT' | 'TIMEOUT' | 'RESIGN';
}

export interface TttQueueEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  rating: number;
  mode: TttGameMode;
  stake: number;
  socketId: string;
  joinedAt: number;
}

export interface TttUserStats {
  userId: string;
  username: string;
  rating: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  streak: number;
}

export interface TttLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

class TicTacToeMatchService {
  // Active matches indexed by matchId and roomCode
  private activeMatches = new Map<string, TttMatch>();
  private matchByRoomCode = new Map<string, string>();
  private matchByUserId = new Map<string, string>();

  // Matchmaking Queues
  private matchmakingQueue: TttQueueEntry[] = [];

  // Completed match history in-memory (max 200)
  private matchHistory: TttMatch[] = [];

  // In-memory player stats fallback (persisted in DB when available)
  private playerStats = new Map<string, TttUserStats>();

  // Turn timers per match
  private matchTimers = new Map<string, NodeJS.Timeout>();
  private disconnectTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Generates a distinct 6-character room code, e.g., TTT-4921
   */
  private generateRoomCode(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `TTT-${num}`;
  }

  /**
   * Retrieves or initializes player stats
   */
  public getOrCreateStats(userId: string, username: string): TttUserStats {
    let stats = this.playerStats.get(userId);
    if (!stats) {
      stats = {
        userId,
        username,
        rating: DEFAULT_STARTING_RATING,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        streak: 0,
      };
      this.playerStats.set(userId, stats);
    }
    return stats;
  }

  /**
   * Create Private Room
   */
  public createPrivateRoom(params: {
    hostUserId: string;
    hostUsername: string;
    hostAvatar?: string;
    socketId: string;
    mode: TttGameMode;
    stake?: number;
  }): TttMatch {
    const { hostUserId, hostUsername, hostAvatar, socketId, mode, stake = 0 } = params;

    // Regulatory check: block competitive real-money matches if flag is off
    if (mode === 'COMPETITIVE' && !ENABLE_REAL_MONEY_COMPETITIVE) {
      throw new Error(
        'Competitive real-money Tic-Tac-Toe is currently in regulatory staging and disabled.'
      );
    }

    const matchId = `ttt_${crypto.randomUUID()}`;
    const roomCode = this.generateRoomCode();
    const hostStats = this.getOrCreateStats(hostUserId, hostUsername);

    // Host is assigned X initially, guest will be O
    const hostPlayer: TttPlayerSession = {
      userId: hostUserId,
      username: hostUsername,
      avatarUrl: hostAvatar,
      symbol: 'X',
      rating: hostStats.rating,
      isReady: true,
      isConnected: true,
      socketId,
    };

    // Placeholder until guest joins
    const dummyGuest: TttPlayerSession = {
      userId: '',
      username: 'Waiting for opponent...',
      symbol: 'O',
      rating: DEFAULT_STARTING_RATING,
      isReady: false,
      isConnected: false,
    };

    const match: TttMatch = {
      id: matchId,
      roomCode,
      mode,
      status: 'WAITING',
      board: createInitialBoard(),
      currentTurn: 'X',
      moveCount: 0,
      version: 1,
      winningLine: null,
      winnerId: null,
      winnerSymbol: null,
      playerX: hostPlayer,
      playerO: dummyGuest,
      turnStartedAt: Date.now(),
      turnTimeoutSeconds: TURN_TIMEOUT_SECONDS,
      reconnectGraceSeconds: RECONNECT_GRACE_SECONDS,
      entryStake: stake,
      pot: stake * 2,
      platformFeeBps: DEFAULT_PLATFORM_FEE_BPS,
      createdAt: new Date(),
    };

    this.activeMatches.set(matchId, match);
    this.matchByRoomCode.set(roomCode, matchId);
    this.matchByUserId.set(hostUserId, matchId);

    return match;
  }

  /**
   * Join Private Room by code
   */
  public joinPrivateRoom(params: {
    roomCode: string;
    guestUserId: string;
    guestUsername: string;
    guestAvatar?: string;
    socketId: string;
  }): TttMatch {
    const { roomCode, guestUserId, guestUsername, guestAvatar, socketId } = params;

    const matchId = this.matchByRoomCode.get(roomCode.trim().toUpperCase());
    if (!matchId) {
      throw new Error(`Room with code ${roomCode} not found.`);
    }

    const match = this.activeMatches.get(matchId);
    if (!match) {
      throw new Error('Room is no longer active.');
    }

    if (match.status !== 'WAITING') {
      throw new Error('Room is already full or in progress.');
    }

    if (match.playerX.userId === guestUserId) {
      throw new Error('You cannot join your own room as an opponent.');
    }

    const guestStats = this.getOrCreateStats(guestUserId, guestUsername);

    // Randomize first player symbol for fair sportsmanship
    const randomizeSymbols = Math.random() < 0.5;
    if (randomizeSymbols) {
      match.playerO = { ...match.playerX, symbol: 'O' };
      match.playerX = {
        userId: guestUserId,
        username: guestUsername,
        avatarUrl: guestAvatar,
        symbol: 'X',
        rating: guestStats.rating,
        isReady: true,
        isConnected: true,
        socketId,
      };
    } else {
      match.playerO = {
        userId: guestUserId,
        username: guestUsername,
        avatarUrl: guestAvatar,
        symbol: 'O',
        rating: guestStats.rating,
        isReady: true,
        isConnected: true,
        socketId,
      };
    }

    match.status = 'IN_PROGRESS';
    match.startedAt = new Date();
    match.turnStartedAt = Date.now();
    this.matchByUserId.set(guestUserId, matchId);

    this.startTurnTimer(match);

    return match;
  }

  /**
   * Enter Matchmaking Queue
   */
  public enqueueMatchmaking(entry: TttQueueEntry): { matched: boolean; match?: TttMatch } {
    if (entry.mode === 'COMPETITIVE' && !ENABLE_REAL_MONEY_COMPETITIVE) {
      throw new Error(
        'Competitive matchmaking is disabled until regulatory approvals are finalized.'
      );
    }

    // Prevent duplicate queuing
    this.dequeueMatchmaking(entry.userId);

    // Look for matching opponent in queue
    const now = Date.now();
    const candidateIndex = this.matchmakingQueue.findIndex((candidate) => {
      if (candidate.userId === entry.userId) return false;
      if (candidate.mode !== entry.mode) return false;
      if (candidate.stake !== entry.stake) return false;

      // Rating window starts at 150 and expands 50 pts every 5 seconds waiting
      const waitTimeSec = (now - candidate.joinedAt) / 1000;
      const ratingTolerance = 150 + Math.floor(waitTimeSec / 5) * 50;
      return Math.abs(candidate.rating - entry.rating) <= ratingTolerance;
    });

    if (candidateIndex !== -1) {
      // Found opponent! Remove from queue and start match
      const [opponent] = this.matchmakingQueue.splice(candidateIndex, 1);
      const match = this.createMultiplayerMatch(entry, opponent);
      return { matched: true, match };
    }

    // No opponent found yet: add to queue
    this.matchmakingQueue.push(entry);
    return { matched: false };
  }

  /**
   * Leave Matchmaking Queue
   */
  public dequeueMatchmaking(userId: string): boolean {
    const idx = this.matchmakingQueue.findIndex((q) => q.userId === userId);
    if (idx !== -1) {
      this.matchmakingQueue.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Helper to create active match from two matched players
   */
  private createMultiplayerMatch(p1: TttQueueEntry, p2: TttQueueEntry): TttMatch {
    const matchId = `ttt_${crypto.randomUUID()}`;
    const roomCode = this.generateRoomCode();

    // Randomize starting player
    const p1IsX = Math.random() < 0.5;

    const playerX: TttPlayerSession = {
      userId: p1IsX ? p1.userId : p2.userId,
      username: p1IsX ? p1.username : p2.username,
      avatarUrl: p1IsX ? p1.avatarUrl : p2.avatarUrl,
      symbol: 'X',
      rating: p1IsX ? p1.rating : p2.rating,
      isReady: true,
      isConnected: true,
      socketId: p1IsX ? p1.socketId : p2.socketId,
    };

    const playerO: TttPlayerSession = {
      userId: p1IsX ? p2.userId : p1.userId,
      username: p1IsX ? p2.username : p1.username,
      avatarUrl: p1IsX ? p2.avatarUrl : p1.avatarUrl,
      symbol: 'O',
      rating: p1IsX ? p2.rating : p1.rating,
      isReady: true,
      isConnected: true,
      socketId: p1IsX ? p2.socketId : p1.socketId,
    };

    const match: TttMatch = {
      id: matchId,
      roomCode,
      mode: p1.mode,
      status: 'IN_PROGRESS',
      board: createInitialBoard(),
      currentTurn: 'X',
      moveCount: 0,
      version: 1,
      winningLine: null,
      winnerId: null,
      winnerSymbol: null,
      playerX,
      playerO,
      turnStartedAt: Date.now(),
      turnTimeoutSeconds: TURN_TIMEOUT_SECONDS,
      reconnectGraceSeconds: RECONNECT_GRACE_SECONDS,
      entryStake: p1.stake,
      pot: p1.stake * 2,
      platformFeeBps: DEFAULT_PLATFORM_FEE_BPS,
      createdAt: new Date(),
      startedAt: new Date(),
    };

    this.activeMatches.set(matchId, match);
    this.matchByRoomCode.set(roomCode, matchId);
    this.matchByUserId.set(playerX.userId, matchId);
    this.matchByUserId.set(playerO.userId, matchId);

    this.startTurnTimer(match);

    return match;
  }

  /**
   * Turn Timer: Enforces 15s turn limit. Auto-forfeits on timeout.
   */
  private startTurnTimer(match: TttMatch) {
    this.clearTurnTimer(match.id);

    const timer = setTimeout(() => {
      this.handleTurnTimeout(match.id);
    }, match.turnTimeoutSeconds * 1000);

    this.matchTimers.set(match.id, timer);
  }

  private clearTurnTimer(matchId: string) {
    const existing = this.matchTimers.get(matchId);
    if (existing) {
      clearTimeout(existing);
      this.matchTimers.delete(matchId);
    }
  }

  private handleTurnTimeout(matchId: string) {
    const match = this.activeMatches.get(matchId);
    if (!match || match.status !== 'IN_PROGRESS') return;

    // The player whose turn it was timed out; opponent wins by timeout
    const timedOutPlayer = match.currentTurn === 'X' ? match.playerX : match.playerO;
    const winnerPlayer = match.currentTurn === 'X' ? match.playerO : match.playerX;

    this.endMatch(match, winnerPlayer.symbol, 'TIMEOUT', winnerPlayer.userId);
  }

  /**
   * Process a requested move with authoritative validation and version lock
   */
  public executeMove(params: {
    matchId: string;
    userId: string;
    cellIndex: number;
    expectedVersion?: number;
  }): { match: TttMatch; isGameOver: boolean } {
    const { matchId, userId, cellIndex, expectedVersion } = params;

    const match = this.activeMatches.get(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found.`);
    }

    if (match.status !== 'IN_PROGRESS') {
      throw new Error(`Match is not in progress (current status: ${match.status}).`);
    }

    // Version concurrency check
    if (expectedVersion !== undefined && match.version !== expectedVersion) {
      throw new Error(`Stale board state. Expected v${expectedVersion}, got v${match.version}.`);
    }

    // Verify player is participant
    const isPlayerX = match.playerX.userId === userId;
    const isPlayerO = match.playerO.userId === userId;
    if (!isPlayerX && !isPlayerO) {
      throw new Error('User is not a participant in this match.');
    }

    const playerSymbol: TttSymbol = isPlayerX ? 'X' : 'O';

    // Verify turn
    if (match.currentTurn !== playerSymbol) {
      throw new Error(`It is not your turn. Current turn is ${match.currentTurn}.`);
    }

    // Apply move using pure game engine
    const moveResult = applyMove(
      match.board,
      playerSymbol,
      cellIndex,
      match.currentTurn,
      match.moveCount
    );

    if (!moveResult.valid) {
      throw new Error(moveResult.reason || 'Invalid move.');
    }

    // Commit new board state
    match.board = moveResult.board;
    match.moveCount = moveResult.moveNumber;
    match.version += 1;
    match.turnStartedAt = Date.now();

    // Check outcome
    if (moveResult.isGameOver) {
      const winnerId =
        moveResult.winner === 'X'
          ? match.playerX.userId
          : moveResult.winner === 'O'
          ? match.playerO.userId
          : null;

      this.endMatch(
        match,
        moveResult.winner,
        moveResult.isDraw ? 'DRAW' : 'WIN',
        winnerId,
        moveResult.winningLine
      );
      return { match, isGameOver: true };
    }

    // Next turn
    match.currentTurn = moveResult.nextPlayer;
    this.startTurnTimer(match);

    return { match, isGameOver: false };
  }

  /**
   * Resign / Surrender Match
   */
  public resignMatch(matchId: string, userId: string): TttMatch {
    const match = this.activeMatches.get(matchId);
    if (!match || match.status !== 'IN_PROGRESS') {
      throw new Error('Match cannot be resigned.');
    }

    const isPlayerX = match.playerX.userId === userId;
    const isPlayerO = match.playerO.userId === userId;
    if (!isPlayerX && !isPlayerO) {
      throw new Error('User is not a participant in this match.');
    }

    const winner = isPlayerX ? match.playerO : match.playerX;
    this.endMatch(match, winner.symbol, 'RESIGN', winner.userId);

    return match;
  }

  /**
   * Handle Player Disconnection with 30s Grace Period
   */
  public handlePlayerDisconnect(userId: string): { match?: TttMatch; opponentId?: string } {
    const matchId = this.matchByUserId.get(userId);
    if (!matchId) return {};

    const match = this.activeMatches.get(matchId);
    if (!match || match.status !== 'IN_PROGRESS') return {};

    const isPlayerX = match.playerX.userId === userId;
    const player = isPlayerX ? match.playerX : match.playerO;
    const opponent = isPlayerX ? match.playerO : match.playerX;

    player.isConnected = false;
    player.disconnectedAt = Date.now();

    // Pause turn timer during disconnect grace
    this.clearTurnTimer(match.id);

    // Set 30s grace period for reconnection
    const disconnectTimer = setTimeout(() => {
      this.handleDisconnectExpiry(match.id, userId);
    }, match.reconnectGraceSeconds * 1000);

    this.disconnectTimers.set(`${match.id}:${userId}`, disconnectTimer);

    return { match, opponentId: opponent.userId };
  }

  /**
   * Reconnect Player
   */
  public handlePlayerReconnect(
    userId: string,
    socketId: string
  ): { match?: TttMatch; resumed: boolean } {
    const matchId = this.matchByUserId.get(userId);
    if (!matchId) return { resumed: false };

    const match = this.activeMatches.get(matchId);
    if (!match || match.status !== 'IN_PROGRESS') return { resumed: false };

    const isPlayerX = match.playerX.userId === userId;
    const player = isPlayerX ? match.playerX : match.playerO;

    player.isConnected = true;
    player.socketId = socketId;
    player.disconnectedAt = undefined;

    // Clear disconnect timer
    const key = `${match.id}:${userId}`;
    const timer = this.disconnectTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(key);
    }

    // Resume turn timer
    this.startTurnTimer(match);

    return { match, resumed: true };
  }

  private handleDisconnectExpiry(matchId: string, disconnectedUserId: string) {
    const match = this.activeMatches.get(matchId);
    if (!match || match.status !== 'IN_PROGRESS') return;

    const winner =
      match.playerX.userId === disconnectedUserId ? match.playerO : match.playerX;

    this.endMatch(match, winner.symbol, 'FORFEIT', winner.userId);
  }

  /**
   * Finalize and Settle Match
   */
  private endMatch(
    match: TttMatch,
    winnerSymbol: TttWinner,
    reason: 'WIN' | 'DRAW' | 'FORFEIT' | 'TIMEOUT' | 'RESIGN',
    winnerId: string | null = null,
    winningLine: WinningLine = null
  ) {
    this.clearTurnTimer(match.id);
    match.status = 'FINISHED';
    match.winnerSymbol = winnerSymbol;
    match.winnerId = winnerId;
    match.winningLine = winningLine;
    match.endReason = reason;
    match.settledAt = new Date();

    // 1. Elo Rating Updates for Ranked & Competitive Matches
    if (match.mode === 'RANKED' || match.mode === 'COMPETITIVE') {
      const outcome = winnerSymbol === 'X' ? 1 : winnerSymbol === 'O' ? 0 : 0.5;
      const elo = calculateEloDelta(match.playerX.rating, match.playerO.rating, outcome);

      // Update X stats
      const statsX = this.getOrCreateStats(match.playerX.userId, match.playerX.username);
      statsX.rating = elo.playerXNewRating;
      statsX.totalMatches += 1;
      if (winnerSymbol === 'X') {
        statsX.wins += 1;
        statsX.streak = statsX.streak >= 0 ? statsX.streak + 1 : 1;
      } else if (winnerSymbol === 'O') {
        statsX.losses += 1;
        statsX.streak = statsX.streak <= 0 ? statsX.streak - 1 : -1;
      } else {
        statsX.draws += 1;
      }
      statsX.winRate = Math.round((statsX.wins / statsX.totalMatches) * 100);

      // Update O stats
      const statsO = this.getOrCreateStats(match.playerO.userId, match.playerO.username);
      statsO.rating = elo.playerONewRating;
      statsO.totalMatches += 1;
      if (winnerSymbol === 'O') {
        statsO.wins += 1;
        statsO.streak = statsO.streak >= 0 ? statsO.streak + 1 : 1;
      } else if (winnerSymbol === 'X') {
        statsO.losses += 1;
        statsO.streak = statsO.streak <= 0 ? statsO.streak - 1 : -1;
      } else {
        statsO.draws += 1;
      }
      statsO.winRate = Math.round((statsO.wins / statsO.totalMatches) * 100);
    }

    // 2. Financial Settlement (if real-money competitive mode enabled)
    if (match.mode === 'COMPETITIVE' && ENABLE_REAL_MONEY_COMPETITIVE && match.pot > 0) {
      this.settleCompetitivePot(match);
    }

    // Record into history
    this.matchHistory.unshift(match);
    if (this.matchHistory.length > 200) {
      this.matchHistory.pop();
    }

    // Cleanup active lookups after brief retention
    setTimeout(() => {
      this.activeMatches.delete(match.id);
      this.matchByRoomCode.delete(match.roomCode);
      this.matchByUserId.delete(match.playerX.userId);
      this.matchByUserId.delete(match.playerO.userId);
    }, 30000);
  }

  /**
   * Financial Pot Settlement: Winner takes pot minus fee; draw refunds both stakes in full
   */
  private async settleCompetitivePot(match: TttMatch) {
    try {
      if (match.winnerSymbol === 'DRAW') {
        // Draw: 100% refund to both players (zero fee deducted)
        const refundSantim = Math.round(match.entryStake * 100);
        await LedgerService.refundStake(`ttt:${match.id}`, match.playerX.userId, refundSantim, 'Tic-Tac-Toe match ended in a draw');
        await LedgerService.refundStake(`ttt:${match.id}`, match.playerO.userId, refundSantim, 'Tic-Tac-Toe match ended in a draw');
      } else if (match.winnerId) {
        // Winner payout
        const netPot = match.pot * (1 - match.platformFeeBps / 10000);
        const payoutSantim = Math.round(netPot * 100);
        const rakeSantim = Math.round((match.pot - netPot) * 100);

        const res = await LedgerService.settlePayout(
          `ttt:${match.id}`,
          match.winnerId,
          payoutSantim,
          rakeSantim
        );

        emitWalletUpdate(match.winnerId, {
          balance: Number(res.balanceAfter) / 100,
          type: 'MATCH_PAYOUT',
          status: 'COMPLETED',
          amount: netPot,
          message: `Won Tic-Tac-Toe Match #${match.roomCode}`,
        });
      }
    } catch (err) {
      console.error('Failed to settle Tic-Tac-Toe pot:', err);
    }
  }

  /**
   * Get Active Match by User
   */
  public getActiveMatchForUser(userId: string): TttMatch | null {
    const matchId = this.matchByUserId.get(userId);
    if (!matchId) return null;
    return this.activeMatches.get(matchId) || null;
  }

  /**
   * Get Active Match by ID
   */
  public getMatchById(matchId: string): TttMatch | null {
    return this.activeMatches.get(matchId) || null;
  }

  /**
   * Get Leaderboard sorted by Rating
   */
  public getLeaderboard(limit = 50): TttLeaderboardEntry[] {
    const entries = Array.from(this.playerStats.values())
      .filter((s) => s.totalMatches > 0)
      .sort((a, b) => b.rating - a.rating || b.wins - a.wins)
      .slice(0, limit)
      .map((s, idx) => ({
        rank: idx + 1,
        userId: s.userId,
        username: s.username,
        rating: s.rating,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        winRate: s.winRate,
      }));

    return entries;
  }

  /**
   * Get Recent Completed Matches
   */
  public getRecentMatches(limit = 20): TttMatch[] {
    return this.matchHistory.slice(0, limit);
  }

  /**
   * Admin: Metrics & Overview
   */
  public getAdminOverview() {
    return {
      activeMatchesCount: this.activeMatches.size,
      queuedPlayersCount: this.matchmakingQueue.length,
      totalCompletedMatches: this.matchHistory.length,
      realMoneyEnabled: ENABLE_REAL_MONEY_COMPETITIVE,
      activeMatches: Array.from(this.activeMatches.values()).map((m) => ({
        id: m.id,
        roomCode: m.roomCode,
        mode: m.mode,
        status: m.status,
        playerX: m.playerX.username,
        playerO: m.playerO.username,
        startedAt: m.startedAt,
        moves: m.moveCount,
      })),
      queue: this.matchmakingQueue.map((q) => ({
        userId: q.userId,
        username: q.username,
        mode: q.mode,
        rating: q.rating,
        waitingSeconds: Math.floor((Date.now() - q.joinedAt) / 1000),
      })),
    };
  }
}

export const ticTacToeMatchService = new TicTacToeMatchService();
