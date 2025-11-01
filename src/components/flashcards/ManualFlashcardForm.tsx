import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CreateManualFlashcardCommand, FlashcardDTO } from "@/types";

// ====================== Types ======================

interface ManualFlashcardFormValues {
  front: string;
  back: string;
}

interface ManualFlashcardFormErrors {
  front?: string;
  back?: string;
  general?: string;
}

interface TextareaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

interface CharacterCounterProps {
  current: number;
  max: number;
}

interface ValidationMessageProps {
  id: string;
  message?: string;
}

interface FormAlertProps {
  type: "success" | "error";
  message: string;
}

// ====================== Constants ======================

const VALIDATION_RULES = {
  front: {
    minLength: 1,
    maxLength: 200,
  },
  back: {
    minLength: 1,
    maxLength: 500,
  },
};

// ====================== Subcomponents ======================

function CharacterCounter({ current, max }: CharacterCounterProps) {
  const isOverLimit = current > max;
  
  return (
    <span
      className={`text-xs ${
        isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
      }`}
      aria-live="polite"
    >
      {current} / {max}
    </span>
  );
}

function ValidationMessage({ id, message }: ValidationMessageProps) {
  if (!message) return null;
  
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  error,
  disabled,
}: TextareaFieldProps) {
  const errorId = `${id}-error`;
  const hasError = !!error;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <CharacterCounter current={value.length} max={maxLength} />
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className="min-h-[120px]"
      />
      <ValidationMessage id={errorId} message={error} />
    </div>
  );
}

function FormAlert({ type, message }: FormAlertProps) {
  return (
    <Alert variant={type === "error" ? "destructive" : "default"} role="alert">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// ====================== Main Component ======================

export function ManualFlashcardForm() {
  // State management
  const [values, setValues] = useState<ManualFlashcardFormValues>({
    front: "",
    back: "",
  });
  const [errors, setErrors] = useState<ManualFlashcardFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiSuccessMessage, setApiSuccessMessage] = useState<string | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [createdFlashcard, setCreatedFlashcard] = useState<FlashcardDTO | null>(null);

  // ====================== Validation Logic ======================

  const validateField = (field: keyof ManualFlashcardFormValues, value: string): string | undefined => {
    const rules = VALIDATION_RULES[field];
    
    if (!value || value.trim().length === 0) {
      return `${field === "front" ? "Question" : "Answer"} is required`;
    }
    
    if (value.length < rules.minLength) {
      return `${field === "front" ? "Question" : "Answer"} must be at least ${rules.minLength} character`;
    }
    
    if (value.length > rules.maxLength) {
      return `${field === "front" ? "Question" : "Answer"} must not exceed ${rules.maxLength} characters`;
    }
    
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ManualFlashcardFormErrors = {
      front: validateField("front", values.front),
      back: validateField("back", values.back),
    };
    
    setErrors(newErrors);
    
    return !newErrors.front && !newErrors.back;
  };

  // ====================== Event Handlers ======================

  const handleFieldChange = (field: keyof ManualFlashcardFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    
    // Clear success/error messages when user starts editing
    if (apiSuccessMessage) setApiSuccessMessage(null);
    if (apiErrorMessage) setApiErrorMessage(null);
    
    // Validate field on change
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setApiSuccessMessage(null);
    setApiErrorMessage(null);
    
    // Validate form
    if (!validateForm()) {
      // Focus first invalid field (check values to determine which field is invalid)
      const firstError = validateField("front", values.front) ? "front" : "back";
      document.getElementById(firstError)?.focus();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const command: CreateManualFlashcardCommand = {
        front: values.front.trim(),
        back: values.back.trim(),
        flashcard_type: "manual",
      };
      
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle different error types
        if (response.status === 401) {
          setApiErrorMessage("You must be logged in to create flashcards. Please sign in and try again.");
        } else if (response.status === 400) {
          // Validation error from API
          if (data.details && Array.isArray(data.details)) {
            setApiErrorMessage(`Validation failed: ${data.details.join(", ")}`);
          } else {
            setApiErrorMessage("The data is invalid. Please check the form and try again.");
          }
        } else if (response.status === 409) {
          // Duplicate flashcard
          setApiErrorMessage("A flashcard with this question already exists. Please use a different question.");
        } else if (response.status === 500) {
          setApiErrorMessage("A server error occurred. Please try again later.");
        } else {
          setApiErrorMessage(data.error || "An unexpected error occurred. Please try again.");
        }
        return;
      }
      
      // Success
      setCreatedFlashcard(data.flashcard);
      setApiSuccessMessage(data.message || "Flashcard created successfully!");
      
      // Reset form
      setValues({ front: "", back: "" });
      setErrors({});
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Create flashcard error:", error);
      setApiErrorMessage("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================== Render ======================

  const isValid = !errors.front && !errors.back && values.front.trim() && values.back.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {apiSuccessMessage && (
        <div className="space-y-4">
          <FormAlert type="success" message={apiSuccessMessage} />
          {createdFlashcard && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setApiSuccessMessage(null);
                  setCreatedFlashcard(null);
                }}
              >
                Create Another
              </Button>
              <a href="/">
                <Button type="button" variant="default">
                  Go to Home
                </Button>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {apiErrorMessage && <FormAlert type="error" message={apiErrorMessage} />}

      {/* Front Field */}
      <TextareaField
        id="front"
        label="Question (Front)"
        value={values.front}
        onChange={(value) => handleFieldChange("front", value)}
        maxLength={VALIDATION_RULES.front.maxLength}
        placeholder="Enter the question or prompt"
        error={errors.front}
        disabled={isSubmitting}
      />

      {/* Back Field */}
      <TextareaField
        id="back"
        label="Answer (Back)"
        value={values.back}
        onChange={(value) => handleFieldChange("back", value)}
        maxLength={VALIDATION_RULES.back.maxLength}
        placeholder="Enter the answer or explanation"
        error={errors.back}
        disabled={isSubmitting}
      />

      {/* Submit Button */}
      <Button type="submit" disabled={!isValid || isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Flashcard"}
      </Button>
    </form>
  );
}

