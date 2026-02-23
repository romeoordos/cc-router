import React from 'react';
import { Box, Text } from 'ink';
import { ColumnChart } from './ColumnChart';
import { ModelStats } from '../../metrics/types';
import { formatTokens, formatLatency } from '../utils/format';

interface StatsPanelProps {
  stats: Map<string, ModelStats>;
  width: number;
}

export function StatsPanel({ stats, width }: StatsPanelProps): React.ReactElement {
  // Convert Map to arrays for charts
  const statsArray = Array.from(stats.values());

  // Calculate bar width dynamically
  const contentWidth = width - 4; // borders(2) + padding(2)
  const barWidth = Math.max(10, contentWidth - 15 - 10 - 2); // label(15) + value(10) + spacing(2)

  // If no data, show placeholder
  if (statsArray.length === 0) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} width={width} flexGrow={1}>
        <Text bold color="yellow">
          Statistics
        </Text>
        <Text dimColor>Waiting for requests...</Text>
      </Box>
    );
  }

  // Prepare data for each chart
  const models = statsArray.map(s => s.model);
  const latencies = statsArray.map(s => s.meanLatencyMs);
  const inputTokens = statsArray.map(s => s.totalInputTokens);
  const outputTokens = statsArray.map(s => s.totalOutputTokens);
  const tokensPerSecond = statsArray.map(s => s.avgTokensPerSecond);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} width={width} flexGrow={1}>
      <Text bold color="yellow">
        Statistics
      </Text>
      <ColumnChart
        title="Mean Latency"
        labels={models}
        values={latencies}
        type="latency"
        width={barWidth}
      />
      <ColumnChart
        title="Input Tokens"
        labels={models}
        values={inputTokens}
        type="tokens"
        width={barWidth}
      />
      <ColumnChart
        title="Output Tokens"
        labels={models}
        values={outputTokens}
        type="tokens"
        width={barWidth}
      />
      <ColumnChart
        title="Tokens/sec"
        labels={models}
        values={tokensPerSecond}
        type="tokensPerSecond"
        width={barWidth}
      />
    </Box>
  );
}
