import { useState, useCallback, useRef, useEffect } from "react";
import { supabaseClient, DEFAULT_USER_ID } from "@/db/supabase.client";
import type {
  AIGenerationResponseDTO,
  FlashcardProposal,
  AILogDTO,
} from "@/types";

interface GenerationMeta {
  request_time: string;
  response_time: string | null;
  token_count: number | null;
  generated_flashcards_count: number | null;
  model: string | null;
}

interface FlashcardProposalVM extends FlashcardProposal {
  isEditing: boolean;
  editFront: string;
  editBack: string;
  validationErrors?: {
    front?: string;
    back?: string;
  };
}

interface AIGenerationVM {
  inputText: string;
  inputLength: number;
  isValidLength: boolean;
  isSubmitting: boolean;
  generationId?: number;
  status: "idle" | "processing" | "completed" | "failed";
  aiLog?: AILogDTO;
  generationMeta?: GenerationMeta;
  proposals: FlashcardProposalVM[];
  error?: string;
}

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_TIME = 45000; // 45 seconds

export function useAIGeneration() {
  const [vm, setVm] = useState<AIGenerationVM>({
    inputText: "",
    inputLength: 0,
    isValidLength: false,
    isSubmitting: false,
    status: "idle",
    proposals: [],
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number>(0);

  // Clear polling interval
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Fetch generation status, metadata, and proposals
  const fetchGenerationData = useCallback(async (generationId: number) => {
    try {
      // Fetch generation metadata
      const { data: generationData, error: generationError } = await supabaseClient
        .from("flashcards_ai_generation")
        .select("request_time, response_time, token_count, model, generated_flashcards_count")
        .eq("id", generationId)
        .single();

      if (generationError) {
        console.error("Error fetching generation data:", generationError);
        return { status: "processing" as const };
      }

      // Fetch AI log
      const { data: logData, error: logError } = await supabaseClient
        .from("ai_logs")
        .select("request_time, response_time, token_count, error_info")
        .eq("flashcards_generation_id", generationId)
        .single();

      if (logError) {
        console.error("Error fetching AI log:", logError);
      }

      // Fetch proposals
      const { data: proposalsData, error: proposalsError } = await supabaseClient
        .from("flashcards")
        .select("id, front, back, flashcard_type, created_at, ai_generation_id")
        .eq("ai_generation_id", generationId)
        .in("flashcard_type", ["ai-generated", "ai-proposal"])
        .order("created_at", { ascending: true });

      if (proposalsError) {
        console.error("Error fetching proposals:", proposalsError);
      }

      // Determine status
      let status: "processing" | "completed" | "failed" = "processing";
      if (logData?.error_info) {
        status = "failed";
      } else if (generationData.response_time) {
        status = "completed";
      }

      return {
        status,
        aiLog: logData || undefined,
        generationMeta: generationData || undefined,
        proposals: proposalsData || [],
      };
    } catch (error) {
      console.error("Error in fetchGenerationData:", error);
      return { status: "processing" as const };
    }
  }, []);

  // Start polling
  const startPolling = useCallback(
    (generationId: number) => {
      clearPolling();
      pollingStartTimeRef.current = Date.now();

      const poll = async () => {
        const elapsed = Date.now() - pollingStartTimeRef.current;

        // Stop polling after max time
        if (elapsed > MAX_POLLING_TIME) {
          clearPolling();
          setVm((prev) => ({
            ...prev,
            status: "completed",
            error: "Polling timeout. Use refresh to check status manually.",
          }));
          return;
        }

        const data = await fetchGenerationData(generationId);

        setVm((prev) => ({
          ...prev,
          status: data.status,
          aiLog: data.aiLog,
          generationMeta: data.generationMeta,
          proposals:
            data.proposals?.map((p) => ({
              ...p,
              isEditing: false,
              editFront: p.front,
              editBack: p.back,
            })) || prev.proposals,
        }));

        // Stop polling if completed or failed
        if (data.status === "completed" || data.status === "failed") {
          clearPolling();
        }
      };

      // Initial poll
      poll();

      // Set up interval
      pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL);
    },
    [fetchGenerationData, clearPolling]
  );

  // Recalculate text length and validation status when inputText changes
  useEffect(() => {
    const length = vm.inputText.length;
    setVm((prev) => ({
      ...prev,
      inputLength: length,
      isValidLength: length >= 1000 && length <= 10000,
    }));
  }, [vm.inputText]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  // Set input text
  const setInputText = useCallback((text: string) => {
    setVm((prev) => ({
      ...prev,
      inputText: text,
    }));
  }, []);

  // Submit generation request
  const submit = useCallback(async () => {
    if (!vm.isValidLength) return;

    setVm((prev) => ({
      ...prev,
      isSubmitting: true,
      status: "idle",
      error: undefined,
    }));

    try {
      const response = await fetch("/api/flashcards/ai-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_text: vm.inputText,
          user_id: DEFAULT_USER_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details?.[0] || "Failed to initiate generation"
        );
      }

      const data: AIGenerationResponseDTO = await response.json();

      setVm((prev) => ({
        ...prev,
        isSubmitting: false,
        generationId: data.generation_id,
        status: "processing",
      }));

      // Start polling for status
      startPolling(data.generation_id);
    } catch (error) {
      setVm((prev) => ({
        ...prev,
        isSubmitting: false,
        status: "idle",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }, [vm.isValidLength, vm.inputText, startPolling]);

  // Refresh status manually
  const refresh = useCallback(async () => {
    if (!vm.generationId) return;

    const data = await fetchGenerationData(vm.generationId);

    setVm((prev) => ({
      ...prev,
      status: data.status,
      aiLog: data.aiLog,
      generationMeta: data.generationMeta,
      proposals:
        data.proposals?.map((p) => ({
          ...p,
          isEditing: false,
          editFront: p.front,
          editBack: p.back,
        })) || prev.proposals,
    }));
  }, [vm.generationId, fetchGenerationData]);

  // Accept proposal (no-op, just for UI feedback)
  const accept = useCallback(async (id: number) => {
    // Accepting without editing is a no-op in this implementation
    // The backend will handle status changes when actual edits are made
    console.log("Accepted proposal:", id);
  }, []);

  // Start editing a proposal
  const startEdit = useCallback((id: number) => {
    setVm((prev) => ({
      ...prev,
      proposals: prev.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              isEditing: true,
              editFront: p.front,
              editBack: p.back,
              validationErrors: undefined,
            }
          : p
      ),
    }));
  }, []);

  // Update edit fields
  const updateEdit = useCallback(
    (id: number, data: { front?: string; back?: string }) => {
      setVm((prev) => ({
        ...prev,
        proposals: prev.proposals.map((p) => {
          if (p.id !== id) return p;

          const editFront = data.front !== undefined ? data.front : p.editFront;
          const editBack = data.back !== undefined ? data.back : p.editBack;

          // Validate
          const validationErrors: { front?: string; back?: string } = {};
          if (editFront.length === 0) {
            validationErrors.front = "Front is required";
          } else if (editFront.length > 200) {
            validationErrors.front = "Front must not exceed 200 characters";
          }
          if (editBack.length === 0) {
            validationErrors.back = "Back is required";
          } else if (editBack.length > 500) {
            validationErrors.back = "Back must not exceed 500 characters";
          }

          return {
            ...p,
            editFront,
            editBack,
            validationErrors:
              Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
          };
        }),
      }));
    },
    []
  );

  // Save edited proposal
  const saveEdit = useCallback(async (id: number) => {
    const proposal = vm.proposals.find((p) => p.id === id);
    if (!proposal || proposal.validationErrors) return;

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          front: proposal.editFront,
          back: proposal.editBack,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update flashcard");
      }

      // Update local state
      setVm((prev) => ({
        ...prev,
        proposals: prev.proposals.map((p) =>
          p.id === id
            ? {
                ...p,
                front: p.editFront,
                back: p.editBack,
                isEditing: false,
                flashcard_type: "ai-edited",
              }
            : p
        ),
      }));
    } catch (error) {
      console.error("Error saving edit:", error);
      setVm((prev) => ({
        ...prev,
        proposals: prev.proposals.map((p) =>
          p.id === id
            ? {
                ...p,
                validationErrors: {
                  ...p.validationErrors,
                  front: "Failed to save changes",
                },
              }
            : p
        ),
      }));
    }
  }, [vm.proposals]);

  // Cancel editing
  const cancelEdit = useCallback((id: number) => {
    setVm((prev) => ({
      ...prev,
      proposals: prev.proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              isEditing: false,
              editFront: p.front,
              editBack: p.back,
              validationErrors: undefined,
            }
          : p
      ),
    }));
  }, []);

  // Delete proposal
  const remove = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete flashcard");
      }

      // Remove from local state
      setVm((prev) => ({
        ...prev,
        proposals: prev.proposals.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      alert("Failed to delete flashcard. Please try again.");
    }
  }, []);

  return {
    vm,
    setInputText,
    submit,
    refresh,
    accept,
    startEdit,
    updateEdit,
    saveEdit,
    cancelEdit,
    remove,
  };
}

