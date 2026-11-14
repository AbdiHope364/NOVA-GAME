import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { config } from '../config/env.js';
import { createRedisClient, getRedisClient } from '../config/redis.js';
import { CrashLeaderElection } from '../services/crashLeader.js';
import { CrashRunner } from '../services/crashRunner.js';
import { registerDamaMatchSocket } from './damaMatchSocket.js';
import { registerLettiMatchSocket } from './lettiMatchSocket.js';
import { registerChessMatchSocket } from './chessMatchSocket.js';
import { registerLudoMatchSocket } from './ludoMatchSocket.js';
import { registerCoinFlipMatchSocket } from './coinFlipMatchSocket.js';
import { registerTicTacToeSocket } from './ticTacToeSocket.js';
import { metrics } from '../services/metrics.service.js';
import { logger } from '@nova/logger';
import { AuthServiceLogic } from '@nova/auth';
import { prisma } from '../config/database.js';

let ioInstance: SocketIOServer | null = null;
const onlineUserSockets = new Map<string, Set<string>>();

export function isUserOnline(userId: string): boolean {
  const set = onlineUserSockets.get(userId);
  return Boolean(set && set.size > 0);
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUserSockets.keys());
}

export function emitToUser(userId: string, event: string, payload: any) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

export function emitWalletUpdate(
  userId: string,
  payload: { balance?: number; type: string; status: string; amount: number; message?: string }
) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit('WALLET_UPDATED', { userId, ...payload });
}

export function initWebSocket(server: HttpServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (config.isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for WebSocket: Origin ${origin} not allowed`));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Keep HTTP long-polling fallback enabled for unstable/restricted mobile carriers (Ethiopia 3G/LTE)
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000, // 60s accommodates mobile network packet drops
    connectTimeout: 45000,
    allowUpgrades: true,
  });

  // Attach Redis Adapter for horizontal scalability across multiple API instances
  try {
    const mainRedis = getRedisClient();
    if (mainRedis) {
      const pubClient = createRedisClient();
      const subClient = pubClient.duplicate();

      pubClient.on('error', () => {});
      subClient.on('error', () => {});

      pubClient
        .connect()
        .then(async () => {
          await subClient.connect();
          io.adapter(createAdapter(pubClient, subClient));
          logger.info('📡 Socket.IO Redis Adapter initialized successfully for multi-instance scaling');
        })
        .catch(() => {
          logger.info('ℹ️  Running Socket.IO in in-memory single-node mode');
        });
    } else {
      logger.info('ℹ️  Redis not configured; running Socket.IO in in-memory single-node mode');
    }
  } catch (err: any) {
    logger.warn(`Failed to initialize Socket.IO Redis adapter: ${err.message}`);
  }

  // Start distributed leader election for the continuous Aviator crash loop
  ioInstance = io;
  CrashLeaderElection.init(io);

  // Handshake authentication middleware
  io.use((socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization
          ? String(socket.handshake.headers.authorization).replace(/^Bearer\s+/i, '')
          : null);

      if (rawToken && rawToken !== 'demo-guest-token') {
        const decoded = AuthServiceLogic.verifyToken(rawToken, config.jwtSecret);
        if (decoded?.userId) {
          socket.data.userId = decoded.userId;
          socket.data.authenticated = true;
        }
      }
    } catch {
      // In guest/demo mode, connection continues with unauthenticated state
      socket.data.authenticated = false;
    }
    next();
  });

  io.on('connection', (socket) => {
    metrics.incrementSockets();

    const bindPresence = (userId: string) => {
      socket.join(`user:${userId}`);
      socket.data.presenceUserId = userId;
      if (!onlineUserSockets.has(userId)) {
        onlineUserSockets.set(userId, new Set());
        io.emit('social:presence-changed', { userId, online: true });
      }
      onlineUserSockets.get(userId)!.add(socket.id);
      prisma.user
        .updateMany({ where: { id: userId }, data: { lastActiveAt: new Date() } })
        .catch(() => {});
    };

    // Auto-join user room if valid JWT provided for instant wallet & social notifications
    try {
      const rawToken = socket.handshake.auth?.token;
      if (rawToken && rawToken !== 'demo-guest-token') {
        const decoded = AuthServiceLogic.verifyToken(rawToken, config.jwtSecret);
        if (decoded?.userId) {
          bindPresence(decoded.userId);
        }
      }
    } catch {
      // ignore invalid/expired token on socket handshake
    }

    socket.on('WALLET_SUBSCRIBE', (data: { token?: string }) => {
      try {
        if (data?.token && data.token !== 'demo-guest-token') {
          const decoded = AuthServiceLogic.verifyToken(data.token, config.jwtSecret);
          if (decoded?.userId) {
            bindPresence(decoded.userId);
          }
        }
      } catch {}
    });

    // Register Dama, Letti, Chess & Ludo multiplayer match event handlers
    registerDamaMatchSocket(io, socket);
    registerLettiMatchSocket(io, socket);
    registerChessMatchSocket(io, socket);
    registerLudoMatchSocket(io, socket);
    registerCoinFlipMatchSocket(io, socket);
    registerTicTacToeSocket(io, socket);

    // Send initial live crash state immediately on connection
    socket.emit('CRASH_STATE', CrashRunner.getPublicState());
    socket.emit('ADMIN_CRASH_TELEMETRY', CrashRunner.getPublicState());

    socket.on('CRASH_PLACE_BET', (data) => {
      CrashRunner.handlePlaceBet(socket, data);
    });

    socket.on('CRASH_QUEUE_BET', (data) => {
      CrashRunner.handleQueueBet(socket, data);
    });

    socket.on('CRASH_CANCEL_BET', () => {
      CrashRunner.handleCancelBet(socket);
    });

    socket.on('CRASH_MANUAL_CASHOUT', () => {
      CrashRunner.handleManualCashout(socket);
    });

    socket.on('disconnect', () => {
      metrics.decrementSockets();
      const uid = socket.data?.presenceUserId as string | undefined;
      if (uid) {
        const set = onlineUserSockets.get(uid);
        if (set) {
          set.delete(socket.id);
          if (set.size === 0) {
            onlineUserSockets.delete(uid);
            io.emit('social:presence-changed', { userId: uid, online: false });
          }
        }
      }
    });
  });

  return io;
}
