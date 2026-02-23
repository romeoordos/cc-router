import { EventEmitter } from 'events';
import {
  RequestMetric,
  ModelStats,
  MetricsState,
  MetricsEventType,
  MAX_MODELS,
  MAX_RECENT_REQUESTS,
} from './types';

export class MetricsCollector extends EventEmitter {
  private requests: RequestMetric[] = [];
  private modelOrder: string[] = []; // LRU tracking for models
  private totalRequests = 0;
  private errorCount = 0;
  private readonly serverStartTime = new Date();

  constructor() {
    super();
  }

  /**
   * Record a new request metric
   */
  recordRequest(metric: RequestMetric): void {
    // Add to requests array with rolling window
    this.requests.push(metric);
    if (this.requests.length > MAX_RECENT_REQUESTS) {
      this.requests.shift();
    }

    // Update counters
    this.totalRequests++;
    if (metric.status === 'error') {
      this.errorCount++;
    }

    // Update LRU order for models
    this.updateModelLRU(metric.model);

    // Emit event for subscribers
    this.emit('request:recorded', metric);
    this.emit('state:updated', this.getState());
  }

  /**
   * Update LRU tracking for a model
   */
  private updateModelLRU(model: string): void {
    // Remove if exists
    const index = this.modelOrder.indexOf(model);
    if (index !== -1) {
      this.modelOrder.splice(index, 1);
    }
    // Add to front (most recently used)
    this.modelOrder.unshift(model);

    // Evict oldest if over limit
    while (this.modelOrder.length > MAX_MODELS) {
      this.modelOrder.pop();
    }
  }

  /**
   * Get aggregated statistics per model
   */
  getStats(): Map<string, ModelStats> {
    const statsMap = new Map<string, ModelStats>();

    // Only include models that are in the LRU list
    const activeModels = new Set(this.modelOrder);

    for (const metric of this.requests) {
      // Skip unknown models from statistics
      if (metric.model === 'unknown') continue;
      if (!activeModels.has(metric.model)) continue;

      const existing = statsMap.get(metric.model);
      if (existing) {
        existing.requestCount++;
        existing.totalInputTokens += metric.inputTokens;
        existing.totalOutputTokens += metric.outputTokens;
        existing.meanLatencyMs =
          (existing.meanLatencyMs * (existing.requestCount - 1) + metric.latencyMs) /
          existing.requestCount;
        existing.avgTokensPerSecond =
          (existing.avgTokensPerSecond * (existing.requestCount - 1) + metric.tokensPerSecond) /
          existing.requestCount;
      } else {
        statsMap.set(metric.model, {
          model: metric.model,
          requestCount: 1,
          meanLatencyMs: metric.latencyMs,
          totalInputTokens: metric.inputTokens,
          totalOutputTokens: metric.outputTokens,
          avgTokensPerSecond: metric.tokensPerSecond,
        });
      }
    }

    return statsMap;
  }

  /**
   * Get recent requests (most recent first)
   */
  getRecentRequests(limit: number = 50): RequestMetric[] {
    return this.requests.slice(-limit).reverse();
  }

  /**
   * Get full metrics state for TUI
   */
  getState(): MetricsState {
    return {
      requests: this.getRecentRequests(50),
      stats: this.getStats(),
      serverStartTime: this.serverStartTime,
      totalRequests: this.totalRequests,
      errorCount: this.errorCount,
    };
  }

  /**
   * Get server uptime in milliseconds
   */
  getUptimeMs(): number {
    return Date.now() - this.serverStartTime.getTime();
  }

  /**
   * Get total request count
   */
  getTotalRequests(): number {
    return this.totalRequests;
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();
