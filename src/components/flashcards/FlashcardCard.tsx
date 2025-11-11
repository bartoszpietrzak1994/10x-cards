import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineEditor } from "@/components/InlineEditor";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { validateFlashcardField } from "@/lib/validators";
import type { FlashcardDTO } from "@/types";

interface FlashcardCardProps {
  item: FlashcardDTO;
  onEdit: (id: number, data: { front?: string; back?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isProcessing?: boolean;
}

export function FlashcardCard({ item, onEdit, onDelete, isProcessing = false }: FlashcardCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState({
    front: item.front,
    back: item.back,
  });
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue({ front: item.front, back: item.back });
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue({ front: item.front, back: item.back });
    setErrors({});
  };

  const validateFields = () => {
    const frontValidation = validateFlashcardField("front", editValue.front);
    const backValidation = validateFlashcardField("back", editValue.back);

    const newErrors: { front?: string; back?: string } = {};
    if (!frontValidation.isValid) {
      newErrors.front = frontValidation.error;
    }
    if (!backValidation.isValid) {
      newErrors.back = backValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      return;
    }

    try {
      await onEdit(item.id, editValue);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by parent component
      console.error("Failed to save:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this flashcard?")) {
      return;
    }

    try {
      await onDelete(item.id);
    } catch (error) {
      // Error is handled by parent component
      console.error("Failed to delete:", error);
    }
  };

  const handleChange = (value: { front: string; back: string }) => {
    setEditValue(value);
    // Clear errors on change for better UX
    if (errors.front && value.front !== editValue.front) {
      setErrors((prev) => ({ ...prev, front: undefined }));
    }
    if (errors.back && value.back !== editValue.back) {
      setErrors((prev) => ({ ...prev, back: undefined }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "manual":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ai-generated":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "ai-edited":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "ai-proposal":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatTypeName = (type: string) => {
    return type.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <Card className={isProcessing ? "opacity-50 pointer-events-none" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg break-words" title={item.front}>
            {item.front}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isProcessing || isEditing}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit} disabled={isEditing}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <InlineEditor
            value={editValue}
            onChange={handleChange}
            errors={errors}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground line-clamp-3" title={item.back}>
                {item.back}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className={`px-2 py-1 rounded-md font-medium ${getTypeBadgeColor(item.flashcard_type)}`}>
                {formatTypeName(item.flashcard_type)}
              </span>
              <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

