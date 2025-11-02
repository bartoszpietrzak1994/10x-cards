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
  const accept = useCallback(async (id: number) => {
    console.log("Accepted proposal:", id);
    // Currently a no-op as per business logic
    // The flashcard is already created as "ai-proposal"
    // User can edit it which changes it to "ai-edited"
  }, []);

  /**
   * Saves edited proposal data
   */
  const saveEdit = useCallback(
    async (id: number, data: { front: string; back: string }) => {
      try {
        await service.updateFlashcard(id, data);
      } catch (error) {
        console.error("Error saving edit:", error);
        throw error;
      }
    },
    [service]
  );

  /**
   * Deletes a proposal
   */
  const deleteProposal = useCallback(
    async (id: number) => {
      try {
        await service.deleteFlashcard(id);
      } catch (error) {
        console.error("Error deleting flashcard:", error);
        throw error;
      }
    },
    [service]
  );

  return {
    accept,
    saveEdit,
    deleteProposal,
  };
}

