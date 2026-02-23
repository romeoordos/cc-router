import React from 'react';
import { Box, Text } from 'ink';

interface ColumnChartProps {
  title: string;
  labels: string[];
  values: number[];
  maxValue?: number;
  type?: 'latency' | 'tokens' | 'tokensPerSecond';
  width?: number;
}

// Unicode block characters for bars (from empty to full)
const BAR_CHARS = ['░', '▒', '▓', '█'];

/**
 * Create a horizontal bar of given length using block characters
 */
function createBar(value: number, maxValue: number, width: number): string {
  if (maxValue === 0) return '░'.repeat(width);

  const ratio = Math.min(value / maxValue, 1);
  const filledWidth = Math.floor(ratio * width);
  const partialFill = ratio * width - filledWidth;

  let bar = '█'.repeat(filledWidth);

  // Add partial character if needed
  if (filledWidth < width) {
    if (partialFill > 0.75) bar += '▓';
    else if (partialFill > 0.5) bar += '▒';
    else if (partialFill > 0.25) bar += '░';
    else bar += '░';

    // Fill remaining with empty
    bar += '░'.repeat(width - filledWidth - 1);
  }

  return bar;
}

/**
 * Truncate label to fit width
 */
function truncateLabel(label: string, maxLen: number): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1) + '…';
}

/**
 * Format value based on type
 */
function formatValue(value: number, type: 'latency' | 'tokens' | 'tokensPerSecond'): string {
  switch (type) {
    case 'latency':
      // Convert ms to seconds with 1 decimal place
      return (value / 1000).toFixed(1) + 's';
    case 'tokens':
      // Fixed(1) with k/M/G suffixes
      if (value >= 1e9) {
        return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'G';
      }
      if (value >= 1e6) {
        return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (value >= 1e3) {
        return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
      }
      return value.toFixed(1);
    case 'tokensPerSecond':
      // Just rounded
      return Math.round(value).toString();
  }
}

export function ColumnChart({
  title,
  labels,
  values,
  maxValue,
  type = 'latency',
  width = 20,
}: ColumnChartProps): React.ReactElement {
  // Calculate max value if not provided
  const max = maxValue ?? Math.max(...values, 1);

  // Handle empty data
  if (labels.length === 0) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text bold dimColor>
          {title}
        </Text>
        <Text dimColor>No data</Text>
      </Box>
    );
  }

  const labelWidth = 15;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold>{title}</Text>
      {labels.map((label, index) => {
        const value = values[index] ?? 0;
        const bar = createBar(value, max, width);
        const truncatedLabel = truncateLabel(label, labelWidth);

        return (
          <Box key={index} flexDirection="row">
            <Box width={labelWidth}>
              <Text dimColor>{truncatedLabel}</Text>
            </Box>
            <Box>
              <Text color="cyan">{bar}</Text>
            </Box>
            <Box marginLeft={1}>
              <Text>{formatValue(value, type)}</Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
