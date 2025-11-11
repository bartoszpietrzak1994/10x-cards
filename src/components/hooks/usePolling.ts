import { useEffect, useRef, useCallback } from "react";

/**
 * Options for the polling hook
 */
export interface UsePollingOptions<T> {
  /** Function to fetch data */
  fetcher: () => Promise<T>;
  /** Polling interval in milliseconds */
  interval: number;
  /** Maximum polling time in milliseconds */
  maxTime: number;
  /** Callback when data is fetched */
  onData: (data: T) => void;
  /** Function to determine if polling should stop */
  shouldStop: (data: T) => boolean;
  /** Callback when polling stops */
  onStop?: () => void;
  /** Whether polling is enabled */
  enabled: boolean;
}

/**
 * Hook for polling data at regular intervals
 *
 * Features:
 * - Automatic cleanup on unmount
 * - Maximum polling time limit
 * - Conditional stopping based on data
 * - Manual control via enabled flag
 *
 * @example
 * ```typescript
 * const { start, stop } = usePolling({
 *   fetcher: () => fetchGenerationStatus(id),
 *   interval: 2000,
 *   maxTime: 45000,
 *   onData: (data) => setStatus(data),
 *   shouldStop: (data) => data.status === 'completed',
 *   enabled: true,
 * });
 * ```
 */
export function usePolling<T>({
  fetcher,
  interval,
  maxTime,
  onData,
  shouldStop,
  onStop,
  enabled,
}: UsePollingOptions<T>) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const enabledRef = useRef(enabled);

  // Update enabled ref when it changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  /**
   * Clears the polling interval
   */
  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Starts the polling process
   */
  const start = useCallback(() => {
    if (!enabledRef.current) return;

    clearPolling();
    startTimeRef.current = Date.now();

    const poll = async () => {
      try {
        const elapsed = Date.now() - startTimeRef.current;

        // Stop polling if max time exceeded
        if (elapsed > maxTime) {
          clearPolling();
          onStop?.();
          return;
        }

        // Fetch data
        const data = await fetcher();
        onData(data);

        // Stop polling if condition met
        if (shouldStop(data)) {
          clearPolling();
          onStop?.();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[usePolling] Error during poll:", error);
        // Continue polling even if there's an error
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  }, [fetcher, interval, maxTime, onData, shouldStop, onStop, clearPolling]);

  /**
   * Stops the polling process
   */
  const stop = useCallback(() => {
    clearPolling();
    onStop?.();
  }, [clearPolling, onStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  return {
    start,
    stop,
  };
}
