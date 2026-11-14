import { Redis } from 'ioredis';
import { config } from './env.js';
import { logger } from '@nova/logger';

let redisInstance: Redis | null = null;
let isConnected = false;
let connectionAttemptFailed = false;

export function getRedisClient(): Redis | null {
  if (!config.redisUrl) return null;
  if (connectionAttemptFailed && !config.isProduction) {
    return null;
  }
  if (!redisInstance) {
    try {
      redisInstance = new Redis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        connectTimeout: 2000,
        retryStrategy(times) {
          if (!config.isProduction && times > 2) {
            connectionAttemptFailed = true;
            logger.info('ℹ️  Redis not reachable in development; falling back to in-memory mode');
            return null; // Stop retrying in dev
          }
          return Math.min(times * 500, 3000);
        },
        lazyConnect: true,
      });

      redisInstance.on('connect', () => {
        isConnected = true;
        connectionAttemptFailed = false;
        logger.info('[Redis] Successfully connected to Redis instance');
      });

      redisInstance.on('ready', () => {
        isConnected = true;
      });

      redisInstance.on('error', (err) => {
        isConnected = false;
        if (config.isProduction) {
          logger.warn(`[Redis Connection Warning]: ${err.message}`);
        }
      });

      redisInstance.on('close', () => {
        isConnected = false;
      });

      redisInstance.connect().catch(() => {
        if (!config.isProduction) {
          connectionAttemptFailed = true;
        }
      });
    } catch {
      return null;
    }
  }
  return connectionAttemptFailed ? null : redisInstance;
}

export function createRedisClient(): Redis {
  const client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (!config.isProduction && times > 2) return null;
      return Math.min(times * 500, 3000);
    },
    lazyConnect: true,
  });

  // Always attach an error listener to prevent uncaught EventEmitter errors
  client.on('error', (err) => {
    if (config.isProduction) {
      logger.warn(`[Redis Client Warning]: ${err.message}`);
    }
  });

  return client;
}

export async function isRedisHealthy(): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !isConnected) return false;
  try {
    const res = await client.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}

export const redisClient = getRedisClient();
