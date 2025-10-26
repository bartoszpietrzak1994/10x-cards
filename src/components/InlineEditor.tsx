import { Button } from "@/components/ui/button";

interface InlineEditorProps {
  value: {
    front: string;
    back: string;
  };
  onChange: (value: { front: string; back: string }) => void;
  errors?: {
    front?: string;
    back?: string;
  };
  onSave: () => void;
  onCancel: () => void;
}

export function InlineEditor({
  value,
  onChange,
  errors,
  onSave,
  onCancel,
}: InlineEditorProps) {
  const isValid = !errors || (Object.keys(errors).length === 0);
  const frontLength = value.front.length;
  const backLength = value.back.length;

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <div className="space-y-2">
        <label htmlFor="edit-front" className="text-sm font-medium leading-none">
          Front
        </label>
        <input
          id="edit-front"
          type="text"
          value={value.front}
          onChange={(e) => onChange({ ...value, front: e.target.value })}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="front-helper front-error"
        />
        <div className="flex justify-between items-start gap-2">
          <p
            id="front-helper"
            className="text-xs text-muted-foreground"
          >
            {frontLength}/200 characters
          </p>
          {errors?.front && (
            <p id="front-error" className="text-xs text-destructive">
              {errors.front}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-back" className="text-sm font-medium leading-none">
          Back
        </label>
        <textarea
          id="edit-back"
          value={value.back}
          onChange={(e) => onChange({ ...value, back: e.target.value })}
          rows={3}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="back-helper back-error"
        />
        <div className="flex justify-between items-start gap-2">
          <p
            id="back-helper"
            className="text-xs text-muted-foreground"
          >
            {backLength}/500 characters
          </p>
          {errors?.back && (
            <p id="back-error" className="text-xs text-destructive">
              {errors.back}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onSave}
          disabled={!isValid}
          size="sm"
        >
          Save
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

