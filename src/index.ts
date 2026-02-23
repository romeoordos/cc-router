import { router } from "./routes";
import { metricsCollector } from "./metrics/collector";
import { RequestMetric } from "./metrics/types";
import { startTUI } from "./tui";
import { getConfig } from "./config";

// Validate config at startup by loading it (getConfig calls validateConfig internally)
getConfig();

const PORT = Number(Bun.env.PORT) || 3010;

// Check if TUI mode is enabled
const TUI_ENABLED = process.stdout.isTTY && !process.argv.includes('--no-tui');

// ANSI colors for pretty console output (only used when TUI is disabled)
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

// Format headers for display
function formatHeaders(headers: Headers): string {
  const lines: string[] = [];
  for (const [key, value] of headers.entries()) {
    lines.push(`  ${colors.cyan}${key}${colors.reset}: ${value}`);
  }
  return lines.join("\n");
}

// Format query parameters for display
function formatQuery(url: URL): string {
  if (url.searchParams.toString() === "") {
    return "(none)";
  }
  const lines: string[] = [];
  for (const [key, value] of url.searchParams.entries()) {
    lines.push(`  ${colors.yellow}${key}${colors.reset}: ${value}`);
  }
  return lines.join("\n");
}

// Format body for display
async function formatBody(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const clone = request.clone();
      const text = await clone.text();
      if (text) {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, 2);
      }
      return "(empty)";
    } catch {
      return "(invalid JSON)";
    }
  }

  const clone = request.clone();
  const body = await clone.text();
  return body || "(empty)";
}

// Log incoming request details (only when TUI is disabled)
async function logRequest(request: Request): Promise<void> {
  if (TUI_ENABLED) return; // Suppress console when TUI is active

  const url = new URL(request.url);
  const timestamp = new Date().toISOString();

  // Request line
  console.log("\n" + colors.dim + "═".repeat(60) + colors.reset);
  console.log(`${colors.bright}${colors.magenta}REQUEST${colors.reset} ${colors.gray}${timestamp}${colors.reset}`);
  console.log(colors.dim + "─".repeat(60) + colors.reset);

  // Method and URL
  console.log(`${colors.green}${request.method}${colors.reset} ${colors.bright}${url.pathname}${colors.reset}`);

  // Full URL
  console.log(`\n${colors.cyan}URL:${colors.reset}`);
  console.log(`  ${url.href}`);

  // Query parameters
  console.log(`\n${colors.cyan}Query:${colors.reset}`);
  console.log(formatQuery(url));

  // Headers
  console.log(`\n${colors.cyan}Headers:${colors.reset}`);
  console.log(formatHeaders(request.headers));

  // Body
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const body = await formatBody(request.clone());
    console.log(`\n${colors.cyan}Body:${colors.reset}`);
    console.log(body);
  }

  console.log(colors.dim + "─".repeat(60) + colors.reset);
}

// Log metric details after a request is processed (only when TUI is disabled)
function logMetric(metric: RequestMetric): void {
  if (TUI_ENABLED) return;

  const statusColor = metric.status === 'success' ? colors.green : colors.red;
  const statusLabel = metric.status === 'success' ? 'OK' : 'ERR';

  const parts: string[] = [
    `${colors.gray}${metric.timestamp.toISOString()}${colors.reset}`,
    `${statusColor}[${statusLabel}]${colors.reset}`,
    `${colors.cyan}model${colors.reset}=${colors.bright}${metric.model}${colors.reset}`,
  ];

  if (metric.originalModel && metric.originalModel !== metric.model) {
    parts.push(`${colors.cyan}original${colors.reset}=${metric.originalModel}`);
  }

  if (metric.routingReason) {
    parts.push(`${colors.yellow}routing${colors.reset}=${metric.routingReason}`);
  }

  if (metric.agentType) {
    parts.push(`${colors.magenta}agent${colors.reset}=${metric.agentType}`);
  }

  parts.push(`${colors.cyan}in${colors.reset}=${metric.inputTokens}tok`);
  parts.push(`${colors.cyan}out${colors.reset}=${metric.outputTokens}tok`);
  parts.push(`${colors.cyan}latency${colors.reset}=${metric.latencyMs}ms`);

  if (metric.tokensPerSecond > 0) {
    parts.push(`${colors.cyan}tps${colors.reset}=${metric.tokensPerSecond.toFixed(1)}`);
  }

  if (metric.status === 'error' && metric.errorMessage) {
    parts.push(`${colors.red}error${colors.reset}=${metric.errorMessage}`);
  }

  console.log(parts.join('  '));
}

if (!TUI_ENABLED) {
  metricsCollector.on('request:recorded', logMetric);
  console.log(`${colors.green}Starting Bun Web Server...${colors.reset}`);
}

const server = Bun.serve({
  port: PORT,
  async fetch(request: Request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Check if route is known
    const knownRoutes = ["/v1/messages", "/v1/messages/count_tokens"];
    const isKnownRoute = knownRoutes.includes(pathname) && method === "POST";

    if (!TUI_ENABLED) {
      if (isKnownRoute) {
        // Simple logging for known routes (only when TUI is off)
        console.log(`${colors.gray}${new Date().toISOString()}${colors.reset} ${colors.green}${method}${colors.reset} ${pathname}`);
      } else {
        // Detailed logging for unknown routes
        await logRequest(request.clone());
      }
    }

    try {
      return await router(request);
    } catch (error) {
      if (!TUI_ENABLED) {
        console.error(`${colors.red}Server error:${colors.reset}`, error);
      }
      return new Response(
        JSON.stringify({ error: "Internal Server Error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});

if (!TUI_ENABLED) {
  console.log(`${colors.green}Server running at http://localhost:${server.port}${colors.reset}`);
  console.log(`${colors.blue}Available routes:${colors.reset}`);
  console.log(`   ${colors.green}POST${colors.reset} /v1/messages`);
  console.log(`   ${colors.green}POST${colors.reset} /v1/messages/count_tokens`);
}

// Start TUI if enabled
if (TUI_ENABLED) {
  const cleanup = startTUI(metricsCollector);

  // Handle graceful shutdown
  const handleExit = () => {
    cleanup();
    process.exit(0);
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
}

export { server, metricsCollector };
