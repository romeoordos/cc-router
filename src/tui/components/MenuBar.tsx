import React from 'react';
import { Box, Text } from 'ink';

interface MenuBarProps {
  showAbout?: boolean;
}

export function MenuBar({ showAbout = false }: MenuBarProps): React.ReactElement {
  if (showAbout) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1}>
        <Text bold color="cyan">CC Router</Text>
        <Text> </Text>
        <Text>Version: <Text color="green">1.0.0</Text></Text>
        <Text> </Text>
        <Text dimColor>Intelligent API router for Claude Code</Text>
        <Text> </Text>
        <Text dimColor>Routes API requests to different AI models</Text>
        <Text>based on agent detection and capabilities.</Text>
        <Text> </Text>
        <Text dimColor>Press Escape to close</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="single" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan" underline>About</Text>
      <Text dimColor> | CC Router v1.0.0 - Intelligent API router</Text>
    </Box>
  );
}
