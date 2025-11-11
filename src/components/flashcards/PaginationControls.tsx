import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, pageSize, total, onPageChange }: PaginationControlsProps) {
  const totalPages = Math.ceil(total / pageSize);
  const isFirstPage = page === 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="flex items-center justify-between gap-4" role="navigation" aria-label="Pagination">
      <div className="text-sm text-muted-foreground">
        Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} flashcards
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium">{page}</span>
          <span className="text-muted-foreground">of</span>
          <span className="font-medium">{totalPages || 1}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

