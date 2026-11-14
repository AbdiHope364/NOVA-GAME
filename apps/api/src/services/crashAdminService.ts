import { CrashRunner } from './crashRunner.js';

export class CrashAdminService {
  /**
   * Returns current monitor telemetry for Admin Panel.
   * NOTE: In compliance with Provably Fair standards, upcoming crash targets
   * are NEVER exposed before or during rounds to prevent insider abuse.
   */
  static getMonitorData() {
    return CrashRunner.getAdminTelemetry();
  }

  /**
   * Safely pauses the crash engine and issues 100% wager refunds
   * to all active uncashed players. Does NOT manipulate outcomes.
   */
  static async pauseCrashEngine(reason?: string) {
    return CrashRunner.pause(reason || 'Admin Emergency Maintenance');
  }

  /**
   * Resumes the continuous round loop from a clean betting phase.
   */
  static resumeCrashEngine() {
    return CrashRunner.resume();
  }
}
