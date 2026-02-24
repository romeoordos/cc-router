// Agent type definitions
export type AgentType =
  'analyst' |
  'architect' |
  'build-fixer' |
  'code-reviewer' |
  'code-simplifier' |
  'critic' |
  'debugger' |
  'deep-executor' |
  'designer' |
  'document-specialist' |
  'executor' |
  'explore' |
  'git-master' |
  'planner' |
  'qa-tester' |
  'quality-reviewer' |
  'scientist' |
  'security-reviewer' |
  'test-engineer' |
  'verifier' |
  'writer'

// All valid agent types for validation
export const VALID_AGENT_TYPES: Set<string> = new Set([
  'analyst',
  'architect',
  'build-fixer',
  'code-reviewer',
  'code-simplifier',
  'critic',
  'debugger',
  'deep-executor',
  'designer',
  'document-specialist',
  'executor',
  'explore',
  'git-master',
  'planner',
  'qa-tester',
  'quality-reviewer',
  'scientist',
  'security-reviewer',
  'test-engineer',
  'verifier',
  'writer'
]);

// Pattern to match SubagentStart hook messages
// Example: "SubagentStart hook additional context: Agent oh-my-claudecode:explore started"
// or "SubagentStart hook additional context: Agent explore started"
// Captures just the agent name, stripping any "oh-my-claudecode:" prefix
const SUBAGENT_START_PATTERN = /SubagentStart hook additional context:\s*Agent\s+(?:oh-my-claudecode:)?(\S+)\s+started/i;

/**
 * Extract agent type from SubagentStart hook message in messages
 * @param messages - Array of message objects
 * @returns Detected agent type or null if no match
 */
function extractAgentFromMessages(
  messages?: Array<{ role?: string; content?: unknown }>
): AgentType | null {
  if (!Array.isArray(messages)) return null;

  for (const message of messages) {
    const content = message.content;
    if (typeof content === 'string') {
      const match = content.match(SUBAGENT_START_PATTERN);
      if (match && match[1]) {
        const agentType = match[1].toLowerCase();
        if (VALID_AGENT_TYPES.has(agentType)) {
          return agentType as AgentType;
        }
      }
    } else if (Array.isArray(content)) {
      // Handle multi-part content
      for (const part of content) {
        if (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string') {
          const match = part.text.match(SUBAGENT_START_PATTERN);
          if (match && match[1]) {
            const agentType = match[1].toLowerCase();
            if (VALID_AGENT_TYPES.has(agentType)) {
              return agentType as AgentType;
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Detect agent type from system prompt content
 * @param system - Array of system message objects or string
 * @returns Detected agent type or null if no match
 */
export function detectAgentType(
  system?: Array<{ type: string; text: string }> | string
): AgentType | null;
/**
 * Detect agent type from messages containing SubagentStart hook
 * @param system - Array of system message objects or string (optional, kept for backward compatibility)
 * @param messages - Array of message objects to search for SubagentStart hook
 * @returns Detected agent type or null if no match
 */
export function detectAgentType(
  system?: Array<{ type: string; text: string }> | string,
  messages?: Array<{ role?: string; content?: unknown }>
): AgentType | null;
export function detectAgentType(
  system?: Array<{ type: string; text: string }> | string,
  messages?: Array<{ role?: string; content?: unknown }>
): AgentType | null {
  // Priority 1: Check messages for SubagentStart hook pattern
  if (messages) {
    const agentFromMessages = extractAgentFromMessages(messages);
    if (agentFromMessages) {
      return agentFromMessages;
    }
  }

  return null;
}
