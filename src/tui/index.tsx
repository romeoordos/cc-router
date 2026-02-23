import React from 'react';
import { render } from 'ink';
import { App } from './components/App';
import { MetricsCollector } from '../metrics/collector';

/**
 * Start the TUI with the given metrics collector
 * Returns a cleanup function to stop the TUI
 */
export function startTUI(collector: MetricsCollector): () => void {
  // Render the app
  const { unmount, clear } = render(<App collector={collector} />);

  // Track if we've already cleaned up
  let cleanedUp = false;

  // Cleanup function
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;

    // Unmount Ink app
    unmount();

    // Clear the terminal
    clear();

    // Reset terminal state
    process.stdout.write('\x1b[?25h'); // Show cursor
    process.stdout.write('\x1b[0m');   // Reset colors
    process.stdout.write('\x1b[2J');   // Clear screen
    process.stdout.write('\x1b[H');    // Move cursor to home
  };

  // Register cleanup on process exit
  // Note: Signal handlers are managed by src/index.ts to avoid duplication
  process.on('exit', cleanup);

  return cleanup;
}

export { App } from './components/App';
export { useMetrics, useUptime } from './hooks/useMetrics';
