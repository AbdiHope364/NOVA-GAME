import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthServiceLogic } from '@nova/auth';
import { PromotionPiece } from '@nova/game-chess';
import { config } from '../config/env.js';
import { ChessMatchService } from '../services/chessMatch.service.js';
import { prisma } from '../config/database.js';

const chessDisconnectTimers = new Map<string, NodeJS.Timeout>();
const chessActiveSockets = new Map<string, Set<string>>();

function getAuthenticatedUser(socket: Socket): { userId: string; username: string } | null {
  const token =
    (socket.handshake.auth?.token as string) ||
    socket.handshake.headers?.authorization?.replace(/^Bearer /, '');
  if (!token || token === 'demo-guest-token') return null;
  try {
    const decoded = AuthServiceLogic.verifyToken(token, config.jwtSecret);
    if (decoded?.userId) {
      return { userId: decoded.userId, username: decoded.username };
    }
  } catch {}
  return null;
}

async function broadcastChessRoomState(io: SocketIOServer, roomId: string) {
  const room = await prisma.chessRoom.findUnique({
    where: { id: roomId },
    include: { match: true },
  });
  if (!room) return;

  const participantIds = new Set<string>([room.hostId]);
  if (room.guestId) participantIds.add(room.guestId);
  if (room.match) {
    participantIds.add(room.match.whiteUserId);
    participantIds.add(room.match.blackUserId);
  }

  for (const uid of participantIds) {
    const view = await ChessMatchService.getRoomView(roomId, uid);
    io.to(`user:${uid}`).emit('chess:state', view);
  }

  const specView = await ChessMatchService.getRoomView(roomId);
  io.to(`chess-spectate:${roomId}`).emit('chess:state', specView);
}

export function registerChessMatchSocket(io: SocketIOServer, socket: Socket) {
  let user = getAuthenticatedUser(socket);
  if (user) {
    socket.join(`user:${user.userId}`);
  }

  const requireUser = () => {
    if (!user) user = getAuthenticatedUser(socket);
    if (!user) {
      socket.emit('chess:error', { message: 'Please sign in to play multiplayer Chess.' });
      return null;
    }
    socket.join(`user:${user.userId}`);
    return user;
  };

  const trackJoin = async (roomId: string, userId: string) => {
    const roomChannel = `chess-room:${roomId}`;
    socket.join(roomChannel);
    socket.data.chessRoomId = roomId;

    const key = `${roomId}:${userId}`;
    if (!chessActiveSockets.has(key)) chessActiveSockets.set(key, new Set());
    chessActiveSockets.get(key)!.add(socket.id);

    const pendingTimer = chessDisconnectTimers.get(key);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      chessDisconnectTimers.delete(key);
    }

    await ChessMatchService.updateConnectionStatus(roomId, userId, 'CONNECTED').catch(() => {});
    socket.to(roomChannel).emit('chess:opponent-reconnected', { roomId, userId });
  };

  socket.on('chess:spectate', async (data: { roomId: string }) => {
    try {
      if (!data?.roomId) return;
      socket.join(`chess-spectate:${data.roomId}`);
      if (user) {
        await trackJoin(data.roomId, user.userId);
      }
      const view = await ChessMatchService.getRoomView(data.roomId, user?.userId);
      socket.emit('chess:state', view);
    } catch (err: any) {
      socket.emit('chess:error', { message: err?.message || 'Unable to spectate room' });
    }
  });

  socket.on(
    'chess:create-room',
    async (data: { timeControl?: string; isRanked?: boolean }) => {
      const authUser = requireUser();
      if (!authUser) return;
      try {
        const view = await ChessMatchService.createRoom(authUser.userId, {
          timeControl: data?.timeControl,
          isRanked: data?.isRanked,
          roomType: 'PRIVATE',
        });
        await trackJoin(view.roomId, authUser.userId);
        socket.emit('chess:state', view);
      } catch (err: any) {
        socket.emit('chess:error', { message: err?.message || 'Failed to create room' });
      }
    }
  );

  socket.on(
    'chess:quick-match',
    async (data: { timeControl?: string; isRanked?: boolean }) => {
      const authUser = requireUser();
      if (!authUser) return;
      try {
        const view = await ChessMatchService.quickMatch(authUser.userId, data || {});
        await trackJoin(view.roomId, authUser.userId);
        await broadcastChessRoomState(io, view.roomId);
      } catch (err: any) {
        socket.emit('chess:error', { message: err?.message || 'Quick Match failed' });
      }
    }
  );

  socket.on('chess:join-room', async (data: { roomCode?: string; roomId?: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await ChessMatchService.joinRoom(
        authUser.userId,
        data?.roomId || data?.roomCode || ''
      );
      await trackJoin(view.roomId, authUser.userId);
      await broadcastChessRoomState(io, view.roomId);
    } catch (err: any) {
      socket.emit('chess:error', { message: err?.message || 'Failed to join chess room' });
    }
  });

  socket.on(
    'chess:move',
    async (data: {
      matchId: string;
      from: string;
      to: string;
      promotion?: PromotionPiece;
      expectedPly?: number;
      idempotencyKey?: string;
    }) => {
      const authUser = requireUser();
      if (!authUser) return;
      try {
        const view = await ChessMatchService.submitMove(data.matchId, authUser.userId, {
          from: data.from,
          to: data.to,
          promotion: data.promotion,
          expectedPly: data.expectedPly,
          idempotencyKey: data.idempotencyKey,
        });
        await trackJoin(view.roomId, authUser.userId);
        await broadcastChessRoomState(io, view.roomId);
      } catch (err: any) {
        socket.emit('chess:error', { message: err?.message || 'Illegal move' });
      }
    }
  );

  socket.on('chess:resign', async (data: { matchId: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await ChessMatchService.resignMatch(data.matchId, authUser.userId);
      await broadcastChessRoomState(io, view.roomId);
    } catch (err: any) {
      socket.emit('chess:error', { message: err?.message || 'Unable to resign' });
    }
  });

  socket.on('chess:offer-draw', async (data: { matchId: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await ChessMatchService.offerDraw(data.matchId, authUser.userId);
      await broadcastChessRoomState(io, view.roomId);
    } catch (err: any) {
      socket.emit('chess:error', { message: err?.message || 'Unable to offer draw' });
    }
  });

  socket.on('chess:respond-draw', async (data: { matchId: string; accept: boolean }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await ChessMatchService.respondDraw(
        data.matchId,
        authUser.userId,
        Boolean(data.accept)
      );
      await broadcastChessRoomState(io, view.roomId);
    } catch (err: any) {
      socket.emit('chess:error', { message: err?.message || 'Unable to respond to draw' });
    }
  });

  socket.on('chess:claim-timeout', async (data: { matchId: string }) => {
    try {
      const view = await ChessMatchService.claimTimeout(data.matchId);
      if (view) {
        await broadcastChessRoomState(io, view.roomId);
      }
    } catch {}
  });

  socket.on('chess:rematch', async (data: { roomId: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await ChessMatchService.requestRematch(data.roomId, authUser.userId);
      if (view.roomId !== data.roomId) {
        await broadcastChessRoomState(io, data.roomId);
      }
      await broadcastChessRoomState(io, view.roomId);
    } catch (err: any) {
      socket.emit('chess:error', { message: err?.message || 'Rematch error' });
    }
  });

  socket.on('chess:leave-room', async (data: { roomId: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      await ChessMatchService.leaveRoom(data.roomId, authUser.userId);
      await broadcastChessRoomState(io, data.roomId);
    } catch {}
  });

  socket.on('disconnect', async () => {
    const authUser = user;
    const roomId = socket.data?.chessRoomId as string | undefined;
    if (!authUser || !roomId) return;

    const key = `${roomId}:${authUser.userId}`;
    const set = chessActiveSockets.get(key);
    if (set) {
      set.delete(socket.id);
      if (set.size > 0) return;
    }

    const match = await prisma.chessMatch.findUnique({ where: { roomId } }).catch(() => null);
    if (!match || match.status !== 'ACTIVE' || match.mode !== 'PVP') return;

    const cfg = await ChessMatchService.getConfig().catch(() => ({ disconnectGraceSeconds: 45 }));
    const graceMs = Math.max(10, cfg.disconnectGraceSeconds) * 1000;

    await ChessMatchService.updateConnectionStatus(roomId, authUser.userId, 'DISCONNECTED').catch(
      () => {}
    );
    socket.to(`chess-room:${roomId}`).emit('chess:opponent-disconnected', {
      roomId,
      userId: authUser.userId,
      graceSeconds: Math.round(graceMs / 1000),
    });

    const timer = setTimeout(async () => {
      chessDisconnectTimers.delete(key);
      const latestSet = chessActiveSockets.get(key);
      if (latestSet && latestSet.size > 0) return;
      const view = await ChessMatchService.finalizeDisconnectForfeit(roomId, authUser.userId).catch(
        () => null
      );
      if (view) {
        await broadcastChessRoomState(io, roomId);
      }
    }, graceMs);

    chessDisconnectTimers.set(key, timer);
  });
}
