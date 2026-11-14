import crypto from 'crypto';
import { ProvablyFair } from '@nova/fairness';
import { prisma } from '../config/database.js';
import { LedgerService } from './ledger.service.js';
import { emitWalletUpdate } from '../websocket/socket.js';
import { config } from '../config/env.js';

export interface CoinFlipPlayer {
  userId: string;
  username: string;
  avatar?: string;
  choice: 'HEADS' | 'TAILS';
  ready: boolean;
  connected: boolean;
  stake: number;
}

export type CoinFlipRoomType = 'QUICK_MATCH' | 'PRIVATE';
export type CoinFlipRoomStatus = 'WAITING' | 'COUNTDOWN' | 'FLIPPING' | 'COMPLETED' | 'CANCELLED';

export interface CoinFlipRoom {
  id: string;
  roomCode: string;
  type: CoinFlipRoomType;
  status: CoinFlipRoomStatus;
  stake: number;
  pot: number;
  platformFeeBps: number;
  creatorId: string;
  playerOne: CoinFlipPlayer;
  playerTwo: CoinFlipPlayer | null;
  winnerId: string | null;
  winningSide: 'HEADS' | 'TAILS' | null;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  countdown: number;
  createdAt: Date;
  settledAt?: Date;
}

export interface CoinFlipMatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarnings: number;
}

export interface CoinFlipLeaderboardEntry {
  userId: string;
  username: string;
  wins: number;
  matches: number;
  earnings: number;
}

// In-Memory active rooms and queues
const rooms = new Map<string, CoinFlipRoom>();
const quickMatchQueue: { userId: string; username: string; stake: number; preferredSide: 'HEADS' | 'TAILS'; joinedAt: number }[] = [];
const completedMatchesHistory: CoinFlipRoom[] = [];

// Regulatory compliance configuration: real-money multiplayer is flag-gated
const REAL_MONEY_MULTIPLAYER_ENABLED = process.env.ENABLE_REAL_MONEY_MULTIPLAYER === 'true';

export class CoinFlipMatchService {
  /**
   * System compliance and config info
   */
  static getConfig() {
    return {
      realMoneyEnabled: REAL_MONEY_MULTIPLAYER_ENABLED,
      minStake: 10,
      maxStake: 10000,
      platformFeePercent: 2.5,
      platformFeeBps: 250,
      regulatoryNotice:
        'Coin Flip 1v1 Arena is operating in certified Provably Fair demo and peer-to-peer sandbox mode pending final multi-jurisdictional licensing validation.',
    };
  }

  /**
   * Generates a 6-character human-friendly room code
   */
  private static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CF-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get active room by ID
   */
  static getRoom(roomId: string): CoinFlipRoom | null {
    return rooms.get(roomId) || null;
  }

  /**
   * Get room by 6-char Room Code
   */
  static getRoomByCode(code: string): CoinFlipRoom | null {
    const clean = code.trim().toUpperCase();
    for (const room of rooms.values()) {
      if (room.roomCode.toUpperCase() === clean && room.status === 'WAITING') {
        return room;
      }
    }
    return null;
  }

  /**
   * Get active public rooms waiting for an opponent
   */
  static getAvailableRooms(): CoinFlipRoom[] {
    const list: CoinFlipRoom[] = [];
    for (const room of rooms.values()) {
      if (room.status === 'WAITING') {
        list.push(room);
      }
    }
    return list.slice(0, 20);
  }

  /**
   * Create a new 1v1 Private Room
   */
  static async createPrivateRoom(
    userId: string,
    username: string,
    stake: number,
    preferredChoice: 'HEADS' | 'TAILS'
  ): Promise<CoinFlipRoom> {
    const roomId = `cf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const roomCode = this.generateRoomCode();
    const serverSeed = ProvablyFair.generateServerSeed();
    const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);

    const room: CoinFlipRoom = {
      id: roomId,
      roomCode,
      type: 'PRIVATE',
      status: 'WAITING',
      stake,
      pot: stake * 2,
      platformFeeBps: 250, // 2.5% platform fee
      creatorId: userId,
      playerOne: {
        userId,
        username,
        choice: preferredChoice,
        ready: true,
        connected: true,
        stake,
      },
      playerTwo: null,
      winnerId: null,
      winningSide: null,
      serverSeed,
      serverSeedHash,
      clientSeed: 'nova-peer-seed',
      nonce: 1,
      countdown: 3,
      createdAt: new Date(),
    };

    rooms.set(roomId, room);
    return room;
  }

  /**
   * Join an existing Private Room via Code
   */
  static async joinPrivateRoom(
    userId: string,
    username: string,
    code: string
  ): Promise<CoinFlipRoom> {
    const room = this.getRoomByCode(code);
    if (!room) {
      throw new Error('Room not found or no longer available.');
    }
    if (room.playerOne.userId === userId) {
      return room;
    }
    if (room.playerTwo && room.playerTwo.userId !== userId) {
      throw new Error('Room is already full.');
    }

    // Opponent takes the opposite side
    const oppositeSide = room.playerOne.choice === 'HEADS' ? 'TAILS' : 'HEADS';

    room.playerTwo = {
      userId,
      username,
      choice: oppositeSide,
      ready: true,
      connected: true,
      stake: room.stake,
    };
    room.status = 'COUNTDOWN';

    return room;
  }

  /**
   * Enqueue in Quick Match
   */
  static async queueQuickMatch(
    userId: string,
    username: string,
    stake: number,
    choice: 'HEADS' | 'TAILS'
  ): Promise<{ matched: boolean; room?: CoinFlipRoom }> {
    // Check if player is already queued
    const existingIdx = quickMatchQueue.findIndex((q) => q.userId === userId);
    if (existingIdx !== -1) {
      quickMatchQueue.splice(existingIdx, 1);
    }

    // Find waiting opponent with exact matching stake
    const opponentIdx = quickMatchQueue.findIndex(
      (q) => q.stake === stake && q.userId !== userId
    );

    if (opponentIdx !== -1) {
      const opponent = quickMatchQueue.splice(opponentIdx, 1)[0];

      const roomId = `cf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const roomCode = this.generateRoomCode();
      const serverSeed = ProvablyFair.generateServerSeed();
      const serverSeedHash = ProvablyFair.hashServerSeed(serverSeed);

      // Determine sides without collision
      const p1Choice = choice;
      const p2Choice = p1Choice === 'HEADS' ? 'TAILS' : 'HEADS';

      const room: CoinFlipRoom = {
        id: roomId,
        roomCode,
        type: 'QUICK_MATCH',
        status: 'COUNTDOWN',
        stake,
        pot: stake * 2,
        platformFeeBps: 250,
        creatorId: opponent.userId,
        playerOne: {
          userId: opponent.userId,
          username: opponent.username,
          choice: p2Choice,
          ready: true,
          connected: true,
          stake,
        },
        playerTwo: {
          userId,
          username,
          choice: p1Choice,
          ready: true,
          connected: true,
          stake,
        },
        winnerId: null,
        winningSide: null,
        serverSeed,
        serverSeedHash,
        clientSeed: 'nova-quick-seed',
        nonce: 1,
        countdown: 3,
        createdAt: new Date(),
      };

      rooms.set(roomId, room);
      return { matched: true, room };
    }

    // Otherwise add to queue
    quickMatchQueue.push({
      userId,
      username,
      stake,
      preferredSide: choice,
      joinedAt: Date.now(),
    });

    return { matched: false };
  }

  /**
   * Leave Quick Match queue
   */
  static leaveQuickMatch(userId: string) {
    const idx = quickMatchQueue.findIndex((q) => q.userId === userId);
    if (idx !== -1) {
      quickMatchQueue.splice(idx, 1);
    }
  }

  /**
   * Authoritative resolution of a Coin Flip match
   */
  static async resolveMatch(roomId: string): Promise<CoinFlipRoom> {
    const room = rooms.get(roomId);
    if (!room || !room.playerTwo) {
      throw new Error('Invalid match resolution target.');
    }

    if (room.status === 'COMPLETED') {
      return room;
    }

    // 1. Generate Provably Fair Float Outcome
    const floatVal = ProvablyFair.generateFloat(
      room.serverSeed,
      room.clientSeed,
      room.nonce
    );
    const winningSide: 'HEADS' | 'TAILS' = floatVal < 0.5 ? 'HEADS' : 'TAILS';

    // 2. Identify winner
    const winner =
      room.playerOne.choice === winningSide
        ? room.playerOne
        : room.playerTwo;

    room.winningSide = winningSide;
    room.winnerId = winner.userId;
    room.status = 'COMPLETED';
    room.settledAt = new Date();

    // 3. Financial settlement (if real-money enabled)
    if (REAL_MONEY_MULTIPLAYER_ENABLED) {
      try {
        const netPot = room.pot * (1 - room.platformFeeBps / 10000);
        const payoutSantim = Math.round(netPot * 100);
        const rakeSantim = Math.round((room.pot - netPot) * 100);

        const res = await LedgerService.settlePayout(
          `coin-flip:${room.id}`,
          winner.userId,
          payoutSantim,
          rakeSantim
        );

        emitWalletUpdate(winner.userId, {
          balance: Number(res.balanceAfter) / 100,
          type: 'MATCH_PAYOUT',
          status: 'COMPLETED',
          amount: netPot,
          message: `Won 1v1 Coin Flip Arena Match #${room.roomCode}`,
        });
      } catch (err) {
        console.error('Failed to settle multiplayer coin flip wallet credit:', err);
      }
    }

    // Record in memory history for leaderboard
    completedMatchesHistory.unshift(room);
    if (completedMatchesHistory.length > 100) {
      completedMatchesHistory.pop();
    }

    return room;
  }

  /**
   * Get Recent Multiplayer Match History
   */
  static getRecentWinners(limit: number = 10) {
    return completedMatchesHistory
      .filter((m) => m.status === 'COMPLETED' && m.winnerId)
      .slice(0, limit)
      .map((m) => ({
        id: m.id,
        roomCode: m.roomCode,
        winnerName:
          m.winnerId === m.playerOne.userId
            ? m.playerOne.username
            : m.playerTwo?.username || 'Player',
        winningSide: m.winningSide,
        stake: m.stake,
        payout: m.pot * 0.975,
        settledAt: m.settledAt || m.createdAt,
      }));
  }

  /**
   * Get Multiplayer Leaderboard
   */
  static getLeaderboard(): CoinFlipLeaderboardEntry[] {
    const scores = new Map<string, { username: string; wins: number; matches: number; earnings: number }>();

    for (const m of completedMatchesHistory) {
      if (m.status !== 'COMPLETED' || !m.winnerId || !m.playerTwo) continue;

      // Player 1
      const p1 = scores.get(m.playerOne.userId) || {
        username: m.playerOne.username,
        wins: 0,
        matches: 0,
        earnings: 0,
      };
      p1.matches += 1;
      if (m.winnerId === m.playerOne.userId) {
        p1.wins += 1;
        p1.earnings += m.pot * 0.975;
      }
      scores.set(m.playerOne.userId, p1);

      // Player 2
      const p2 = scores.get(m.playerTwo.userId) || {
        username: m.playerTwo.username,
        wins: 0,
        matches: 0,
        earnings: 0,
      };
      p2.matches += 1;
      if (m.winnerId === m.playerTwo.userId) {
        p2.wins += 1;
        p2.earnings += m.pot * 0.975;
      }
      scores.set(m.playerTwo.userId, p2);
    }

    return Array.from(scores.entries())
      .map(([userId, data]) => ({
        userId,
        ...data,
      }))
      .sort((a, b) => b.wins - a.wins || b.earnings - a.earnings)
      .slice(0, 15);
  }

  /**
   * Get User Personal Match Stats
   */
  static getUserStats(userId: string): CoinFlipMatchStats {
    let matches = 0;
    let wins = 0;
    let earnings = 0;

    for (const m of completedMatchesHistory) {
      if (m.status !== 'COMPLETED' || !m.winnerId) continue;
      if (m.playerOne.userId === userId || m.playerTwo?.userId === userId) {
        matches += 1;
        if (m.winnerId === userId) {
          wins += 1;
          earnings += m.pot * 0.975;
        }
      }
    }

    const losses = matches - wins;
    const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

    return {
      totalMatches: matches,
      wins,
      losses,
      winRate,
      totalEarnings: Math.round(earnings),
    };
  }
}
