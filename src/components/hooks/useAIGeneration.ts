import { useState, useCallback, useMemo } from "react";
import { supabaseClient } from "@/db/supabase.client";
import { createAIGenerationClientService } from "@/lib/services/aiGenerationClientService";
import { usePolling } from "./usePolling";
import { useProposalEditing } from "./useProposalEditing";
import { useProposalActions } from "./useProposalActions";
import { aiGenerationInputSchema } from "@/lib/validators/flashcardSchemas";
import type { AILogDTO } from "@/types";

/**
 * Generation metadata
 */
interface GenerationMeta {
  request_time: string;
  response_time: string | null;
  token_count: number | null;
  generated_flashcards_count: number | null;
  model: string | null;
}

/**
 * View model for AI generation
 */
interface AIGenerationVM {
  inputText: string;
  inputLength: number;
  isValidLength: boolean;
  isSubmitting: boolean;
  generationId?: number;
  status: "idle" | "processing" | "completed" | "failed";
  aiLog?: AILogDTO;
  generationMeta?: GenerationMeta;
  error?: string;
}

/**
 * Constants
 */
const POLLING_CONFIG = {
  INTERVAL: 2000, // 2 seconds
  MAX_TIME: 45000, // 45 seconds
} as const;

const INPUT_LIMITS = {
  MIN: 1000,
  MAX: 10000,
} as const;

/**
 * Refactored AI Generation hook
 * 
 * This is an orchestrator hook that composes smaller, focused hooks:
 * - usePolling: Handles periodic data fetching
 * - useProposalEditing: Manages edit state and validation
 * - useProposalActions: Handles API calls for proposals
 * 
 * Benefits of this approach:
 * - Better separation of concerns
 * - Easier to test individual hooks
 * - More reusable components
 * - Clearer data flow
 */
export function useAIGeneration() {
  // Service instance
  const service = useMemo(
    () => createAIGenerationClientService(supabaseClient),
    []
  );

  // Main state
  const [vm, setVm] = useState<AIGenerationVM>({
    inputText: "",
    inputLength: 0,
    isValidLength: false,
    isSubmitting: false,
    status: "idle",
  });

  // Proposal editing state (using dedicated hook)
  const {
    proposals,
    updateProposals,
    startEdit,
    updateEdit,
    cancelEdit,
    commitEdit,
    setValidationError,
    removeProposal,
    getProposal,
  } = useProposalEditing();

  // Proposal actions (using dedicated hook)
  const { accept, saveEdit, deleteProposal } = useProposalActions(service);

  /**
   * Fetches generation data and updates state
   */
  const fetchAndUpdateData = useCallback(
    async (generationId: number) => {
      const data = await service.fetchGenerationData(generationId);

      setVm((prev) => ({
        ...prev,
        status: data.status,
        aiLog: data.aiLog || undefined,
        generationMeta: data.generationMeta || undefined,
      }));

      if (data.proposals) {
        updateProposals(data.proposals);
      }

      return data;
    },
    [service, updateProposals]
  );

  /**
   * Polling hook for auto-refresh
   */
  const { start: startPolling } = usePolling({
    fetcher: async () => {
      if (!vm.generationId) throw new Error("No generation ID");
      return await fetchAndUpdateData(vm.generationId);
    },
    interval: POLLING_CONFIG.INTERVAL,
    maxTime: POLLING_CONFIG.MAX_TIME,
    onData: () => {
      // Data is already updated in fetchAndUpdateData
    },
    shouldStop: (data) => data.status === "completed" || data.status === "failed",
    onStop: () => {
      setVm((prev) => {
        if (prev.status === "processing") {
          return {
            ...prev,
            status: "completed",
            error: "Polling timeout. Use refresh to check status manually.",
          };
        }
        return prev;
      });
    },
    enabled: vm.status === "processing",
  });

  /**
   * Sets input text and validates length
   */
  const setInputText = useCallback((text: string) => {
    const length = text.length;
    const isValid = length >= INPUT_LIMITS.MIN && length <= INPUT_LIMITS.MAX;

    setVm((prev) => ({
      ...prev,
      inputText: text,
      inputLength: length,
      isValidLength: isValid,
    }));
  }, []);

  /**
   * Submits generation request
   */
  const submit = useCallback(async () => {
    // Validate input
    const validation = aiGenerationInputSchema.safeParse({
      input_text: vm.inputText,
    });

    if (!validation.success) {
      setVm((prev) => ({
        ...prev,
        error: validation.error.errors[0]?.message || "Validation failed",
      }));
      return;
    }

    setVm((prev) => ({
      ...prev,
      isSubmitting: true,
      status: "idle",
      error: undefined,
    }));

    try {
      const response = await service.initiateGeneration({
        input_text: vm.inputText,
      });

      setVm((prev) => ({
        ...prev,
        isSubmitting: false,
        generationId: response.generation_id,
        status: "processing",
      }));

      // Start polling
      startPolling();
    } catch (error) {
      setVm((prev) => ({
        ...prev,
        isSubmitting: false,
        status: "idle",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }, [vm.inputText, service, startPolling]);

  /**
   * Manually refreshes generation data
   */
  const refresh = useCallback(async () => {
    if (!vm.generationId) return;
    await fetchAndUpdateData(vm.generationId);
  }, [vm.generationId, fetchAndUpdateData]);

  /**
   * Saves edited proposal
   */
  const handleSaveEdit = useCallback(
    async (id: number, data: { front: string; back: string }) => {
      const proposal = getProposal(id);
      if (!proposal || proposal.validationErrors) return;

      try {
        await saveEdit(id, data);
        commitEdit(id);
      } catch (error) {
        console.error("Error saving edit:", error);
        setValidationError(id, "Failed to save changes");
      }
    },
    [getProposal, saveEdit, commitEdit, setValidationError]
  );

  /**
   * Deletes a proposal
   */
  const handleDelete = useCallback(
    async (id: number) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this flashcard? This action cannot be undone."
      );
      if (!confirmed) return;

      try {
        await deleteProposal(id);
        removeProposal(id);
      } catch (error) {
        console.error("Error deleting flashcard:", error);
        alert("Failed to delete flashcard. Please try again.");
      }
    },
    [deleteProposal, removeProposal]
  );

  /**
   * Combined view model for component consumption
   */
  const viewModel = useMemo(
    () => ({
      ...vm,
      proposals,
    }),
    [vm, proposals]
  );

  return {
    vm: viewModel,
    setInputText,
    submit,
    refresh,
    accept,
    startEdit,
    updateEdit,
    saveEdit: handleSaveEdit,
    cancelEdit,
    remove: handleDelete,
  };
}

