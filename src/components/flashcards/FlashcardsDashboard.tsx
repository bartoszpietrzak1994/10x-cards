import { useState, useCallback } from "react";
import { useFlashcardsList } from "@/components/hooks/useFlashcardsList";
import { FlashcardsToolbar } from "./FlashcardsToolbar";
import { FlashcardsList } from "./FlashcardsList";
import { FlashcardsSkeleton } from "./FlashcardsSkeleton";
import { PaginationControls } from "./PaginationControls";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { FlashcardsQueryState } from "@/components/hooks/useFlashcardsList";

export function FlashcardsDashboard() {
  // Query state for filters, sorting, and pagination
  const [query, setQuery] = useState<FlashcardsQueryState>({
    page: 1,
    limit: 10,
    sortBy: "created_at",
    order: "desc",
  });

  // Fetch flashcards based on current query
  const { data, isLoading, error, refetch } = useFlashcardsList(query);

  // Track which flashcard is being processed (edit/delete)
  const [processingId, setProcessingId] = useState<number | undefined>();
  const [actionError, setActionError] = useState<string | null>(null);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  }, []);

  // Handle query change from toolbar
  const handleQueryChange = useCallback((next: FlashcardsQueryState) => {
    setQuery(next);
  }, []);

  // Handle edit flashcard
  const handleEdit = useCallback(
    async (id: number, editData: { front?: string; back?: string }) => {
      setProcessingId(id);
      setActionError(null);

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update flashcard");
        }

        // Refetch to get updated data
        await refetch();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update flashcard";
        setActionError(errorMessage);
        throw err; // Re-throw so FlashcardCard can handle it
      } finally {
        setProcessingId(undefined);
      }
    },
    [refetch]
  );

  // Handle delete flashcard
  const handleDelete = useCallback(
    async (id: number) => {
      setProcessingId(id);
      setActionError(null);

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to delete flashcard");
        }

        // Refetch to get updated list
        await refetch();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete flashcard";
        setActionError(errorMessage);
        throw err; // Re-throw so FlashcardCard can handle it
      } finally {
        setProcessingId(undefined);
      }
    },
    [refetch]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Flashcards</h1>
        <p className="text-muted-foreground">
          Manage your flashcards, filter by type, and edit or delete as needed.
        </p>
      </div>

      {/* Toolbar with filters and actions */}
      <FlashcardsToolbar query={query} onQueryChange={handleQueryChange} />

      {/* Error alerts */}
      {(error || actionError) && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <div className="flex-1">
            <h3 className="font-medium">Error</h3>
            <p className="text-sm">{error || actionError}</p>
          </div>
          {error && (
            <Button variant="outline" size="sm" onClick={refetch}>
              Try Again
            </Button>
          )}
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && <FlashcardsSkeleton count={query.limit} />}

      {/* Flashcards list */}
      {!isLoading && data && (
        <>
          <FlashcardsList
            items={data.flashcards}
            onEdit={handleEdit}
            onDelete={handleDelete}
            processingId={processingId}
          />

          {/* Pagination */}
          {data.pagination.total > 0 && (
            <PaginationControls
              page={data.pagination.page}
              pageSize={data.pagination.pageSize}
              total={data.pagination.total}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}

