# CC Router - Developer Guide

## Project Overview

CC Router is an intelligent API router built with Bun that routes Claude API requests to different AI models based on agent detection, orchestrator tiers, and model capabilities. It acts as a middleware proxy between Claude Code clients and various AI model providers.

## Architecture

The router consists of several key components:

- **Entry Point** (`src/index.ts`): Server initialization, TUI startup, request logging
- **Routing** (`src/routes/index.ts`): Request handling, model selection, proxy forwarding
- **Agent Detection** (`src/agent-detection.ts`): Identifies which OMC agent is being invoked
- **Metrics** (`src/metrics/`): Request tracking and aggregation
- **TUI** (`src/tui/`): Interactive terminal dashboard

## Configuration

### router_config.jsonc Format

The project uses `router_config.jsonc` (JSON with Comments) for configuration:

```jsonc
{
  // Model definitions - URL, API key, and context window
  "models": {
    "model-name": {
      "url": "https://api.provider.com/anthropic",
      "apiKey": "your-api-key",
      "contextWindow": 200000
    }
  },

  // Maps agent types to specific models
  "agentModelMap": {
    "executor": "MiniMax-M2.5",
    "planner": "glm-5"
  },

  // Fallback models for orchestrator tiers
  "orchestratorModelMap": {
    "haiku": "deepseek-chat",
    "sonnet": "MiniMax-M2.5",
    "opus": "glm-5"
  }
}
```

### Adding New Models

1. Add model entry in `router_config.jsonc` under `models`
2. Optionally map agents to the new model in `agentModelMap`

## Routing Logic

The router determines the target model in this priority order:

1. **Topic Summarizer**: Routes to `orchestratorModelMap.haiku` for conversation topic analysis
2. **Agent Detection**: Uses `agentModelMap` when agent type is detected from SubagentStart hooks or system prompts
3. **Orchestrator Tier**: Falls back to haiku/sonnet/opus mappings based on requested model name

## Key Files

| File | Purpose |
|------|---------|
| `src/config.ts` | Config loading with hot reload support |
| `src/index.ts` | Server entry point |
| `src/routes/index.ts` | Request routing and proxy |
| `src/agent-detection.ts` | Agent type detection |
| `src/metrics/collector.ts` | Metrics storage |
| `src/tui/index.ts` | Terminal UI |

## Development

```bash
# Install dependencies
bun install

# Development with hot reload
bun run dev

# Production
bun run start
```

## Hot Reload

The config system reads `router_config.jsonc` on every request, allowing configuration changes to take effect immediately without restarting the server.
