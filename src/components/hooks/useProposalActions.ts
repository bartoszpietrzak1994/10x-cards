import { useCallback } from "react";
import type { AIGenerationClientService } from "@/lib/services/aiGenerationClientService";

/**
 * Hook for managing proposal actions (save, delete, accept)
 *
 * This hook provides actions for interacting with flashcard proposals
 * through the AI Generation Client Service.
 */
export function useProposalActions(service: AIGenerationClientService) {
  /**
   * Accepts a proposal (no-op in current implementation)
   * Backend handles status changes when edits are made
   */
  const accept = useCallback(async () => {
    // Currently a no-op as per business logic
    // The flashcard is already created as "ai-proposal"
    // User can edit it which changes it to "ai-edited"
  }, []);

  /**
   * Saves edited proposal data
   */
  const saveEdit = useCallback(
    async (id: number, data: { front: string; back: string }) => {
      await service.updateFlashcard(id, data);
    },
    [service]
  );

  /**
   * Deletes a proposal
   */
  const deleteProposal = useCallback(
    async (id: number) => {
      await service.deleteFlashcard(id);
    },
    [service]
  );

  return {
    accept,
    saveEdit,
    deleteProposal,
  };
}
