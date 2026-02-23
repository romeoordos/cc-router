import { useState, useEffect, useCallback } from 'react';
import { MetricsCollector } from '../../metrics/collector';
import { MetricsState } from '../../metrics/types';

/**
 * Hook to subscribe to metrics collector events
 */
export function useMetrics(collector: MetricsCollector): MetricsState {
  const [state, setState] = useState<MetricsState>(() => collector.getState());

  useEffect(() => {
    // Handler for state updates
    const handleStateUpdate = (newState: MetricsState) => {
      setState(newState);
    };

    // Subscribe to events
    collector.on('state:updated', handleStateUpdate);

    // Initial state fetch
    setState(collector.getState());

    // Cleanup on unmount
    return () => {
      collector.off('state:updated', handleStateUpdate);
    };
  }, [collector]);

  return state;
}

/**
 * Get uptime as formatted string HH:MM:SS
 */
export function useUptime(startTime: Date): string {
  const [uptime, setUptime] = useState('');

  useEffect(() => {
    const updateUptime = () => {
      const now = Date.now();
      const diff = now - startTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setUptime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateUptime();
    const interval = setInterval(updateUptime, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return uptime;
}
