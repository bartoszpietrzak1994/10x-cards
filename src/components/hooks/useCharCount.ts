import { useMemo } from "react";

interface UseCharCountReturn {
  count: number;
  isValid: boolean;
  remaining: number;
  error?: string;
}

export function useCharCount(value: string, min = 1000, max = 10000): UseCharCountReturn {
  return useMemo(() => {
    const count = value.length;
    const isValid = count >= min && count <= max;
    const remaining = max - count;

    let error: string | undefined;
    if (count === 0) {
      error = undefined; // No error on empty input
    } else if (count < min) {
      error = `Text must be at least ${min} characters. Currently ${count} characters.`;
    } else if (count > max) {
      error = `Text must not exceed ${max} characters. Currently ${count} characters.`;
    }

    return {
      count,
      isValid,
      remaining,
      error,
    };
  }, [value, min, max]);
}
