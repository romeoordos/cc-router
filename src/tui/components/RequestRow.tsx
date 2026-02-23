import React from 'react';
import { Box, Text } from 'ink';
import { RequestMetric } from '../../metrics/types';
import { formatTokens, formatLatency, formatTime, truncate } from '../utils/format';

interface ColumnWidths {
  time: number;
  model: number;
  agent: number;
  input: number;
  output: number;
  latency: number;
  tps: number;
  status: number;
}

interface RequestRowProps {
  request: RequestMetric;
  columnWidths: ColumnWidths;
  isHighlighted?: boolean;
}

/**
 * Get color for latency value
 */
function getLatencyColor(latencyMs: number): string {
  if (latencyMs < 1000) return 'green';
  if (latencyMs < 3000) return 'yellow';
  return 'red';
}

/**
 * Format agent type for display (extract last part after colon)
 */
function formatAgentType(agentType?: string, maxLen: number = 20): string {
  if (!agentType) return '-';
  const parts = agentType.split(':');
  return truncate(parts[parts.length - 1], maxLen);
}

export function RequestRow({ request, columnWidths, isHighlighted = false }: RequestRowProps): React.ReactElement {
  const time = formatTime(request.timestamp);
  const model = truncate(request.model, columnWidths.model - 2);
  const agent = formatAgentType(request.agentType, columnWidths.agent - 2);
  const input = formatTokens(request.inputTokens);
  const output = formatTokens(request.outputTokens);
  const latency = formatLatency(request.latencyMs);
  const tps = request.tokensPerSecond.toFixed(1);

  const latencyColor = getLatencyColor(request.latencyMs);
  const statusColor = request.status === 'error' ? 'red' : 'green';
  const agentColor = request.agentType ? 'magenta' : 'gray';

  return (
    <Box flexDirection="row">
      <Box width={columnWidths.time}>
        <Text dimColor={isHighlighted}>{time}</Text>
      </Box>
      <Box width={columnWidths.model}>
        <Text color="cyan" dimColor={isHighlighted}>{model}</Text>
      </Box>
      <Box width={columnWidths.agent}>
        <Text color={agentColor} dimColor={isHighlighted}>{agent}</Text>
      </Box>
      <Box width={columnWidths.input}>
        <Text dimColor={isHighlighted}>{input}</Text>
      </Box>
      <Box width={columnWidths.output}>
        <Text dimColor={isHighlighted}>{output}</Text>
      </Box>
      <Box width={columnWidths.latency}>
        <Text color={latencyColor} bold={request.latencyMs > 3000} dimColor={isHighlighted}>
          {latency}
        </Text>
      </Box>
      <Box width={columnWidths.tps}>
        <Text dimColor={isHighlighted}>{tps}</Text>
      </Box>
      <Box width={columnWidths.status}>
        <Text color={statusColor}>{request.status === 'error' ? '✗' : '✓'}</Text>
      </Box>
    </Box>
  );
}
