import dotenv from 'dotenv';
import path from 'path';

// Load .env from current dir and root dir
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Set default fallback for development if DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://nova:nova123@localhost:5432/nova_gaming?schema=public';
}

export const config = {
  port: Number(process.env.PORT || 5000),
  env: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  webUrl: process.env.WEB_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-nova-gaming-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  houseEdgePercent: Number(process.env.HOUSE_EDGE_PERCENT || 1.0),
  databaseUrl: process.env.DATABASE_URL,
};
