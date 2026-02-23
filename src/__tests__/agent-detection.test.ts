import { describe, it, expect } from "bun:test";
import { detectAgentType, AgentType } from "../agent-detection";

describe("Agent Detection", () => {
  describe("detectAgentType from SubagentStart hook messages", () => {
    it("should detect architect agent type from SubagentStart message", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:architect started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("architect");
    });

    it("should detect executor agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:executor started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("executor");
    });

    it("should detect explore agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "Some text before SubagentStart hook additional context: Agent oh-my-claudecode:explore started and after" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("explore");
    });

    it("should detect agent type from SubagentStart message without oh-my-claudecode prefix", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent explore started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("explore");
    });

    it("should detect writer agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:writer started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("writer");
    });

    it("should detect critic agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:critic started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("critic");
    });

    it("should detect debugger agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:debugger started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("debugger");
    });

    it("should detect analyst agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:analyst started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("analyst");
    });

    it("should detect planner agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:planner started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("planner");
    });

    it("should detect designer agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:designer started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("designer");
    });

    it("should detect test-engineer agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:test-engineer started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("test-engineer");
    });

    it("should detect verifier agent type from SubagentStart message", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:verifier started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("verifier");
    });

    it("should return null for unknown agent types", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:unknown-agent started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBeNull();
    });

    it("should return null for undefined messages", () => {
      const result = detectAgentType(undefined, undefined);
      expect(result).toBeNull();
    });

    it("should return null for empty messages array", () => {
      const result = detectAgentType(undefined, []);
      expect(result).toBeNull();
    });

    it("should return null when no SubagentStart pattern found", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "This is a normal response" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBeNull();
    });

    it("should be case insensitive for agent type", () => {
      const messages = [
        { role: "assistant", content: "SubagentStart hook additional context: Agent oh-my-claudecode:ARCHITECT started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("architect");
    });

    it("should handle multi-part content with text parts", () => {
      const messages = [
        {
          role: "assistant",
          content: [
            { type: "text", text: "Some text" },
            { type: "text", text: "SubagentStart hook additional context: Agent oh-my-claudecode:executor started" }
          ]
        }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("executor");
    });

    it("should find agent type in any message in the array", () => {
      const messages = [
        { role: "user", content: "First message" },
        { role: "assistant", content: "Second message" },
        { role: "user", content: "Third message with SubagentStart hook additional context: Agent oh-my-claudecode:planner started" }
      ];
      const result = detectAgentType(undefined, messages);
      expect(result).toBe("planner");
    });
  });

  describe("AgentType type", () => {
    it("should be a union of 11 agent types", () => {
      const agentTypes: AgentType[] = [
        "architect",
        "executor",
        "explore",
        "writer",
        "critic",
        "debugger",
        "analyst",
        "planner",
        "designer",
        "test-engineer",
        "verifier"
      ];
      expect(agentTypes.length).toBe(11);
    });
  });
});
