import React from 'react';
import { Box, Text } from 'ink';

interface MinimumSizeWarningProps {
  currentWidth: number;
}

export function MinimumSizeWarning({ currentWidth }: MinimumSizeWarningProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      borderStyle="single"
      borderColor="red"
      paddingX={2}
      paddingY={1}
    >
      <Text bold color="red">
        Terminal too narrow!
      </Text>
      <Text dimColor>Current: {currentWidth} columns</Text>
      <Text dimColor>Minimum: 100 columns required</Text>
    </Box>
  );
}
