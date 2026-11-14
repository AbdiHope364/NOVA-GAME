import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { prisma } from './config/database.js';
import { isRedisHealthy } from './config/redis.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { geoBlockMiddleware } from './middleware/geoBlock.js';
import { authLimiter, walletLimiter, gameLimiter } from './middleware/rateLimiter.js';
import { metrics } from './services/metrics.service.js';
import authRoutes from './routes/auth.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import gamesRoutes from './routes/games.routes.js';
import adminRoutes from './routes/admin.routes.js';
import promotionsRoutes from './routes/promotions.routes.js';
import lettiMatchRoutes from './routes/lettiMatch.routes.js';
import chessMatchRoutes from './routes/chessMatch.routes.js';
import ludoMatchRoutes from './routes/ludoMatch.routes.js';
import coinFlipMatchRoutes from './routes/coinFlipMatch.routes.js';
import ticTacToeRoutes from './routes/ticTacToe.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import socialRoutes from './routes/social.routes.js';
import engagementRoutes from './routes/engagement.routes.js';
import { matchRoutes } from './routes/match.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Trust first proxy hop (Caddy / Nginx / Cloudflare) to extract accurate client IP and HTTPS protocol
  app.set('trust proxy', 1);

  // Request correlation tracking and latency recording
  app.use(requestIdMiddleware);
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      metrics.recordRequest(Date.now() - startTime);
    });
    next();
  });

  // Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed at Caddy / Reverse Proxy layer
      crossOriginEmbedderPolicy: false,
    })
  );

  // Strict CORS: Allow only configured WEB_ORIGIN and ADMIN_ORIGIN (no wildcard in production)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (config.isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked: Origin ${origin} is not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'CF-IPCountry', 'X-Country-Code'],
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  // Probes: Liveness & Readiness
  app.get(['/health', '/healthz'], (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get(['/ready', '/readyz'], async (req, res) => {
    try {
      // 1. Verify Database connectivity
      await prisma.$queryRawUnsafe('SELECT 1;');
      const dbHealthy = true;

      // 2. Verify Redis connectivity
      const redisHealthy = await isRedisHealthy();

      if (dbHealthy && (redisHealthy || !config.isProduction)) {
        return res.json({
          status: 'ready',
          database: 'connected',
          redis: redisHealthy ? 'connected' : 'optional_in_dev',
          timestamp: new Date().toISOString(),
        });
      } else {
        return res.status(503).json({
          status: 'not_ready',
          database: dbHealthy ? 'connected' : 'disconnected',
          redis: redisHealthy ? 'connected' : 'disconnected',
        });
      }
    } catch (err: any) {
      return res.status(503).json({
        status: 'not_ready',
        error: err.message || 'Service dependency check failed',
      });
    }
  });

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    const snapshot = await metrics.getSnapshot();
    res.json(snapshot);
  });

  // API Route Registration with security and rate limiting
  app.use('/api/v1/auth', authLimiter, geoBlockMiddleware, authRoutes);
  app.use('/api/v1/wallet', walletLimiter, geoBlockMiddleware, walletRoutes);
  app.use('/api/v1/games', gameLimiter, gamesRoutes);
  app.use('/api/v1/letti-pvp', gameLimiter, geoBlockMiddleware, lettiMatchRoutes);
  app.use('/api/v1/coin-flip-pvp', gameLimiter, geoBlockMiddleware, coinFlipMatchRoutes);
  app.use('/api/v1/games/tic-tac-toe', gameLimiter, geoBlockMiddleware, ticTacToeRoutes);
  app.use('/api/v1/chess', gameLimiter, geoBlockMiddleware, chessMatchRoutes);
  app.use('/api/v1/ludo', gameLimiter, geoBlockMiddleware, ludoMatchRoutes);
  app.use('/api/v1/promotions', gameLimiter, geoBlockMiddleware, promotionsRoutes);
  app.use('/api/v1/dashboard', gameLimiter, geoBlockMiddleware, dashboardRoutes);
  app.use('/api/v1/social', gameLimiter, geoBlockMiddleware, socialRoutes);
  app.use('/api/v1/engagement', gameLimiter, geoBlockMiddleware, engagementRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/matches', gameLimiter, geoBlockMiddleware, matchRoutes);
  app.use('/matches', gameLimiter, geoBlockMiddleware, matchRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
