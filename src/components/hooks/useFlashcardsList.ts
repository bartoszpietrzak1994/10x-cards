import { useState, useEffect, useCallback, useRef } from "react";
import type { FlashcardsListDTO } from "@/types";

export interface FlashcardsQueryState {
  page: number;
  limit: number;
  sortBy: "created_at" | "front" | "back";
  order: "asc" | "desc";
  flashcard_type?: "manual" | "ai-generated" | "ai-edited" | "ai-proposal";
}

interface UseFlashcardsListResult {
  data: FlashcardsListDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching paginated flashcards list with filters and sorting.
 * Handles aborting in-flight requests when query changes.
 */
export function useFlashcardsList(query: FlashcardsQueryState): UseFlashcardsListResult {
  const [data, setData] = useState<FlashcardsListDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFlashcards = useCallback(async () => {
    // Abort previous request if still in flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const params = new URLSearchParams({
        page: query.page.toString(),
        limit: query.limit.toString(),
        sortBy: query.sortBy,
        order: query.order,
      });

      if (query.flashcard_type) {
        params.append("flashcard_type", query.flashcard_type);
      }

      const response = await fetch(`/api/flashcards?${params.toString()}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("You need to log in to view flashcards");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const result: FlashcardsListDTO = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : "Failed to load flashcards";
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // Fetch on mount and when query changes
  useEffect(() => {
    fetchFlashcards();

    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchFlashcards]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchFlashcards,
  };
}

