import http from 'http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { setupWebSocket } from './websocket/socket.js';
import { logger } from '@nova/logger';

async function startServer() {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  setupWebSocket(server);

  server.listen(config.port, () => {
    logger.info(`🚀 NOVA-GAME API Server listening on port ${config.port} [${config.env}]`);
  });
}

startServer().catch((err) => {
  logger.error('Fatal Server Startup Error', err);
  process.exit(1);
});
