import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthServiceLogic } from '@nova/auth';
import { config } from '../config/env.js';
import {
  ticTacToeMatchService,
  TttGameMode,
} from '../services/ticTacToeMatch.service.js';

function getAuthenticatedUser(socket: Socket): { userId: string; username: string } {
  const token =
    (socket.handshake.auth?.token as string) ||
    socket.handshake.headers?.authorization?.replace(/^Bearer /, '');

  if (token && token !== 'demo-guest-token') {
    try {
      const decoded = AuthServiceLogic.verifyToken(token, config.jwtSecret);
      if (decoded?.userId) {
        return { userId: decoded.userId, username: decoded.username };
      }
    } catch {}
  }

  // Fallback guest session for multiplayer sandbox preview
  const guestId = (socket.data?.userId as string) || `guest-${socket.id.slice(0, 5)}`;
  const guestName = (socket.data?.username as string) || `Player_${socket.id.slice(0, 4)}`;
  return { userId: guestId, username: guestName };
}

export function registerTicTacToeSocket(io: SocketIOServer, socket: Socket) {
  const user = getAuthenticatedUser(socket);
  socket.join(`user:${user.userId}`);

  // Reconnection check: if user already has an active match in progress, rejoin room and resume
  const existingMatch = ticTacToeMatchService.getActiveMatchForUser(user.userId);
  if (existingMatch && existingMatch.status === 'IN_PROGRESS') {
    socket.join(`ttt-room:${existingMatch.id}`);
    ticTacToeMatchService.handlePlayerReconnect(user.userId, socket.id);
    socket.emit('ttt:match:resumed', { match: existingMatch });
    socket.to(`ttt-room:${existingMatch.id}`).emit('ttt:player:reconnected', {
      userId: user.userId,
      match: existingMatch,
    });
  }

  // 1. Join Matchmaking Queue (Quick Match / Ranked)
  socket.on(
    'ttt:queue:join',
    (data: { mode?: TttGameMode; stake?: number; avatarUrl?: string }) => {
      try {
        const mode = data?.mode || 'FREE';
        const stake = data?.stake || 0;
        const stats = ticTacToeMatchService.getOrCreateStats(user.userId, user.username);

        const res = ticTacToeMatchService.enqueueMatchmaking({
          userId: user.userId,
          username: user.username,
          avatarUrl: data?.avatarUrl,
          rating: stats.rating,
          mode,
          stake,
          socketId: socket.id,
          joinedAt: Date.now(),
        });

        if (res.matched && res.match) {
          const match = res.match;
          socket.join(`ttt-room:${match.id}`);

          // Notify Player X and Player O
          io.to(`user:${match.playerX.userId}`).emit('ttt:match:found', {
            match,
            assignedSymbol: 'X',
          });
          io.to(`user:${match.playerO.userId}`).emit('ttt:match:found', {
            match,
            assignedSymbol: 'O',
          });

          // Begin match countdown & start
          io.to(`ttt-room:${match.id}`).emit('ttt:match:started', { match });
        } else {
          socket.emit('ttt:queue:waiting', {
            mode,
            rating: stats.rating,
            message: 'Searching for opponent in the arena...',
          });
        }
      } catch (err: any) {
        socket.emit('ttt:error', { message: err?.message || 'Failed to join matchmaking' });
      }
    }
  );

  // 2. Leave Matchmaking Queue
  socket.on('ttt:queue:leave', () => {
    try {
      ticTacToeMatchService.dequeueMatchmaking(user.userId);
      socket.emit('ttt:queue:left', { success: true });
    } catch (err: any) {
      socket.emit('ttt:error', { message: err?.message || 'Failed to leave queue' });
    }
  });

  // 3. Create Private Room
  socket.on(
    'ttt:room:create',
    (data: { mode?: TttGameMode; stake?: number; avatarUrl?: string }) => {
      try {
        const mode = data?.mode || 'FREE';
        const stake = data?.stake || 0;

        const match = ticTacToeMatchService.createPrivateRoom({
          hostUserId: user.userId,
          hostUsername: user.username,
          hostAvatar: data?.avatarUrl,
          socketId: socket.id,
          mode,
          stake,
        });

        socket.join(`ttt-room:${match.id}`);
        socket.emit('ttt:room:created', {
          match,
          roomCode: match.roomCode,
          assignedSymbol: 'X',
        });
      } catch (err: any) {
        socket.emit('ttt:error', { message: err?.message || 'Failed to create room' });
      }
    }
  );

  // 4. Join Private Room by Code
  socket.on(
    'ttt:room:join',
    (data: { roomCode: string; avatarUrl?: string }) => {
      try {
        const { roomCode, avatarUrl } = data;
        const match = ticTacToeMatchService.joinPrivateRoom({
          roomCode,
          guestUserId: user.userId,
          guestUsername: user.username,
          guestAvatar: avatarUrl,
          socketId: socket.id,
        });

        socket.join(`ttt-room:${match.id}`);

        // Broadcast to both players
        io.to(`user:${match.playerX.userId}`).emit('ttt:match:started', {
          match,
          assignedSymbol: 'X',
        });
        io.to(`user:${match.playerO.userId}`).emit('ttt:match:started', {
          match,
          assignedSymbol: 'O',
        });
        io.to(`ttt-room:${match.id}`).emit('ttt:match:started', { match });
      } catch (err: any) {
        socket.emit('ttt:error', { message: err?.message || 'Failed to join room' });
      }
    }
  );

  // 5. Authoritative Move Request
  socket.on('ttt:move', (data: { matchId: string; cellIndex: number; version?: number }) => {
    try {
      const { matchId, cellIndex, version } = data;

      const { match, isGameOver } = ticTacToeMatchService.executeMove({
        matchId,
        userId: user.userId,
        cellIndex,
        expectedVersion: version,
      });

      // Broadcast accepted move to all room observers and players
      io.to(`ttt-room:${match.id}`).emit('ttt:move:accepted', {
        match,
        cellIndex,
        playedBy: user.userId,
        currentTurn: match.currentTurn,
        moveCount: match.moveCount,
        board: match.board,
      });

      if (isGameOver) {
        io.to(`ttt-room:${match.id}`).emit('ttt:match:finished', {
          match,
          winnerId: match.winnerId,
          winnerSymbol: match.winnerSymbol,
          winningLine: match.winningLine,
          endReason: match.endReason,
        });
      } else {
        io.to(`ttt-room:${match.id}`).emit('ttt:turn:changed', {
          currentTurn: match.currentTurn,
          turnStartedAt: match.turnStartedAt,
        });
      }
    } catch (err: any) {
      socket.emit('ttt:error', { message: err?.message || 'Move rejected' });
    }
  });

  // 6. Resign / Surrender
  socket.on('ttt:match:resign', (data: { matchId: string }) => {
    try {
      const match = ticTacToeMatchService.resignMatch(data.matchId, user.userId);
      io.to(`ttt-room:${match.id}`).emit('ttt:match:finished', {
        match,
        winnerId: match.winnerId,
        winnerSymbol: match.winnerSymbol,
        winningLine: null,
        endReason: 'RESIGN',
      });
    } catch (err: any) {
      socket.emit('ttt:error', { message: err?.message || 'Failed to resign match' });
    }
  });

  // 7. Quick Reaction / Emote Chat in Arena
  socket.on('ttt:reaction', (data: { matchId: string; reaction: string }) => {
    io.to(`ttt-room:${data.matchId}`).emit('ttt:reaction', {
      userId: user.userId,
      username: user.username,
      reaction: data.reaction,
    });
  });

  // 8. Disconnect handling with 30-sec grace period
  socket.on('disconnect', () => {
    ticTacToeMatchService.dequeueMatchmaking(user.userId);
    const { match, opponentId } = ticTacToeMatchService.handlePlayerDisconnect(user.userId);
    if (match && opponentId) {
      io.to(`user:${opponentId}`).emit('ttt:player:disconnected', {
        userId: user.userId,
        graceSeconds: match.reconnectGraceSeconds,
        message: 'Opponent disconnected. 30s reconnection timer started.',
      });
    }
  });
}
