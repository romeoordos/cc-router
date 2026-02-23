/**
 * Format token counts as integers with k/M suffixes
 */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return Math.round(n / 1_000_000) + 'M';
  if (n >= 1_000) return Math.round(n / 1_000) + 'k';
  return Math.round(n).toString();
}

/**
 * Format latency in seconds
 */
export function formatLatency(ms: number): string {
  return (ms / 1000).toFixed(1) + 's';
}

/**
 * Format tokens per second
 */
export function formatTokensPerSecond(tps: number): string {
  if (tps >= 1000) return (tps / 1000).toFixed(1) + 'k';
  return tps.toFixed(1);
}

/**
 * Format timestamp to HH:MM:SS
 */
export function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0];
}

/**
 * Truncate string to max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}
