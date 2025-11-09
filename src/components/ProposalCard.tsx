import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InlineEditor } from "@/components/InlineEditor";

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

interface ProposalCardProps {
  proposal: FlashcardProposalVM;
  onAccept: (id: number) => Promise<void>;
  onEditSave: (id: number, data: { front: string; back: string }) => Promise<void>;
  onEditCancel: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
  onEditStart: (id: number) => void;
  onEditChange: (id: number, data: { front?: string; back?: string }) => void;
}

export function ProposalCard({
  proposal,
  onAccept,
  onEditSave,
  onEditCancel,
  onDelete,
  onEditStart,
  onEditChange,
}: ProposalCardProps) {
  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this flashcard? This action cannot be undone.");
    if (confirmed) {
      await onDelete(proposal.id);
    }
  };

  const getTypeLabel = () => {
    switch (proposal.flashcard_type) {
      case "ai-generated":
        return "AI Generated";
      case "ai-edited":
        return "AI Edited";
      case "ai-proposal":
        return "AI Proposal";
      default:
        return proposal.flashcard_type;
    }
  };

  const getTypeBadgeColor = () => {
    switch (proposal.flashcard_type) {
      case "ai-generated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ai-edited":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "ai-proposal":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeColor()}`}
          >
            {getTypeLabel()}
          </span>
          <span className="text-xs text-muted-foreground">ID: {proposal.id}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {proposal.isEditing ? (
          <InlineEditor
            value={{
              front: proposal.editFront,
              back: proposal.editBack,
            }}
            onChange={(value) => onEditChange(proposal.id, { front: value.front, back: value.back })}
            errors={proposal.validationErrors}
            onSave={() =>
              onEditSave(proposal.id, {
                front: proposal.editFront,
                back: proposal.editBack,
              })
            }
            onCancel={() => onEditCancel(proposal.id)}
          />
        ) : (
          <>
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Front</dt>
              <dd className="text-sm">{proposal.front}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Back</dt>
              <dd className="text-sm whitespace-pre-wrap">{proposal.back}</dd>
            </div>
          </>
        )}
      </CardContent>

      {!proposal.isEditing && (
        <CardFooter className="flex gap-2">
          <Button onClick={() => onAccept(proposal.id)} size="sm" variant="default">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4 mr-1"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Accept
          </Button>
          <Button onClick={() => onEditStart(proposal.id)} size="sm" variant="outline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4 mr-1"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Edit
          </Button>
          <Button onClick={handleDelete} size="sm" variant="destructive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4 mr-1"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
