import crypto from 'crypto';
import { Server as SocketIOServer } from 'socket.io';
import { getRedisClient } from '../config/redis.js';
import { CrashRunner } from './crashRunner.js';
import { config } from '../config/env.js';
import { logger } from '@nova/logger';

export class CrashLeaderElection {
  private static instanceId = crypto.randomUUID();
  private static isLeader = false;
  private static heartbeatTimer: NodeJS.Timeout | null = null;
  private static io: SocketIOServer | null = null;
  private static readonly LOCK_KEY = 'lock:crash_runner_leader';
  private static readonly LOCK_TTL_MS = 6000;
  private static readonly HEARTBEAT_INTERVAL_MS = 2000;

  public static init(io: SocketIOServer) {
    this.io = io;
    this.startElectionLoop();
  }

  private static becomeStandaloneLeader(reason: string) {
    if (this.isLeader) return;
    logger.info(`[CrashLeader] ${reason}, running as standalone local crash runner`);
    this.isLeader = true;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    CrashRunner.init(this.io!);
  }

  public static async startElectionLoop() {
    const redis = getRedisClient();
    if (!redis) {
      this.becomeStandaloneLeader('Redis not configured or offline');
      return;
    }

    // Attempt initial election immediately
    await this.tryAcquireOrRenewLeadership();

    // If still not standalone leader, maintain heartbeat loop
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(async () => {
        await this.tryAcquireOrRenewLeadership();
      }, this.HEARTBEAT_INTERVAL_MS);
    }
  }

  private static async tryAcquireOrRenewLeadership() {
    const redis = getRedisClient();
    if (!redis) {
      if (!this.isLeader) {
        this.becomeStandaloneLeader('Redis offline');
      }
      return;
    }

    try {
      if (this.isLeader) {
        // Renew lock if we still own it using Lua script
        const renewScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("pexpire", KEYS[1], ARGV[2])
          else
            return 0
          end
        `;
        const result = await redis.eval(renewScript, 1, this.LOCK_KEY, this.instanceId, this.LOCK_TTL_MS);
        if (result !== 1) {
          logger.warn(`[CrashLeader] Lost leadership lock for crash runner (Instance: ${this.instanceId})`);
          this.isLeader = false;
        }
      } else {
        // Attempt to acquire lock
        const acquired = await redis.set(this.LOCK_KEY, this.instanceId, 'PX', this.LOCK_TTL_MS, 'NX');
        if (acquired === 'OK') {
          this.isLeader = true;
          logger.info(`[CrashLeader] Elected as active leader for crash runner (Instance: ${this.instanceId})`);
          CrashRunner.init(this.io!);
        }
      }
    } catch (err: any) {
      logger.warn(`[CrashLeader] Error during leader election check: ${err.message}`);
      if (!this.isLeader) {
        this.becomeStandaloneLeader('Redis unreachable, running standalone');
      }
    }
  }

  public static stop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.isLeader) {
      const redis = getRedisClient();
      if (redis) {
        const releaseScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        redis.eval(releaseScript, 1, this.LOCK_KEY, this.instanceId).catch(() => {});
      }
      this.isLeader = false;
    }
  }
}
