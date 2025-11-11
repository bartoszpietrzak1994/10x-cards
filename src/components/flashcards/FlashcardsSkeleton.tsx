import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FlashcardsSkeletonProps {
  count?: number;
}

export function FlashcardsSkeleton({ count = 9 }: FlashcardsSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite">
      <span className="sr-only">Loading flashcards...</span>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

