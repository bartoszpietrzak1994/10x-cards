import { Button } from "@/components/ui/button";

interface AIGenerationFormProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  min: number;
  max: number;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export function AIGenerationForm({
  value,
  onChange,
  isValid,
  min,
  max,
  onSubmit,
  isSubmitting,
}: AIGenerationFormProps) {
  const computedCharCount = value.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isSubmitting) {
      await onSubmit();
    }
  };

  const getCounterColor = () => {
    if (computedCharCount === 0) return "text-muted-foreground";
    if (computedCharCount < min) return "text-destructive";
    if (computedCharCount > max) return "text-destructive";
    return "text-green-600";
  };

  const getHelperText = () => {
    if (computedCharCount === 0) {
      return `Enter text between ${min} and ${max} characters to generate flashcards.`;
    }
    if (computedCharCount < min) {
      return `You need at least ${min - computedCharCount} more characters.`;
    }
    if (computedCharCount > max) {
      return `Please reduce text by ${computedCharCount - max} characters.`;
    }
    return "Your text is ready for AI flashcard generation.";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="input-text"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Input Text
        </label>
        <textarea
          id="input-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isSubmitting}
          className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Paste your long-form text here to generate flashcards..."
          aria-describedby="char-count helper-text"
        />
        <div className="flex justify-between items-start gap-2">
          <p id="helper-text" className="text-sm text-muted-foreground">
            {getHelperText()}
          </p>
          <p
            id="char-count"
            className={`text-sm font-medium whitespace-nowrap ${getCounterColor()}`}
            aria-live="polite"
          >
            {computedCharCount} / {max}
          </p>
        </div>
      </div>
      <Button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? "Generating..." : "Generate Flashcards"}
      </Button>
    </form>
  );
}

