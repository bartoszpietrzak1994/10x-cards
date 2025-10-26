import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StatusBannerProps {
  status: "idle" | "processing" | "completed" | "failed";
  message?: string;
}

export function StatusBanner({ status, message }: StatusBannerProps) {
  if (status === "idle") {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case "processing":
        return {
          variant: "default" as const,
          title: "Processing",
          icon: (
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ),
          defaultMessage: "AI is generating flashcards from your text. This may take a moment...",
        };
      case "completed":
        return {
          variant: "default" as const,
          title: "Generation Complete",
          icon: (
            <svg
              className="h-4 w-4 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          defaultMessage: "Flashcards have been generated successfully! Review and accept them below.",
        };
      case "failed":
        return {
          variant: "destructive" as const,
          title: "Generation Failed",
          icon: (
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          ),
          defaultMessage: "Failed to generate flashcards. Please try again or contact support.",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <Alert variant={config.variant} aria-live="polite" aria-atomic="true">
      {config.icon}
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription>{message || config.defaultMessage}</AlertDescription>
    </Alert>
  );
}

