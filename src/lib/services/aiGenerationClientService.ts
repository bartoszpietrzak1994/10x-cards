import type { SupabaseClient } from "@/db/supabase.client";
import type {
  AIGenerationResponseDTO,
  AILogDTO,
  FlashcardProposal,
  InitiateAIGenerationCommand,
} from "@/types";

/**
 * Client-side service for AI generation operations
 * Handles API calls and data fetching for AI flashcard generation
 */
export class AIGenerationClientService {
  constructor(private supabase: SupabaseClient) {}

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
      throw new Error(
        errorData.error || errorData.details?.[0] || "Failed to initiate generation"
      );
    }

    return await response.json();
  }

  /**
   * Fetches generation metadata
   */
  async fetchGenerationMeta(generationId: number) {
    const { data, error } = await this.supabase
      .from("flashcards_ai_generation")
      .select("request_time, response_time, token_count, model, generated_flashcards_count")
      .eq("id", generationId)
      .single();

    if (error) {
      console.error("Error fetching generation data:", error);
      return null;
    }

    return data;
  }

  /**
   * Fetches AI log for a generation
   */
  async fetchAILog(generationId: number): Promise<AILogDTO | null> {
    const { data, error } = await this.supabase
      .from("ai_logs")
      .select("request_time, response_time, token_count, error_info")
      .eq("flashcards_generation_id", generationId)
      .single();

    if (error) {
      console.error("Error fetching AI log:", error);
      return null;
    }

    return data;
  }

  /**
   * Fetches proposals for a generation
   */
  async fetchProposals(generationId: number): Promise<FlashcardProposal[]> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("id, front, back, flashcard_type, created_at, ai_generation_id")
      .eq("ai_generation_id", generationId)
      .in("flashcard_type", ["ai-generated", "ai-proposal"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching proposals:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Fetches all generation data (meta, log, and proposals)
   */
  async fetchGenerationData(generationId: number) {
    const [generationMeta, aiLog, proposals] = await Promise.all([
      this.fetchGenerationMeta(generationId),
      this.fetchAILog(generationId),
      this.fetchProposals(generationId),
    ]);

    // Determine status
    let status: "processing" | "completed" | "failed" = "processing";
    if (aiLog?.error_info) {
      status = "failed";
    } else if (generationMeta?.response_time) {
      status = "completed";
    }

    return {
      status,
      generationMeta,
      aiLog,
      proposals,
    };
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
export function createAIGenerationClientService(supabase: SupabaseClient): AIGenerationClientService {
  return new AIGenerationClientService(supabase);
}

