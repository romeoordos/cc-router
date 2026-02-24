import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface ModelSelectorProps {
  label: string;
  models: string[];
  selectedModel: string;
  onSelect: (model: string) => void;
  focused: boolean;
  isDropdownOpen: boolean;
  onDropdownToggle: (open: boolean) => void;
}

export function ModelSelector({
  label,
  models,
  selectedModel,
  onSelect,
  focused,
  isDropdownOpen,
  onDropdownToggle,
}: ModelSelectorProps): React.ReactElement {
  const [highlightedIndex, setHighlightedIndex] = useState(() =>
    Math.max(0, models.indexOf(selectedModel))
  );

  useInput((input, key) => {
    if (!focused) return;

    if (isDropdownOpen) {
      if (key.upArrow) {
        setHighlightedIndex(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setHighlightedIndex(prev => Math.min(models.length - 1, prev + 1));
        return;
      }
      if (key.return || input === ' ') {
        onSelect(models[highlightedIndex]);
        onDropdownToggle(false);
        return;
      }
      if (key.escape) {
        onDropdownToggle(false);
        return;
      }
    } else {
      if (key.return || input === ' ') {
        setHighlightedIndex(Math.max(0, models.indexOf(selectedModel)));
        onDropdownToggle(true);
        return;
      }
    }
  }, { isActive: focused });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={focused ? 'cyan' : undefined}>{focused ? '▶ ' : '  '}</Text>
        <Text color={focused ? 'cyan' : undefined}>{label.padEnd(22)}</Text>
        <Text color={focused ? 'green' : undefined}>{selectedModel}</Text>
        <Text dimColor>
          {focused && isDropdownOpen ? ' ▲' : focused ? ' [↵]' : ''}
        </Text>
      </Box>
      {isDropdownOpen && focused && (
        <Box flexDirection="column" marginLeft={4} borderStyle="single" borderColor="cyan">
          {models.map((model, i) => (
            <Box key={model}>
              <Text
                color={i === highlightedIndex ? 'black' : undefined}
                backgroundColor={i === highlightedIndex ? 'cyan' : undefined}
              >
                {i === highlightedIndex ? '› ' : '  '}{model}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
