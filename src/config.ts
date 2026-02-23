import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { parse } from "jsonc-parser";

interface ModelConfig {
  url: string;
  apiKey: string;
  contextWindow: number;
}

interface Config {
  models: Record<string, ModelConfig>;
  agentModelMap: Record<string, string>;
  orchestratorModelMap: Record<string, string>;
}

// Config search paths in priority order
function getConfigPaths(): string[] {
  return [
    join(process.cwd(), "router_config.jsonc"),
    join(homedir(), ".claude", "router_config.jsonc")
  ];
}

// Default config path (user home directory)
function getDefaultConfigPath(): string {
  return join(homedir(), ".claude", "router_config.jsonc");
}

// Default config content
const DEFAULT_CONFIG = `{
  // ============================================================================
  // MODEL CONFIGURATION
  // ============================================================================
  // Define available models with their API endpoints and credentials.
  // Each model must have: url, apiKey, and contextWindow (in tokens).
  // ============================================================================
  "models": {
    "claude-opus-4-6": {
      "url": "https://api.anthropic.com",
      "apiKey": "",
      "contextWindow": 200000
    },
    "claude-sonnet-4-6": {
      "url": "https://api.anthropic.com",
      "apiKey": "",
      "contextWindow": 200000
    },
    "claude-haiku-4-5": {
      "url": "https://api.anthropic.com",
      "apiKey": "",
      "contextWindow": 200000
    }
  },

  // ============================================================================
  // AGENT MODEL MAPPING
  // ============================================================================
  // Maps each agent type to a specific model.
  // The router detects which agent is being invoked (from system prompt or explicit)
  // and uses the corresponding model from this mapping.
  // ============================================================================
  "agentModelMap": {
    "analyst": "claude-opus-4-6",
    "architect": "claude-opus-4-6",
    "build-fixer": "claude-sonnet-4-6",
    "code-reviewer": "claude-opus-4-6",
    "code-simplifier": "claude-sonnet-4-6",
    "critic": "claude-opus-4-6",
    "debugger": "claude-sonnet-4-6",
    "deep-executor": "claude-opus-4-6",
    "designer": "claude-sonnet-4-6",
    "document-specialist": "claude-sonnet-4-6",
    "executor": "claude-sonnet-4-6",
    "explore": "claude-haiku-4-5",
    "git-master": "claude-sonnet-4-6",
    "planner": "claude-opus-4-6",
    "qa-tester": "claude-sonnet-4-6",
    "quality-reviewer": "claude-opus-4-6",
    "scientist": "claude-sonnet-4-6",
    "security-reviewer": "claude-opus-4-6",
    "test-engineer": "claude-sonnet-4-6",
    "verifier": "claude-sonnet-4-6",
    "writer": "claude-haiku-4-5"
  },

  // ============================================================================
  // ORCHESTRATOR MODEL MAPPING (FALLBACK)
  // ============================================================================
  // Default model selection when no specific agent type is detected.
  // Used when the router operates in "orchestrator mode" and needs a model
  // based on the requested tier: haiku (fast/cheap), sonnet (balanced), opus (powerful).
  // ============================================================================
  "orchestratorModelMap": {
    "haiku": "claude-haiku-4-5",
    "sonnet": "claude-sonnet-4-6",
    "opus": "claude-opus-4-6"
  }
}`;

// Create default config in user home directory
function createDefaultConfig(): string {
  const configPath = getDefaultConfigPath();
  const configDir = dirname(configPath);
  
  // Create directory if it doesn't exist
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  // Write default config
  writeFileSync(configPath, DEFAULT_CONFIG, "utf-8");
  console.log(`Created default config at: ${configPath}`);
  console.log(`Please edit the config file and add your API keys.`);
  
  return configPath;
}

function loadConfig(): Config {
  const configPaths = getConfigPaths();
  let configPath: string | null = null;

  for (const path of configPaths) {
    if (existsSync(path)) {
      configPath = path;
      break;
    }
  }

  if (!configPath) {
    // Create default config in user home directory
    configPath = createDefaultConfig();
  }

  const content = readFileSync(configPath, "utf-8");
  const parsed = parse(content, [], { allowTrailingComma: true }) as Config;
  validateConfig(parsed);
  return parsed;
}

// Get config with hot reload (reads file on every call)
export function getConfig(): Config {
  return loadConfig();
}

// Validate config to prevent runtime errors
export function validateConfig(config: Config): void {
  const errors: string[] = [];

  // Validate agentModelMap references
  for (const [agentType, modelName] of Object.entries(config.agentModelMap)) {
    if (!config.models[modelName]) {
      errors.push(`agentModelMap.${agentType} references undefined model: ${modelName}`);
    }
  }

  // Validate orchestratorModelMap references
  for (const [tier, modelName] of Object.entries(config.orchestratorModelMap)) {
    if (!config.models[modelName]) {
      errors.push(`orchestratorModelMap.${tier} references undefined model: ${modelName}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.join('\n')}`);
  }
}

// Export for backwards compatibility (static config)
export const config = getConfig();
