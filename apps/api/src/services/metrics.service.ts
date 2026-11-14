import { prisma } from '../config/database.js';

class MetricsTracker {
  private activeSocketsCount = 0;
  private totalRequests = 0;
  private requestDurationsMs: number[] = [];
  private readonly maxSamples = 500;

  public incrementSockets() {
    this.activeSocketsCount++;
  }

  public decrementSockets() {
    this.activeSocketsCount = Math.max(0, this.activeSocketsCount - 1);
  }

  public getActiveSockets(): number {
    return this.activeSocketsCount;
  }

  public recordRequest(durationMs: number) {
    this.totalRequests++;
    this.requestDurationsMs.push(durationMs);
    if (this.requestDurationsMs.length > this.maxSamples) {
      this.requestDurationsMs.shift();
    }
  }

  public async getSnapshot() {
    const activeMatchesCount = await prisma.match
      .count({
        where: { status: 'ACTIVE' },
      })
      .catch(() => 0);

    const sorted = [...this.requestDurationsMs].sort((a, b) => a - b);
    const avgLatency =
      sorted.length > 0 ? (sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2) : 0;
    const p95Latency =
      sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)]?.toFixed(2) : 0;

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: (process.memoryUsage().rss / 1024 / 1024).toFixed(1),
      activeSockets: this.activeSocketsCount,
      activeMatches: activeMatchesCount,
      totalRequests: this.totalRequests,
      avgLatencyMs: Number(avgLatency),
      p95LatencyMs: Number(p95Latency),
    };
  }
}

export const metrics = new MetricsTracker();

