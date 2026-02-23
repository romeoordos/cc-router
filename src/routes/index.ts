import { getConfig } from "../config";
import { metricsCollector } from "../metrics/collector";
import { RequestMetric } from "../metrics/types";
import { detectAgentType, AgentType } from "../agent-detection";

export interface RouteHandler {
  (request: Request): Promise<Response> | Response;
}

export interface Routes {
  [key: string]: {
    [method: string]: RouteHandler;
  };
}

// Helper function to create JSON responses
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

import { encoding_for_model, Tiktoken } from "tiktoken";

// Cache the encoding to avoid re-initialization
let encoding: Tiktoken | null = null;

function getEncoding(): Tiktoken {
  if (!encoding) {
    encoding = encoding_for_model("gpt-4");
  }
  return encoding;
}

function isTopicSummarizer(system?: Array<{ type: string; text: string }> | string): boolean {
  if (!system) return false;
  // Handle string case
  if (typeof system === 'string') {
    return system.includes("Analyze if this message indicates a new conversation topic");
  }
  return system.some((item) => item.type === "text" && item.text.includes("Analyze if this message indicates a new conversation topic"));
}

// Generate a simple UUID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper to estimate input tokens from messages
function estimateInputTokens(messages: unknown[]): number {
  if (!Array.isArray(messages)) return 0;
  const text = JSON.stringify(messages);
  const enc = getEncoding();
  return enc.encode(text).length;
}

// Helper to extract output tokens from response
function extractOutputTokens(responseBody: string): number {
  try {
    const json = JSON.parse(responseBody);
    // Anthropic-style response
    if (json.usage?.output_tokens) {
      return json.usage.output_tokens;
    }
    // Fallback: estimate from response length
    return Math.floor(responseBody.length / 4);
  } catch {
    return Math.floor(responseBody.length / 4);
  }
}

interface RoutingDecision {
  modelName: string;
  routingReason: 'agent' | 'orchestrator' | 'topic-summarizer';
  agentType?: AgentType;
}

function determineRouting(
  originalModel: string,
  system?: Array<{ type: string; text: string }> | string,
  messages?: Array<{ role?: string; content?: unknown }>,
  agentModelMap?: Record<string, string>,
  orchestratorModelMap?: Record<string, string>
): RoutingDecision {
  // Priority 1: Topic summarizer (special case, preserved)
  if (isTopicSummarizer(system)) {
    if (!orchestratorModelMap?.['haiku']) {
      throw new Error('Config error: orchestratorModelMap.haiku is not defined');
    }
    return {
      modelName: orchestratorModelMap['haiku'],
      routingReason: 'topic-summarizer',
    };
  }

  // Priority 2: Agent-specific routing (detects from SubagentStart hook in messages)
  const agentType = detectAgentType(system, messages);
  if (agentType && agentModelMap?.[agentType]) {
    return {
      modelName: agentModelMap[agentType],
      routingReason: 'agent',
      agentType,
    };
  }

  // Priority 3: Orchestrator defaults (haiku/sonnet/opus)
  const modelLower = originalModel.toLowerCase();
  if (modelLower.includes('haiku') && orchestratorModelMap?.['haiku']) {
    return {
      modelName: orchestratorModelMap['haiku'],
      routingReason: 'orchestrator',
    };
  }
  if (modelLower.includes('sonnet') && orchestratorModelMap?.['sonnet']) {
    return {
      modelName: orchestratorModelMap['sonnet'],
      routingReason: 'orchestrator',
    };
  }
  if (modelLower.includes('opus') && orchestratorModelMap?.['opus']) {
    return {
      modelName: orchestratorModelMap['opus'],
      routingReason: 'orchestrator',
    };
  }

  // Priority 4: Fallback - throw descriptive error with full routing context
  const context = [
    `model=${originalModel}`,
    `agentDetectionAttempted=${agentType ? 'yes' : 'no'}`,
    `agentDetected=${agentType || 'none'}`,
    `orchestratorHaiku=${orchestratorModelMap?.['haiku'] || 'missing'}`,
    `orchestratorSonnet=${orchestratorModelMap?.['sonnet'] || 'missing'}`,
    `orchestratorOpus=${orchestratorModelMap?.['opus'] || 'missing'}`,
  ].join(', ');
  throw new Error(`Unknown model: ${originalModel} (${context})`);
}

// Messages endpoint handler
async function messagesHandler(request: Request): Promise<Response> {
  const startTime = Date.now();
  let originalModel = '';
  let modelName = '';
  let inputTokens = 0;

  try {
    const body = await request.json();
    const messages = body.messages;
    originalModel = body.model;
    const system = body.system;

    const routing = determineRouting(
      originalModel,
      system,
      messages,
      getConfig().agentModelMap as Record<string, string>,
      getConfig().orchestratorModelMap as Record<string, string>
    );

    modelName = routing.modelName;

    // Estimate input tokens
    inputTokens = estimateInputTokens(messages);

    const currentConfig = getConfig();
    const modelConfig = currentConfig.models[modelName];
    const modelUrl = modelConfig.url;

    // Use apiKey from config, or fall back to Authorization header from request
    const requestAuth = request.headers.get('Authorization') ?? '';
    const modelApiKey = modelConfig.apiKey || requestAuth.replace(/^Bearer\s+/i, '');

    body.model = modelName;

    // Fix thinking.type: "adaptive" -> "enabled" for compatibility
    if (body.thinking && body.thinking.type === 'adaptive' && (!modelName.includes('claude'))) {
      body.thinking.type = 'enabled';
    }

    // Fix openrouter request. Openrouter does not like user_id length more then 128 characters
    if (modelUrl.includes('openrouter')) {
      delete body.metadata?.user_id;
    }

    // Construct forward URL
    const forwardUrl = new URL(modelUrl);
    const requestUrl = new URL(request.url);
    forwardUrl.pathname = forwardUrl.pathname.replace(/\/$/, '') + requestUrl.pathname;
    forwardUrl.search = requestUrl.search;

    // Prepare headers
    const forwardHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
        if (key.toLowerCase() === 'host' || key.toLowerCase() === 'authorization' || key.toLowerCase() === 'accept-encoding') {
            continue;
        }
        forwardHeaders.append(key, value);
    }
    forwardHeaders.set('Authorization', `Bearer ${modelApiKey}`);

    // Execute forward request
    const forwardResponse = await fetch(forwardUrl.toString(), {
        method: request.method,
        headers: forwardHeaders,
        body: JSON.stringify(body),
    });

    // Clone response for metrics extraction
    const clonedResponse = forwardResponse.clone();
    const responseBody = await clonedResponse.text();
    const outputTokens = extractOutputTokens(responseBody);

    // Calculate latency
    const latencyMs = Date.now() - startTime;
    const tokensPerSecond = outputTokens > 0 && latencyMs > 0
      ? (outputTokens / latencyMs) * 1000
      : 0;

    // Record metrics
    const metric: RequestMetric = {
      id: generateId(),
      timestamp: new Date(),
      model: modelName,
      originalModel: originalModel,
      inputTokens,
      outputTokens,
      latencyMs,
      tokensPerSecond,
      status: 'success',
      agentType: routing.agentType,
      routingReason: routing.routingReason,
    };
    metricsCollector.recordRequest(metric);

    // Handle potential compression issues from upstream
    const contentEncoding = forwardResponse.headers.get('content-encoding');
    if (contentEncoding) {
        const decompressedJson = JSON.parse(responseBody);
        const responseHeaders = new Headers(forwardResponse.headers);
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');
        return new Response(JSON.stringify(decompressedJson), {
            status: forwardResponse.status,
            statusText: forwardResponse.statusText,
            headers: responseHeaders,
        });
    }

    return forwardResponse;
  } catch (error) {
    // Record error metric
    const latencyMs = Date.now() - startTime;
    const metric: RequestMetric = {
      id: generateId(),
      timestamp: new Date(),
      model: modelName || 'unknown',
      originalModel: originalModel || 'unknown',
      inputTokens,
      outputTokens: 0,
      latencyMs,
      tokensPerSecond: 0,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
    metricsCollector.recordRequest(metric);

    console.error('Error in messages handler:', error);
    if (error instanceof SyntaxError) {
        return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

// Count tokens endpoint handler
async function countTokensHandler(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const text = JSON.stringify(body);
    const enc = getEncoding();
    const tokens = enc.encode(text);
    const length = tokens.length;
    return jsonResponse({
      tokens: length,
    }, 200);
  } catch {
    return jsonResponse(
      { error: "Invalid JSON body" },
      400
    );
  }
}

// 404 handler
function notFoundHandler(request: Request): Response {
  return jsonResponse(
    { error: "Not Found", path: new URL(request.url).pathname },
    404
  );
}

// Health check endpoint handler
function healthHandler(_request: Request): Response {
  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }, 200);
}

// Route definitions
const routes: Routes = {
  "/v1/messages": {
    POST: messagesHandler,
  },
  "/v1/messages/count_tokens": {
    POST: countTokensHandler,
  },
  "/health": {
    GET: healthHandler,
  },
};

// Router function to match requests to handlers
export function router(request: Request): Promise<Response> | Response {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // Check if route exists
  const route = routes[pathname];
  if (route && route[method]) {
    return route[method](request);
  }

  // Route not allowed (path exists but method doesn't)
  if (route) {
    return jsonResponse(
      { error: "Method Not Allowed", method, path: pathname },
      405
    );
  }

  // No route found
  return notFoundHandler(request);
}
