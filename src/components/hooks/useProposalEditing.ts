import { useState, useCallback } from "react";
import { validateFlashcardField } from "@/lib/validators/flashcardSchemas";
import type { FlashcardProposal } from "@/types";

/**
 * Extended proposal with editing state
 */
export interface ProposalWithEditState extends FlashcardProposal {
  isEditing: boolean;
  editFront: string;
  editBack: string;
  validationErrors?: {
    front?: string;
    back?: string;
  };
}

/**
 * Hook for managing proposal editing state
 *
 * Handles:
 * - Edit mode toggling
 * - Field validation
 * - Temporary edit values
 * - Validation error tracking
 */
export function useProposalEditing(initialProposals: FlashcardProposal[] = []) {
  const [proposals, setProposals] = useState<ProposalWithEditState[]>(
    initialProposals.map((p) => ({
      ...p,
      isEditing: false,
      editFront: p.front,
      editBack: p.back,
    }))
  );

  /**
   * Updates proposals list (for external updates like fetch)
   */
  const updateProposals = useCallback((newProposals: FlashcardProposal[]) => {
    setProposals((prev) => {
      // Preserve editing state for existing proposals
      const prevMap = new Map(prev.map((p) => [p.id, p]));

      return newProposals.map((p) => {
        const existing = prevMap.get(p.id);
        if (existing?.isEditing) {
          // Keep editing state
          return existing;
        }
        return {
          ...p,
          isEditing: false,
          editFront: p.front,
          editBack: p.back,
        };
      });
    });
  }, []);

  /**
   * Starts editing a proposal
   */
  const startEdit = useCallback((id: number) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isEditing: true,
              editFront: p.front,
              editBack: p.back,
              validationErrors: undefined,
            }
          : p
      )
    );
  }, []);

  /**
   * Updates edit fields with validation
   */
  const updateEdit = useCallback((id: number, data: { front?: string; back?: string }) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const editFront = data.front !== undefined ? data.front : p.editFront;
        const editBack = data.back !== undefined ? data.back : p.editBack;

        // Validate fields
        const validationErrors: { front?: string; back?: string } = {};

        const frontValidation = validateFlashcardField("front", editFront);
        if (!frontValidation.isValid) {
          validationErrors.front = frontValidation.error;
        }

        const backValidation = validateFlashcardField("back", editBack);
        if (!backValidation.isValid) {
          validationErrors.back = backValidation.error;
        }

        return {
          ...p,
          editFront,
          editBack,
          validationErrors: Object.keys(validationErrors).length > 0 ? validationErrors : undefined,
        };
      })
    );
  }, []);

  /**
   * Cancels editing for a proposal
   */
  const cancelEdit = useCallback((id: number) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isEditing: false,
              editFront: p.front,
              editBack: p.back,
              validationErrors: undefined,
            }
          : p
      )
    );
  }, []);

  /**
   * Commits edit changes (updates the actual front/back values)
   */
  const commitEdit = useCallback((id: number) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              front: p.editFront,
              back: p.editBack,
              isEditing: false,
              flashcard_type: "ai-edited",
              validationErrors: undefined,
            }
          : p
      )
    );
  }, []);

  /**
   * Sets validation error for a proposal
   */
  const setValidationError = useCallback((id: number, error: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              validationErrors: {
                ...p.validationErrors,
                front: error,
              },
            }
          : p
      )
    );
  }, []);

  /**
   * Removes a proposal from the list
   */
  const removeProposal = useCallback((id: number) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /**
   * Gets a specific proposal by ID
   */
  const getProposal = useCallback(
    (id: number) => {
      return proposals.find((p) => p.id === id);
    },
    [proposals]
  );

  return {
    proposals,
    updateProposals,
    startEdit,
    updateEdit,
    cancelEdit,
    commitEdit,
    setValidationError,
    removeProposal,
    getProposal,
  };
}
