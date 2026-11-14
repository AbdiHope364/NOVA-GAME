import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthServiceLogic } from '@nova/auth';
import { config } from '../config/env.js';
import { CoinFlipMatchService } from '../services/coinFlipMatch.service.js';

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

  // Fallback guest session for multiplayer preview/sandbox
  const guestId = (socket.data?.userId as string) || `guest-${socket.id.slice(0, 5)}`;
  const guestName = (socket.data?.username as string) || `Guest_${socket.id.slice(0, 4)}`;
  return { userId: guestId, username: guestName };
}

export function registerCoinFlipMatchSocket(io: SocketIOServer, socket: Socket) {
  const user = getAuthenticatedUser(socket);
  socket.join(`user:${user.userId}`);

  // 1. Join matchmaking queue
  socket.on('coinflip:queue-quick-match', async (data: { stake: number; choice: 'HEADS' | 'TAILS' }) => {
    try {
      const { stake = 100, choice = 'HEADS' } = data;
      const res = await CoinFlipMatchService.queueQuickMatch(user.userId, user.username, stake, choice);

      if (res.matched && res.room) {
        const room = res.room;
        socket.join(`cf-room:${room.id}`);

        // Broadcast to both matched players
        io.to(`user:${room.playerOne.userId}`).emit('coinflip:matched', room);
        io.to(`user:${room.playerTwo?.userId}`).emit('coinflip:matched', room);

        // Run synchronized countdown (3... 2... 1... FLIP)
        let count = 3;
        const countdownTimer = setInterval(async () => {
          count -= 1;
          room.countdown = count;
          io.to(`cf-room:${room.id}`).emit('coinflip:countdown', { countdown: count, roomId: room.id });

          if (count <= 0) {
            clearInterval(countdownTimer);
            room.status = 'FLIPPING';
            io.to(`cf-room:${room.id}`).emit('coinflip:flipping', { roomId: room.id });

            // Resolve server-authoritative outcome after 1.2s spin
            setTimeout(async () => {
              const resolved = await CoinFlipMatchService.resolveMatch(room.id);
              io.to(`cf-room:${room.id}`).emit('coinflip:resolved', resolved);
            }, 1200);
          }
        }, 1000);
      } else {
        socket.emit('coinflip:queued', { stake, status: 'WAITING_FOR_OPPONENT' });
      }
    } catch (err: any) {
      socket.emit('coinflip:error', { message: err.message || 'Quick match failed' });
    }
  });

  // 2. Cancel quick match
  socket.on('coinflip:leave-queue', () => {
    CoinFlipMatchService.leaveQuickMatch(user.userId);
    socket.emit('coinflip:queue-left');
  });

  // 3. Join room socket channel
  socket.on('coinflip:join-room-channel', (data: { roomId: string }) => {
    socket.join(`cf-room:${data.roomId}`);
    const room = CoinFlipMatchService.getRoom(data.roomId);
    if (room) {
      socket.emit('coinflip:room-state', room);
    }
  });

  // 4. Accept / Ready up private room
  socket.on('coinflip:player-ready', async (data: { roomId: string }) => {
    const room = CoinFlipMatchService.getRoom(data.roomId);
    if (!room || !room.playerTwo) return;

    room.status = 'COUNTDOWN';
    io.to(`cf-room:${room.id}`).emit('coinflip:countdown-started', room);

    let count = 3;
    const countdownTimer = setInterval(async () => {
      count -= 1;
      room.countdown = count;
      io.to(`cf-room:${room.id}`).emit('coinflip:countdown', { countdown: count, roomId: room.id });

      if (count <= 0) {
        clearInterval(countdownTimer);
        room.status = 'FLIPPING';
        io.to(`cf-room:${room.id}`).emit('coinflip:flipping', { roomId: room.id });

        setTimeout(async () => {
          const resolved = await CoinFlipMatchService.resolveMatch(room.id);
          io.to(`cf-room:${room.id}`).emit('coinflip:resolved', resolved);
        }, 1200);
      }
    }, 1000);
  });
}
