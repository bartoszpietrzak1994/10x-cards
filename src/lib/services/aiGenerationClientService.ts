import type { AIGenerationResponseDTO, InitiateAIGenerationCommand } from "@/types";

/**
 * Client-side service for AI generation operations
 * Handles API calls and data fetching for AI flashcard generation
 * All operations use authenticated API endpoints (not direct Supabase client)
 */
export class AIGenerationClientService {
  constructor() {}

  /**
   * Initiates a new AI generation request
   */
  async initiateGeneration(command: InitiateAIGenerationCommand): Promise<AIGenerationResponseDTO> {
    const response = await fetch("/api/flashcards/ai-generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details?.[0] || "Failed to initiate generation");
    }

    return await response.json();
  }

  /**
   * Fetches all generation data (meta, log, and proposals)
   * Uses authenticated API endpoint to ensure proper RLS access
   */
  async fetchGenerationData(generationId: number) {
    // eslint-disable-next-line no-console
    console.log("[AIGenerationClientService] Fetching generation data for ID:", generationId);
    
    const response = await fetch(`/api/flashcards/ai-generation/${generationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin", // Include cookies for authentication
    });

    // eslint-disable-next-line no-console
    console.log("[AIGenerationClientService] Response status:", response.status);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("You must be logged in to view generation data");
      }
      if (response.status === 404) {
        throw new Error("Generation not found");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch generation data: ${response.status}`);
    }

    const data = await response.json();
    // eslint-disable-next-line no-console
    console.log("[AIGenerationClientService] Received data:", data);
    
    return data;
  }

  /**
   * Updates a flashcard
   */
  async updateFlashcard(id: number, data: { front: string; back: string }): Promise<void> {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update flashcard");
    }
  }

  /**
   * Deletes a flashcard
   */
  async deleteFlashcard(id: number): Promise<void> {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete flashcard");
    }
  }
}

/**
 * Factory function to create AIGenerationClientService instance
 */
export function createAIGenerationClientService(): AIGenerationClientService {
  return new AIGenerationClientService();
}
