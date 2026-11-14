import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from workspace and root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required').default('redis://localhost:6379'),
  JWT_SECRET: z
    .string()
    .min(1, 'JWT_SECRET is required')
    .refine(
      (val) => process.env.NODE_ENV !== 'production' || val.length >= 32,
      {
        message:
          'JWT_SECRET must be at least 32 characters long in production for cryptographically secure signing',
      }
    ),
  JWT_EXPIRES_IN: z.string().default('7d'),
  WEB_ORIGIN: z.string().min(1, 'WEB_ORIGIN is required (e.g. http://localhost:3000 or https://novagame.et)').default('http://localhost:3000'),
  ADMIN_ORIGIN: z.string().min(1, 'ADMIN_ORIGIN is required (e.g. http://localhost:3001 or https://admin.novagame.et)').default('http://localhost:3001'),
  HOUSE_EDGE_PERCENT: z.coerce.number().min(0).max(10).default(1.0),
  GEO_ALLOWED_COUNTRIES: z.string().optional().default(''), // Comma-separated ISO codes e.g. "ET", or empty for all
  SENTRY_DSN: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ CRITICAL CONFIGURATION ERROR: Invalid environment variables:');
  for (const issue of parseResult.error.issues) {
    console.error(`  - [${issue.path.join('.')}] ${issue.message}`);
  }
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Fallback to parsed or defaults
const validatedEnv = parseResult.success
  ? parseResult.data
  : {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      PORT: Number(process.env.PORT) || 5000,
      HOST: process.env.HOST || '0.0.0.0',
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-nova-gaming-2026-min-32-chars-long',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      WEB_ORIGIN: process.env.WEB_ORIGIN || 'http://localhost:3000',
      ADMIN_ORIGIN: process.env.ADMIN_ORIGIN || 'http://localhost:3001',
      HOUSE_EDGE_PERCENT: Number(process.env.HOUSE_EDGE_PERCENT) || 1.0,
      GEO_ALLOWED_COUNTRIES: process.env.GEO_ALLOWED_COUNTRIES || '',
      SENTRY_DSN: process.env.SENTRY_DSN,
    };

export const config = {
  env: validatedEnv.NODE_ENV,
  isProduction: validatedEnv.NODE_ENV === 'production',
  port: validatedEnv.PORT,
  host: validatedEnv.HOST,
  databaseUrl: validatedEnv.DATABASE_URL,
  redisUrl: validatedEnv.REDIS_URL,
  jwtSecret: validatedEnv.JWT_SECRET,
  jwtExpiresIn: validatedEnv.JWT_EXPIRES_IN,
  webOrigin: validatedEnv.WEB_ORIGIN,
  adminOrigin: validatedEnv.ADMIN_ORIGIN,
  houseEdgePercent: validatedEnv.HOUSE_EDGE_PERCENT,
  geoAllowedCountries: validatedEnv.GEO_ALLOWED_COUNTRIES
    ? validatedEnv.GEO_ALLOWED_COUNTRIES.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
    : [],
  sentryDsn: validatedEnv.SENTRY_DSN,
  // Helper to test if an origin is allowed by CORS
  isAllowedOrigin(origin?: string): boolean {
    if (!origin) return true; // Mobile apps, curl, or same-origin requests
    if (validatedEnv.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return true;
    }
    const origins = [validatedEnv.WEB_ORIGIN, validatedEnv.ADMIN_ORIGIN];
    return origins.includes(origin);
  },
};
