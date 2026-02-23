// Maximum number of models to track in stats (LRU eviction)
export const MAX_MODELS = 20;

// Maximum number of recent requests to keep in memory
export const MAX_RECENT_REQUESTS = 1000;

// Single request record
export interface RequestMetric {
  id: string;              // UUID
  timestamp: Date;
  model: string;           // e.g., "glm-4.7-flash"
  originalModel: string;   // e.g., "claude-3-5-haiku"
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  tokensPerSecond: number;
  status: 'success' | 'error';
  errorMessage?: string;
  agentType?: string;      // Optional: detected agent type
  routingReason?: string;  // Optional: routing decision reason
}

// Aggregated statistics (computed from RequestMetric[])
export interface ModelStats {
  model: string;
  requestCount: number;
  meanLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgTokensPerSecond: number;
}

// TUI state shape
export interface MetricsState {
  requests: RequestMetric[];      // Last N requests (configurable)
  stats: Map<string, ModelStats>; // Per-model aggregates (max 20 models)
  serverStartTime: Date;
  totalRequests: number;
  errorCount: number;
}

// Event types for the collector
export type MetricsEventType = 'request:recorded' | 'state:updated';

export interface MetricsEvent {
  type: MetricsEventType;
  payload: RequestMetric | MetricsState;
}
