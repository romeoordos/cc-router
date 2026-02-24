import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout, useInput } from 'ink';
import { MetricsCollector } from '../../metrics/collector';
import { useMetrics } from '../hooks/useMetrics';
import { MenuBar } from './MenuBar';
import { Footer } from './Footer';
import { MinimumSizeWarning } from './MinimumSizeWarning';
import { StatsPanel } from './StatsPanel';
import { HistoryPanel } from './HistoryPanel';
import { ModelsModal } from './ModelsModal';

interface AppProps {
  collector: MetricsCollector;
}

export function App({ collector }: AppProps): React.ReactElement {
  const state = useMetrics(collector);

  const { stdout } = useStdout();

  // Track terminal dimensions with state to trigger re-renders on resize
  const [terminalSize, setTerminalSize] = useState({
    width: stdout?.columns ?? 120,
    height: stdout?.rows ?? 24,
  });

  // Modal state
  const [showAbout, setShowAbout] = useState(false);
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setTerminalSize({
        width: stdout?.columns ?? 120,
        height: stdout?.rows ?? 24,
      });
    };

    // Listen for terminal resize
    stdout?.on('resize', handleResize);

    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout]);

  useInput((input, key) => {
    if (showAbout) {
      if (key.escape) {
        setShowAbout(false);
      }
      return;
    }
    // CRITICAL: Do NOT handle Escape when showModels is true
    // ModelsModal manages its own close lifecycle with unsaved changes confirmation
    if (showModels) {
      return;
    }
    if (input === 'a' || input === 'A') {
      setShowAbout(true);
    }
    if (input === 'm' || input === 'M') {
      setShowModels(true);
    }
  });

  const terminalWidth = terminalSize.width;
  const terminalHeight = terminalSize.height;

  // Minimum width guard
  if (terminalWidth < 100) {
    return <MinimumSizeWarning currentWidth={terminalWidth} />;
  }

  // Calculate panel widths
  // Overhead: 2 (outer borders) + 2 (margin between panels) = 4
  const availableWidth = terminalWidth - 4;
  const statsWidth = Math.max(42, Math.min(Math.floor(availableWidth * 0.35), 50));
  const historyWidth = availableWidth - statsWidth - 2;

  // Calculate panel height
  // Overhead: MenuBar (1) + marginTop (1) + Footer (1) + help text (1) = 4
  const availableHeight = terminalHeight - 4;

  if (showAbout) {
    return (
      <Box flexDirection="column" height={terminalHeight} width={terminalWidth}>
        <MenuBar showAbout={true} />
        <Box flexGrow={1} />
      </Box>
    );
  }

  if (showModels) {
    return <ModelsModal onClose={() => setShowModels(false)} />;
  }

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <MenuBar showModels={showModels} />

      <Box flexDirection="row" flexGrow={1} marginTop={1}>
        <Box marginRight={2} flexGrow={1}>
          <StatsPanel stats={state.stats} width={statsWidth} />
        </Box>
        <HistoryPanel requests={state.requests} width={historyWidth} height={availableHeight} />
      </Box>

      <Footer
        startTime={state.serverStartTime}
        totalRequests={state.totalRequests}
        errorCount={state.errorCount}
      />

      <Box justifyContent="center">
        <Text dimColor>Ctrl+C to exit | 'a' About | 'm' Models</Text>
      </Box>
    </Box>
  );
}
