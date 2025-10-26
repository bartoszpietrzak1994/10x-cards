import { ProposalCard } from "@/components/ProposalCard";

interface FlashcardProposalVM {
  id: number;
  front: string;
  back: string;
  flashcard_type: "ai-generated" | "ai-edited" | "ai-proposal" | "manual";
  created_at: string;
  ai_generation_id: number | null;
  isEditing: boolean;
  editFront: string;
  editBack: string;
  validationErrors?: {
    front?: string;
    back?: string;
  };
}

interface ProposalsListProps {
  proposals: FlashcardProposalVM[];
  onAccept: (id: number) => Promise<void>;
  onEditStart: (id: number) => void;
  onEditSave: (id: number, data: { front: string; back: string }) => Promise<void>;
  onEditCancel: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
  onEditChange: (id: number, data: { front?: string; back?: string }) => void;
}

export function ProposalsList({
  proposals,
  onAccept,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onEditChange,
}: ProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="mx-auto h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <h3 className="mt-4 text-sm font-semibold">No flashcards yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit text above to generate flashcards with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Generated Flashcards ({proposals.length})
      </h2>
      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onAccept={onAccept}
            onEditStart={onEditStart}
            onEditSave={onEditSave}
            onEditCancel={onEditCancel}
            onDelete={onDelete}
            onEditChange={onEditChange}
          />
        ))}
      </div>
    </div>
  );
}

