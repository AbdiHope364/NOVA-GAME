import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthServiceLogic } from '@nova/auth';
import { config } from '../config/env.js';
import { LudoMatchService } from '../services/ludoMatch.service.js';
import { prisma } from '../config/database.js';

const ludoDisconnectTimers = new Map<string, NodeJS.Timeout>();
const ludoActiveSockets = new Map<string, Set<string>>();

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

async function broadcastLudoRoomState(io: SocketIOServer, roomId: string) {
  const room = await prisma.ludoRoom.findUnique({
    where: { id: roomId },
    include: { players: true },
  });
  if (!room) return;

  for (const p of room.players) {
    const view = await LudoMatchService.getRoomView(roomId, p.userId);
    io.to(`user:${p.userId}`).emit('ludo:state-sync', view);
  }
}

export function registerLudoMatchSocket(io: SocketIOServer, socket: Socket) {
  let user = getAuthenticatedUser(socket);
  if (user) {
    socket.join(`user:${user.userId}`);
  }

  const requireUser = () => {
    if (!user) user = getAuthenticatedUser(socket);
    if (!user) {
      socket.emit('ludo:error', { message: 'Please sign in to play multiplayer Ludo.' });
      return null;
    }
    socket.join(`user:${user.userId}`);
    return user;
  };

  const trackJoin = async (roomId: string, userId: string) => {
    const roomChannel = `ludo-room:${roomId}`;
    socket.join(roomChannel);
    socket.data.ludoRoomId = roomId;

    const key = `${roomId}:${userId}`;
    if (!ludoActiveSockets.has(key)) ludoActiveSockets.set(key, new Set());
    ludoActiveSockets.get(key)!.add(socket.id);

    const pendingTimer = ludoDisconnectTimers.get(key);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      ludoDisconnectTimers.delete(key);
    }

    await LudoMatchService.updateConnectionStatus(roomId, userId, 'CONNECTED').catch(() => {});
    socket.to(roomChannel).emit('ludo:player-reconnected', { roomId, userId });
  };

  socket.on('ludo:join-room', async (data: { roomId?: string; roomCode?: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await LudoMatchService.joinRoom(
        authUser.userId,
        data?.roomId || data?.roomCode || ''
      );
      await trackJoin(view.roomId, authUser.userId);
      await broadcastLudoRoomState(io, view.roomId);
    } catch (err: any) {
      socket.emit('ludo:error', { message: err?.message || 'Unable to join Ludo room' });
    }
  });

  socket.on('ludo:sync-room', async (data: { roomId: string }) => {
    const authUser = requireUser();
    if (!authUser || !data?.roomId) return;
    try {
      await trackJoin(data.roomId, authUser.userId);
      await broadcastLudoRoomState(io, data.roomId);
    } catch {}
  });

  socket.on('ludo:roll-dice', async (data: { matchId: string; idempotencyKey?: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await LudoMatchService.rollDice(data.matchId, authUser.userId, {
        idempotencyKey: data.idempotencyKey,
      });
      await trackJoin(view.roomId, authUser.userId);
      await broadcastLudoRoomState(io, view.roomId);
    } catch (err: any) {
      socket.emit('ludo:error', { message: err?.message || 'Unable to roll dice' });
    }
  });

  socket.on(
    'ludo:move-token',
    async (data: { matchId: string; tokenIndex: number; idempotencyKey?: string }) => {
      const authUser = requireUser();
      if (!authUser) return;
      try {
        const view = await LudoMatchService.moveToken(data.matchId, authUser.userId, {
          tokenIndex: Number(data.tokenIndex),
          idempotencyKey: data.idempotencyKey,
        });
        await broadcastLudoRoomState(io, view.roomId);
      } catch (err: any) {
        socket.emit('ludo:error', { message: err?.message || 'Illegal Ludo move' });
      }
    }
  );

  socket.on('ludo:timeout-check', async (data: { matchId: string }) => {
    try {
      const view = await LudoMatchService.handleTurnTimeout(data.matchId);
      if (view) {
        await broadcastLudoRoomState(io, view.roomId);
      }
    } catch {}
  });

  socket.on('ludo:forfeit', async (data: { matchId: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await LudoMatchService.forfeitPlayer(data.matchId, authUser.userId);
      await broadcastLudoRoomState(io, view.roomId);
    } catch (err: any) {
      socket.emit('ludo:error', { message: err?.message || 'Unable to forfeit' });
    }
  });

  socket.on('disconnect', async () => {
    const authUser = user;
    const roomId = socket.data?.ludoRoomId as string | undefined;
    if (!authUser || !roomId) return;

    const key = `${roomId}:${authUser.userId}`;
    const set = ludoActiveSockets.get(key);
    if (set) {
      set.delete(socket.id);
      if (set.size > 0) return;
    }

    const match = await prisma.ludoMatch.findUnique({ where: { roomId } }).catch(() => null);
    if (!match || match.status !== 'ACTIVE') return;

    const cfg = await LudoMatchService.getConfig().catch(() => ({ reconnectGraceSeconds: 45 }));
    const graceMs = Math.max(15, cfg.reconnectGraceSeconds) * 1000;

    await LudoMatchService.updateConnectionStatus(roomId, authUser.userId, 'DISCONNECTED').catch(
      () => {}
    );
    await broadcastLudoRoomState(io, roomId).catch(() => {});

    socket.to(`ludo-room:${roomId}`).emit('ludo:player-disconnected', {
      roomId,
      userId: authUser.userId,
      graceSeconds: Math.round(graceMs / 1000),
    });

    const timer = setTimeout(async () => {
      ludoDisconnectTimers.delete(key);
      const latestSet = ludoActiveSockets.get(key);
      if (latestSet && latestSet.size > 0) return;
      const forfeitedView = await LudoMatchService.forfeitPlayer(match.id, authUser.userId).catch(
        () => null
      );
      if (forfeitedView) {
        await broadcastLudoRoomState(io, roomId);
      }
    }, graceMs);

    ludoDisconnectTimers.set(key, timer);
  });
}
