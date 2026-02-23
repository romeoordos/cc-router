import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { RequestMetric } from '../../metrics/types';
import { RequestRow } from './RequestRow';

interface HistoryPanelProps {
  requests: RequestMetric[];
  width: number;
  height?: number;
}

export function HistoryPanel({ requests, width, height = 20 }: HistoryPanelProps): React.ReactElement {
  // Content width = panel width - borders (2) - padding (2)
  const contentWidth = width - 4;

  // Calculate visible rows based on available height
  // Overhead: title (1) + header (1) + scroll indicators (2) + borders (2) = ~6
  const maxVisible = Math.max(1, height - 6);

  // Fixed-width columns
  const fixedColumns = {
    time: 10,
    input: 6,
    output: 6,
    latency: 8,
    tps: 6,
    status: 3,
  };

  // Calculate flexible columns (Model and Agent share remaining space)
  const fixedTotal = Object.values(fixedColumns).reduce((a, b) => a + b, 0);
  const flexibleWidth = Math.max(20, contentWidth - fixedTotal);
  const modelWidth = Math.max(15, Math.floor(flexibleWidth * 0.6));
  const agentWidth = Math.max(10, flexibleWidth - modelWidth);

  const columnWidths = {
    time: fixedColumns.time,
    model: modelWidth,
    agent: agentWidth,
    input: fixedColumns.input,
    output: fixedColumns.output,
    latency: fixedColumns.latency,
    tps: fixedColumns.tps,
    status: fixedColumns.status,
  };

  const [scrollOffset, setScrollOffset] = useState(0);

  // Handle keyboard input for scrolling
  useInput(
    useCallback(
      (input, key) => {
        if (key.upArrow || input === 'k') {
          setScrollOffset(prev => Math.max(0, prev - 1));
        } else if (key.downArrow || input === 'j') {
          setScrollOffset(prev =>
            Math.min(Math.max(0, requests.length - maxVisible), prev + 1)
          );
        } else if (key.pageUp) {
          setScrollOffset(prev => Math.max(0, prev - maxVisible));
        } else if (key.pageDown) {
          setScrollOffset(prev =>
            Math.min(Math.max(0, requests.length - maxVisible), prev + maxVisible)
          );
        }
      },
      [requests.length, maxVisible]
    )
  );

  // Calculate visible slice
  const visibleRequests = requests.slice(scrollOffset, scrollOffset + maxVisible);
  const totalRequests = requests.length;
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset + maxVisible < totalRequests;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} flexGrow={1}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold color="yellow">
          Request History
        </Text>
        <Text dimColor>
          {totalRequests > 0 ? `${scrollOffset + 1}-${Math.min(scrollOffset + maxVisible, totalRequests)} of ${totalRequests}` : 'No requests'}
        </Text>
      </Box>

      {/* Header row */}
      <Box flexDirection="row">
        <Box width={columnWidths.time}>
          <Text bold dimColor>Time</Text>
        </Box>
        <Box width={columnWidths.model}>
          <Text bold dimColor>Model</Text>
        </Box>
        <Box width={columnWidths.agent}>
          <Text bold dimColor>Agent</Text>
        </Box>
        <Box width={columnWidths.input}>
          <Text bold dimColor>In</Text>
        </Box>
        <Box width={columnWidths.output}>
          <Text bold dimColor>Out</Text>
        </Box>
        <Box width={columnWidths.latency}>
          <Text bold dimColor>Latency</Text>
        </Box>
        <Box width={columnWidths.tps}>
          <Text bold dimColor>T/s</Text>
        </Box>
        <Box width={columnWidths.status}>
          <Text bold dimColor>St</Text>
        </Box>
      </Box>

      {/* Request rows */}
      {visibleRequests.length > 0 ? (
        visibleRequests.map((request, index) => (
          <RequestRow key={request.id} request={request} columnWidths={columnWidths} isHighlighted={index === 0 && scrollOffset === 0} />
        ))
      ) : (
        <Text dimColor>Waiting for requests...</Text>
      )}

      {/* Scroll indicators */}
      <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
        <Text dimColor={!canScrollUp}>
          {canScrollUp ? '↑ k/up' : '       '}
        </Text>
        <Text dimColor>
          j/k: scroll
        </Text>
        <Text dimColor={!canScrollDown}>
          {canScrollDown ? '↓ j/down' : '         '}
        </Text>
      </Box>
    </Box>
  );
}
