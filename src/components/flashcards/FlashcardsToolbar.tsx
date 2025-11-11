import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import type { FlashcardsQueryState } from "@/components/hooks/useFlashcardsList";

interface FlashcardsToolbarProps {
  query: FlashcardsQueryState;
  onQueryChange: (next: FlashcardsQueryState) => void;
}

export function FlashcardsToolbar({ query, onQueryChange }: FlashcardsToolbarProps) {
  const handleTypeFilterChange = (value: string) => {
    onQueryChange({
      ...query,
      page: 1, // Reset to first page when filter changes
      flashcard_type: value === "all" ? undefined : (value as any),
    });
  };

  const handleSortByChange = (value: string) => {
    onQueryChange({
      ...query,
      page: 1, // Reset to first page when sort changes
      sortBy: value as FlashcardsQueryState["sortBy"],
    });
  };

  const handleOrderToggle = () => {
    onQueryChange({
      ...query,
      page: 1, // Reset to first page when order changes
      order: query.order === "asc" ? "desc" : "asc",
    });
  };

  const handlePageSizeChange = (value: string) => {
    onQueryChange({
      ...query,
      page: 1, // Reset to first page when page size changes
      limit: parseInt(value, 10),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Label htmlFor="type-filter" className="text-sm font-medium whitespace-nowrap">
            Type:
          </Label>
          <Select value={query.flashcard_type || "all"} onValueChange={handleTypeFilterChange}>
            <SelectTrigger className="w-[180px]" size="sm" aria-label="Filter by flashcard type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="ai-generated">AI Generated</SelectItem>
              <SelectItem value="ai-edited">AI Edited</SelectItem>
              <SelectItem value="ai-proposal">AI Proposal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-by" className="text-sm font-medium whitespace-nowrap">
            Sort by:
          </Label>
          <Select value={query.sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-[140px]" size="sm" aria-label="Sort flashcards by field">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="front">Question</SelectItem>
              <SelectItem value="back">Answer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Order Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleOrderToggle}
          aria-label={`Sort ${query.order === "asc" ? "descending" : "ascending"}`}
          title={`Currently sorting ${query.order === "asc" ? "ascending" : "descending"}`}
        >
          <ArrowUpDown className="h-4 w-4 mr-2" />
          {query.order === "asc" ? "Asc" : "Desc"}
        </Button>

        {/* Page Size */}
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-sm font-medium whitespace-nowrap">
            Per page:
          </Label>
          <Select value={query.limit.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[80px]" size="sm" aria-label="Number of flashcards per page">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

