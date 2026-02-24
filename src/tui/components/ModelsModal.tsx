import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { getConfig, saveConfig } from '../../config.js';
import { VALID_AGENT_TYPES } from '../../agent-detection.js';
import { ModelSelector } from './ModelSelector.js';

const VIEWPORT_SIZE = 10;
const agentList = Array.from(VALID_AGENT_TYPES).sort();
const orchestratorKeys = ['haiku', 'sonnet', 'opus'];

interface ModelsModalProps {
  onClose: () => void;
}

export function ModelsModal({ onClose }: ModelsModalProps): React.ReactElement {
  const initialConfig = getConfig();
  const availableModels = Object.keys(initialConfig.models);

  const [agentModelMap, setAgentModelMap] = useState<Record<string, string>>(
    { ...initialConfig.agentModelMap }
  );
  const [orchestratorModelMap, setOrchestratorModelMap] = useState<Record<string, string>>(
    { ...initialConfig.orchestratorModelMap }
  );
  const [focusedSection, setFocusedSection] = useState<'agents' | 'orchestrator'>('agents');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleAgentSelect = useCallback((agent: string, model: string) => {
    setAgentModelMap(prev => ({ ...prev, [agent]: model }));
    setHasChanges(true);
  }, []);

  const handleOrchestratorSelect = useCallback((tier: string, model: string) => {
    setOrchestratorModelMap(prev => ({ ...prev, [tier]: model }));
    setHasChanges(true);
  }, []);

  useInput((input, key) => {
    if (showConfirmDiscard) {
      if (input.toLowerCase() === 'y') {
        onClose();
      } else {
        setShowConfirmDiscard(false);
      }
      return;
    }

    if (key.escape) {
      if (hasChanges) {
        setShowConfirmDiscard(true);
      } else {
        onClose();
      }
      return;
    }

    if (key.tab) {
      setFocusedSection(prev => prev === 'agents' ? 'orchestrator' : 'agents');
      setFocusedIndex(0);
      setViewportOffset(0);
      return;
    }

    if (key.upArrow) {
      const maxIndex = focusedSection === 'agents' ? agentList.length - 1 : 2;
      const newIndex = Math.max(0, focusedIndex - 1);
      setFocusedIndex(newIndex);
      if (newIndex < viewportOffset) setViewportOffset(newIndex);
      return;
    }

    if (key.downArrow) {
      const maxIndex = focusedSection === 'agents' ? agentList.length - 1 : 2;
      const newIndex = Math.min(maxIndex, focusedIndex + 1);
      setFocusedIndex(newIndex);
      if (newIndex >= viewportOffset + VIEWPORT_SIZE) setViewportOffset(newIndex - VIEWPORT_SIZE + 1);
      return;
    }

    if (input === 's' || input === 'S') {
      saveConfig({ agentModelMap, orchestratorModelMap });
      setHasChanges(false);
      setSaveMessage('Saved!');
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }
  }, { isActive: !dropdownOpen });

  if (showConfirmDiscard) {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1}>
        <Box justifyContent="space-between">
          <Text bold>Models Configuration</Text>
          <Text dimColor>[ESC] Close</Text>
        </Box>
        <Box borderStyle="single" borderColor="yellow" marginTop={1} paddingX={1}>
          <Text color="yellow">Unsaved changes. Discard? [y/N] </Text>
        </Box>
      </Box>
    );
  }

  const visibleAgents = agentList.slice(viewportOffset, viewportOffset + VIEWPORT_SIZE);

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1}>
      {/* Title row */}
      <Box justifyContent="space-between">
        <Text bold>Models Configuration</Text>
        <Text dimColor>[ESC] Close</Text>
      </Box>

      {/* Agent Model Mappings section */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Agent Model Mappings</Text>
        {visibleAgents.map((agent, i) => {
          const absoluteIndex = viewportOffset + i;
          const isFocused = focusedSection === 'agents' && focusedIndex === absoluteIndex;
          return (
            <ModelSelector
              key={agent}
              label={agent}
              models={availableModels}
              selectedModel={agentModelMap[agent] ?? availableModels[0] ?? ''}
              onSelect={(model) => handleAgentSelect(agent, model)}
              focused={isFocused}
              isDropdownOpen={dropdownOpen && isFocused}
              onDropdownToggle={setDropdownOpen}
            />
          );
        })}
      </Box>

      {/* Orchestrator Model Mappings section */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold color="cyan">Orchestrator Model Mappings</Text>
        {orchestratorKeys.map((tier, i) => {
          const isFocused = focusedSection === 'orchestrator' && focusedIndex === i;
          return (
            <ModelSelector
              key={tier}
              label={tier}
              models={availableModels}
              selectedModel={orchestratorModelMap[tier] ?? availableModels[0] ?? ''}
              onSelect={(model) => handleOrchestratorSelect(tier, model)}
              focused={isFocused}
              isDropdownOpen={dropdownOpen && isFocused}
              onDropdownToggle={setDropdownOpen}
            />
          );
        })}
      </Box>

      {/* Footer */}
      <Box justifyContent="space-between" marginTop={1}>
        <Text dimColor>[S] Save  [Tab] Switch section  [ESC] Cancel</Text>
        {saveMessage ? <Text color="green">{saveMessage}</Text> : null}
      </Box>
    </Box>
  );
}
