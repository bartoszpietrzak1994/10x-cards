import { FlashcardCard } from "./FlashcardCard";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import type { FlashcardDTO } from "@/types";

interface FlashcardsListProps {
  items: FlashcardDTO[];
  onEdit: (id: number, data: { front?: string; back?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  processingId?: number;
}

export function FlashcardsList({ items, onEdit, onDelete, processingId }: FlashcardsListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center" role="status">
        <div className="max-w-md space-y-4">
          <div className="text-6xl mb-4" aria-hidden="true">📚</div>
          <h2 className="text-2xl font-semibold tracking-tight">No flashcards yet</h2>
          <p className="text-muted-foreground">
            Get started by creating your first flashcard manually or use AI to generate flashcards from your notes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <a href="/flashcards/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Manual Flashcard
              </Button>
            </a>
            <a href="/flashcards/ai-generation">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Flashcards list"
    >
      {items.map((item) => (
        <div key={item.id} role="listitem">
          <FlashcardCard
            item={item}
            onEdit={onEdit}
            onDelete={onDelete}
            isProcessing={processingId === item.id}
          />
        </div>
      ))}
    </div>
  );
}

