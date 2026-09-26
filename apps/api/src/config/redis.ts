import { logger } from '@nova/logger';

// Lightweight memory/redis cache provider abstraction for monorepo scalability
export class CacheService {
  private static store: Map<string, string> = new Map();

  static async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  static async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => this.store.delete(key), ttlSeconds * 1000);
    }
  }

  static async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}
