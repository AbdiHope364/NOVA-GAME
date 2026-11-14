import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthServiceLogic } from '@nova/auth';
import { config } from '../config/env.js';
import { LettiMatchService } from '../services/lettiMatch.service.js';
import { prisma } from '../config/database.js';

// Disconnect grace timers: `${roomId}:${userId}` -> timer
const lettiDisconnectTimers = new Map<string, NodeJS.Timeout>();
// Active socket IDs per room/user: `${roomId}:${userId}` -> Set<socketId>
const lettiActiveSockets = new Map<string, Set<string>>();

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

/**
 * Emits strictly sanitized per-user view to each player in the room
 * so opponent private cards and hidden deck info are NEVER exposed over the wire.
 */
async function broadcastSanitizedRoomState(
  io: SocketIOServer,
  roomId: string,
  eventName: string = 'letti:game-state-updated'
) {
  const room = await prisma.lettiRoom.findUnique({
    where: { id: roomId },
    include: { players: true },
  });
  if (!room) return;

  for (const player of room.players) {
    const view = await LettiMatchService.getSanitizedRoomView(roomId, player.userId);
    io.to(`user:${player.userId}`).emit(eventName, view);
  }
}

export function registerLettiMatchSocket(io: SocketIOServer, socket: Socket) {
  let user = getAuthenticatedUser(socket);
  if (user) {
    socket.join(`user:${user.userId}`);
  }

  const requireUser = () => {
    if (!user) user = getAuthenticatedUser(socket);
    if (!user) {
      socket.emit('letti:error', { message: 'Please sign in to play Letti 1v1 Multiplayer.' });
      return null;
    }
    socket.join(`user:${user.userId}`);
    return user;
  };

  // Allow client to re-bind room socket tracking on join/reconnect
  const trackJoin = async (roomId: string, userId: string) => {
    const roomChannel = `letti-room:${roomId}`;
    socket.join(roomChannel);
    socket.data.lettiRoomId = roomId;

    const key = `${roomId}:${userId}`;
    if (!lettiActiveSockets.has(key)) lettiActiveSockets.set(key, new Set());
    lettiActiveSockets.get(key)!.add(socket.id);

    const pendingTimer = lettiDisconnectTimers.get(key);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      lettiDisconnectTimers.delete(key);
    }

    await LettiMatchService.updateConnectionStatus(roomId, userId, 'CONNECTED');
    socket.to(roomChannel).emit('letti:opponent-reconnected', { roomId, userId });
  };

  socket.on('letti:create-room', async (data: { stakeEtb: number }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const view = await LettiMatchService.createRoom(authUser.userId, Number(data?.stakeEtb), 'PRIVATE');
      await trackJoin(view.roomId, authUser.userId);
      socket.emit('letti:room-created', view);
      socket.emit('letti:game-state-updated', view);
    } catch (err: any) {
      socket.emit('letti:error', { message: err?.message || 'Failed to create room' });
    }
  });

  socket.on('letti:join-room', async (data: { roomCode?: string; roomId?: string }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const codeOrId = data?.roomId || data?.roomCode || '';
      const view = await LettiMatchService.joinRoom(authUser.userId, codeOrId);
      await trackJoin(view.roomId, authUser.userId);

      // Ensure Player 1's active user sockets also join the room channel
      await broadcastSanitizedRoomState(io, view.roomId, 'letti:player-joined');
      await broadcastSanitizedRoomState(io, view.roomId, 'letti:game-state-updated');
    } catch (err: any) {
      socket.emit('letti:error', { message: err?.message || 'Failed to join room' });
    }
  });

  socket.on('letti:quick-match', async (data: { stakeEtb: number }) => {
    const authUser = requireUser();
    if (!authUser) return;
    try {
      const res = await LettiMatchService.quickMatch(authUser.userId, Number(data?.stakeEtb));
      await trackJoin(res.view.roomId, authUser.userId);
      if (res.matched) {
        await broadcastSanitizedRoomState(io, res.view.roomId, 'letti:match-found');
        await broadcastSanitizedRoomState(io, res.view.roomId, 'letti:game-state-updated');
      } else {
        socket.emit('letti:room-created', res.view);
        socket.emit('letti:game-state-updated', res.view);
      }
    } catch (err: any) {
      socket.emit('letti:error', { message: err?.message || 'Quick Match failed' });
    }
  });

  socket.on('letti:request-state', async (data: { roomId: string }) => {
    const authUser = requireUser();
    if (!authUser || !data?.roomId) return;
    try {
      const view = await LettiMatchService.getSanitizedRoomView(data.roomId, authUser.userId);
      await trackJoin(view.roomId, authUser.userId);
      socket.emit('letti:game-state-updated', view);
    } catch (err: any) {
      socket.emit('letti:error', { message: err?.message || 'Unable to restore room state' });
    }
  });

  socket.on(
    'letti:player-ready',
    async (data: { matchId: string; idempotencyKey?: string }) => {
      const authUser = requireUser();
      if (!authUser || !data?.matchId) return;
      try {
        const res = await LettiMatchService.handleAction(authUser.userId, data.matchId, {
          actionType: 'PLAYER_READY',
          idempotencyKey: data.idempotencyKey,
        });
        await broadcastSanitizedRoomState(io, res.roomId, 'letti:game-state-updated');

        const updatedMatch = await prisma.lettiMatch.findUnique({ where: { id: data.matchId } });
        if (updatedMatch?.status === 'PLAYING') {
          await broadcastSanitizedRoomState(io, res.roomId, 'letti:game-started');
        }
      } catch (err: any) {
        socket.emit('letti:error', { message: err?.message || 'Failed to mark ready' });
      }
    }
  );

  socket.on(
    'letti:player-action',
    async (data: {
      matchId: string;
      actionType: 'PICK_CARD' | 'PLAYER_READY' | 'FLIP_CARD' | 'FORFEIT';
      pickedCardIndex?: number;
      idempotencyKey?: string;
    }) => {
      const authUser = requireUser();
      if (!authUser || !data?.matchId || !data?.actionType) return;
      try {
        const res = await LettiMatchService.handleAction(authUser.userId, data.matchId, {
          actionType: data.actionType,
          pickedCardIndex: data.pickedCardIndex,
          idempotencyKey: data.idempotencyKey,
        });

        await broadcastSanitizedRoomState(io, res.roomId, 'letti:game-state-updated');

        if (res.completed) {
          await broadcastSanitizedRoomState(io, res.roomId, 'letti:game-completed');
        } else if (data.actionType === 'FLIP_CARD') {
          await broadcastSanitizedRoomState(io, res.roomId, 'letti:turn-changed');
        } else if (data.actionType === 'PLAYER_READY') {
          const updatedMatch = await prisma.lettiMatch.findUnique({ where: { id: data.matchId } });
          if (updatedMatch?.status === 'PLAYING') {
            await broadcastSanitizedRoomState(io, res.roomId, 'letti:game-started');
          }
        }
      } catch (err: any) {
        socket.emit('letti:error', { message: err?.message || 'Invalid player action' });
      }
    }
  );

  socket.on('letti:leave-room', async (data: { roomId: string }) => {
    const authUser = requireUser();
    if (!authUser || !data?.roomId) return;
    try {
      const outcome = await LettiMatchService.leaveOrCancelRoom(authUser.userId, data.roomId);
      if (outcome.action === 'FORFEIT_REQUIRED' && outcome.matchId) {
        await LettiMatchService.handleAction(authUser.userId, outcome.matchId, {
          actionType: 'FORFEIT',
        });
        await broadcastSanitizedRoomState(io, data.roomId, 'letti:game-state-updated');
        await broadcastSanitizedRoomState(io, data.roomId, 'letti:game-completed');
      } else {
        await broadcastSanitizedRoomState(io, data.roomId, 'letti:game-state-updated');
      }
      socket.leave(`letti-room:${data.roomId}`);
    } catch (err: any) {
      socket.emit('letti:error', { message: err?.message || 'Failed to leave room' });
    }
  });

  socket.on('letti:rematch', async (data: { roomId: string }) => {
    const authUser = requireUser();
    if (!authUser || !data?.roomId) return;
    try {
      const res = await LettiMatchService.requestRematch(authUser.userId, data.roomId);
      await broadcastSanitizedRoomState(io, data.roomId, 'letti:game-state-updated');
      if (res.rematchReady && res.newRoomId) {
        await broadcastSanitizedRoomState(io, res.newRoomId, 'letti:match-found');
        await broadcastSanitizedRoomState(io, res.newRoomId, 'letti:game-state-updated');
      }
    } catch (err: any) {
      socket.emit('letti:error', { message: err?.message || 'Rematch request failed' });
    }
  });

  socket.on('disconnect', async () => {
    const roomId = socket.data?.lettiRoomId as string | undefined;
    if (!roomId || !user) return;

    const key = `${roomId}:${user.userId}`;
    const set = lettiActiveSockets.get(key);
    if (set) {
      set.delete(socket.id);
      if (set.size > 0) return; // User still has another active tab/socket
      lettiActiveSockets.delete(key);
    }

    const room = await prisma.lettiRoom.findUnique({
      where: { id: roomId },
      include: { match: true },
    });
    if (!room || (room.status !== 'READY' && room.status !== 'PLAYING')) return;

    await LettiMatchService.updateConnectionStatus(roomId, user.userId, 'DISCONNECTED');
    io.to(`letti-room:${roomId}`).emit('letti:opponent-disconnected', {
      roomId,
      userId: user.userId,
    });
    await broadcastSanitizedRoomState(io, roomId, 'letti:game-state-updated');

    const cfg = await LettiMatchService.getConfig();
    const disconnectedUserId = user.userId;

    const timer = setTimeout(async () => {
      lettiDisconnectTimers.delete(key);
      try {
        const latestRoom = await prisma.lettiRoom.findUnique({
          where: { id: roomId },
          include: { players: true, match: true },
        });
        if (!latestRoom || !latestRoom.match) return;
        const player = latestRoom.players.find((p) => p.userId === disconnectedUserId);
        if (!player || player.connectionStatus === 'CONNECTED') return;

        if (latestRoom.match.status === 'PLAYING') {
          await LettiMatchService.handleAction(disconnectedUserId, latestRoom.match.id, {
            actionType: 'FORFEIT',
          });
        } else if (latestRoom.status === 'READY' || latestRoom.status === 'WAITING') {
          await LettiMatchService.leaveOrCancelRoom(disconnectedUserId, roomId, true);
        }

        await broadcastSanitizedRoomState(io, roomId, 'letti:game-state-updated');
        await broadcastSanitizedRoomState(io, roomId, 'letti:game-completed');
      } catch {}
    }, cfg.reconnectGraceSeconds * 1000);

    lettiDisconnectTimers.set(key, timer);
  });
}
