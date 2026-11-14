import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initWebSocket } from './websocket/socket.js';

dotenv.config();

const app = createApp();
const server = http.createServer(app);
initWebSocket(server);

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `❌ Port ${PORT} is already in use. Stop the process using port ${PORT} (e.g. "lsof -ti:${PORT} | xargs kill -9") or set a different PORT in .env.`
    );
    process.exit(1);
  }
  console.error('❌ API server error:', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 API Authoritative Game Server running on http://${HOST}:${PORT}`);
});
