import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AILogDTO {
  request_time: string | null;
  response_time: string | null;
  token_count: number | null;
  error_info: string | null;
}

interface GenerationMeta {
  request_time: string;
  response_time: string | null;
  token_count: number | null;
  generated_flashcards_count: number | null;
  model: string | null;
}

interface AIGenerationMetaProps {
  log?: AILogDTO;
  generationMeta?: GenerationMeta;
  onRefresh?: () => void;
}

export function AIGenerationMeta({ log, generationMeta, onRefresh }: AIGenerationMetaProps) {
  if (!log && !generationMeta) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return "—";
    return num.toLocaleString();
  };

  const calculateDuration = () => {
    if (!log?.request_time || !log?.response_time) return null;
    try {
      const start = new Date(log.request_time).getTime();
      const end = new Date(log.response_time).getTime();
      const durationMs = end - start;
      const durationSec = (durationMs / 1000).toFixed(2);
      return `${durationSec}s`;
    } catch {
      return null;
    }
  };

  const duration = calculateDuration();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Generation Details</CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} aria-label="Refresh generation data">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4 mr-2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Request Time</dt>
            <dd className="mt-1 text-sm">{formatDate(generationMeta?.request_time || log?.request_time || null)}</dd>
          </div>

          {(generationMeta?.response_time || log?.response_time) && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Response Time</dt>
              <dd className="mt-1 text-sm">
                {formatDate(generationMeta?.response_time || log?.response_time || null)}
              </dd>
            </div>
          )}

          {duration && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Duration</dt>
              <dd className="mt-1 text-sm">{duration}</dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-muted-foreground">Token Count</dt>
            <dd className="mt-1 text-sm">{formatNumber(generationMeta?.token_count || log?.token_count || null)}</dd>
          </div>

          {generationMeta?.generated_flashcards_count !== null && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Generated Flashcards</dt>
              <dd className="mt-1 text-sm">{formatNumber(generationMeta?.generated_flashcards_count || null)}</dd>
            </div>
          )}

          {generationMeta?.model && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Model</dt>
              <dd className="mt-1 text-sm">{generationMeta.model}</dd>
            </div>
          )}

          {log?.error_info && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-destructive">Error Information</dt>
              <dd className="mt-1 text-sm text-destructive bg-destructive/10 p-3 rounded-md">{log.error_info}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
