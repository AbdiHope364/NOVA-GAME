import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthServiceLogic } from '@nova/auth';
import { config } from '../config/env.js';
import { MatchService } from '../services/match.service.js';
import type { Pos } from '@nova/game-dama';

// Disconnect timers: key = `${matchId}:${userId}` -> NodeJS.Timeout
const disconnectTimers = new Map<string, NodeJS.Timeout>();

// Active sockets per match: key = `${matchId}:${userId}` -> Set<socketId>
const activeSockets = new Map<string, Set<string>>();

// Active match clock ticker intervals: key = matchId -> NodeJS.Timeout
const matchClockIntervals = new Map<string, NodeJS.Timeout>();

export function registerDamaMatchSocket(io: SocketIOServer, socket: Socket) {
  // Authenticate socket user
  const token =
    (socket.handshake.auth?.token as string) ||
    socket.handshake.headers?.authorization?.replace(/^Bearer /, '');

  let user: { userId: string; username: string } | null = null;
  if (token) {
    if (token === 'demo-guest-token') {
      user = { userId: 'demo-guest', username: 'GuestPlayer' };
    } else {
      try {
        const payload = AuthServiceLogic.verifyToken(token, config.jwtSecret);
        user = { userId: payload.userId, username: payload.username };
      } catch {}
    }
  }

  socket.data.user = user;

  /**
   * Client joins match room: `JOIN_MATCH` { matchId }
   */
  socket.on('JOIN_MATCH', async (data: { matchId: string }) => {
    try {
      const matchId = data?.matchId;
      if (!matchId) return;

      const roomName = `match:${matchId}`;
      socket.join(roomName);

      const match = await MatchService.getMatch(matchId);
      const userId = user?.userId;

      // Track connection & cancel disconnect timer if user was disconnected
      if (userId) {
        const key = `${matchId}:${userId}`;
        if (!activeSockets.has(key)) {
          activeSockets.set(key, new Set());
        }
        activeSockets.get(key)!.add(socket.id);

        const timer = disconnectTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          disconnectTimers.delete(key);
          io.to(roomName).emit('MATCH_PLAYER_RECONNECTED', { userId });
        }
      }

      // Send full authoritative state to the client
      socket.emit('MATCH_STATE', match);

      // Start clock interval if match is ACTIVE and not already ticking
      if (match.status === 'ACTIVE' && !matchClockIntervals.has(matchId)) {
        startMatchClockTicker(io, matchId);
      }
    } catch (err: any) {
      socket.emit('MATCH_ERROR', { message: err.message || 'Failed to join match room' });
    }
  });

  /**
   * Client sends move: `MATCH_MOVE` { matchId, from, path, ply? }
   */
  socket.on('MATCH_MOVE', async (data: { matchId: string; from: Pos; path: Pos[]; ply?: number }) => {
    try {
      const userId = user?.userId;
      if (!userId) {
        socket.emit('MATCH_ERROR', { message: 'Authentication required to make moves' });
        return;
      }

      const { matchId, from, path, ply } = data;
      if (!matchId || !from || !path || !Array.isArray(path)) {
        socket.emit('MATCH_ERROR', { message: 'Invalid move parameters' });
        return;
      }

      // Check current match state for idempotent move filtering on reconnect / retry
      const currentMatch = await MatchService.getMatch(matchId);
      if (ply !== undefined && ply < currentMatch.moveCount) {
        // Repeated / duplicate move already processed on the server; resend current state
        socket.emit('MATCH_STATE', currentMatch);
        return;
      }

      const result = await MatchService.handleMove(matchId, userId, from, path);
      const roomName = `match:${matchId}`;

      if (result.isFinished) {
        // Stop clock ticker
        stopMatchClockTicker(matchId);
        io.to(roomName).emit('MATCH_RESULT', result);
      } else if ('lastMove' in result) {
        io.to(roomName).emit('MATCH_UPDATE', {
          state: result.state,
          lastMove: result.lastMove,
          clocks: result.clocks,
          ply: result.ply,
        });
      }
    } catch (err: any) {
      socket.emit('MATCH_ERROR', { message: err.message || 'Illegal move' });
    }
  });

  /**
   * Client resigns: `MATCH_RESIGN` { matchId }
   */
  socket.on('MATCH_RESIGN', async (data: { matchId: string }) => {
    try {
      const userId = user?.userId;
      if (!userId) return;

      const { matchId } = data;
      const result = await MatchService.resignMatch(matchId, userId);
      stopMatchClockTicker(matchId);
      io.to(`match:${matchId}`).emit('MATCH_RESULT', result);
    } catch (err: any) {
      socket.emit('MATCH_ERROR', { message: err.message || 'Failed to resign' });
    }
  });

  /**
   * Handle socket disconnect
   */
  socket.on('disconnecting', () => {
    const userId = user?.userId;
    if (!userId) return;

    for (const room of socket.rooms) {
      if (room.startsWith('match:')) {
        const matchId = room.split(':')[1];
        const key = `${matchId}:${userId}`;
        const userSockets = activeSockets.get(key);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            activeSockets.delete(key);

            // Start 45-second forfeit timer if match is ACTIVE
            startDisconnectGraceTimer(io, matchId, userId);
          }
        }
      }
    }
  });
}

function startDisconnectGraceTimer(io: SocketIOServer, matchId: string, userId: string) {
  const key = `${matchId}:${userId}`;
  if (disconnectTimers.has(key)) return;

  io.to(`match:${matchId}`).emit('MATCH_PLAYER_DISCONNECTED', {
    userId,
    gracePeriodMs: MatchService.RECONNECT_GRACE_MS,
  });

  const timer = setTimeout(async () => {
    disconnectTimers.delete(key);
    try {
      const result = await MatchService.handleDisconnectForfeit(matchId, userId);
      if (result && result.isFinished) {
        stopMatchClockTicker(matchId);
        io.to(`match:${matchId}`).emit('MATCH_RESULT', {
          ...result,
          reason: 'opponent-disconnect-forfeit',
        });
      }
    } catch (err) {
      console.error('[damaMatchSocket] Error settling disconnect forfeit:', err);
    }
  }, MatchService.RECONNECT_GRACE_MS);

  disconnectTimers.set(key, timer);
}

function startMatchClockTicker(io: SocketIOServer, matchId: string) {
  if (matchClockIntervals.has(matchId)) return;

  const interval = setInterval(async () => {
    try {
      const match = await MatchService.getMatch(matchId);
      if (match.status !== 'ACTIVE' || !match.clocks) {
        stopMatchClockTicker(matchId);
        return;
      }

      const clocks = match.clocks;
      const now = Date.now();
      const elapsed = now - clocks.lastMoveTimestamp;
      const turn = match.state.turn;

      const whiteRemaining = turn === 'W' ? clocks.whiteTimeMs - elapsed : clocks.whiteTimeMs;
      const blackRemaining = turn === 'B' ? clocks.blackTimeMs - elapsed : clocks.blackTimeMs;

      // Broadcast clock tick every second
      io.to(`match:${matchId}`).emit('MATCH_CLOCK_TICK', {
        whiteTimeMs: Math.max(0, whiteRemaining),
        blackTimeMs: Math.max(0, blackRemaining),
      });

      // Check timeout
      if (whiteRemaining <= 0 || blackRemaining <= 0) {
        stopMatchClockTicker(matchId);
        const winnerId = turn === 'W' ? match.blackPlayer?.id! : match.whitePlayer?.id!;
        const result = turn === 'W' ? 'FORFEIT_WHITE' : 'FORFEIT_BLACK';

        const settlement = await MatchService.settleMatch(
          matchId,
          winnerId,
          result,
          match.state,
          {
            whiteTimeMs: Math.max(0, whiteRemaining),
            blackTimeMs: Math.max(0, blackRemaining),
            lastMoveTimestamp: now,
          }
        );

        if (settlement && settlement.isFinished) {
          io.to(`match:${matchId}`).emit('MATCH_RESULT', {
            ...settlement,
            reason: 'time-forfeit',
          });
        }
      }
    } catch (err) {
      stopMatchClockTicker(matchId);
    }
  }, 1000);

  matchClockIntervals.set(matchId, interval);
}

function stopMatchClockTicker(matchId: string) {
  const timer = matchClockIntervals.get(matchId);
  if (timer) {
    clearInterval(timer);
    matchClockIntervals.delete(matchId);
  }
}
