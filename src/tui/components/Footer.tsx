import React from 'react';
import { Box, Text } from 'ink';
import { useUptime } from '../hooks/useMetrics';

interface FooterProps {
  startTime: Date;
  totalRequests: number;
  errorCount: number;
}

export function Footer({ startTime, totalRequests, errorCount }: FooterProps): React.ReactElement {
  const uptime = useUptime(startTime);

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="single"
      borderColor="gray"
    >
      <Text>Uptime: </Text>
      <Text color="green">{uptime}</Text>
      <Box>
        <Text>Requests: </Text>
        <Text color="blue">{totalRequests}</Text>
        <Text dimColor> | </Text>
        <Text>Errors: </Text>
        <Text color={errorCount > 0 ? 'red' : 'green'}>{errorCount}</Text>
      </Box>
    </Box>
  );
}
