import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import gamesRoutes from './routes/games.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { i18nMiddleware } from './middleware/i18n.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: '*' }));
  app.use(express.json());
  app.use(i18nMiddleware);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Route Registration
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/wallet', walletRoutes);
  app.use('/api/v1/games', gamesRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

