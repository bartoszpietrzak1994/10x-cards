import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateManualFlashcardCommand, FlashcardDTO } from "../../types";

/**
 * Custom error class for flashcard service errors
 */
export class FlashcardServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

/**
 * Creates a new manual flashcard for a user.
 *
 * This function handles the business logic for creating a manual flashcard,
 * including database interaction and data transformation.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user creating the flashcard
 * @param command - Command containing flashcard data (front, back, flashcard_type)
 * @returns Promise resolving to the created flashcard DTO
 * @throws FlashcardServiceError if database operation fails
 */
export async function createManualFlashcard(
  supabase: SupabaseClient,
  userId: string,
  command: CreateManualFlashcardCommand
): Promise<FlashcardDTO> {
  // Validate user ID format
  if (!userId || typeof userId !== "string") {
    throw new FlashcardServiceError(
      "Invalid user ID provided",
      "INVALID_USER_ID"
    );
  }

  // Insert the flashcard into the database
  const { data: flashcardData, error: flashcardError } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      front: command.front,
      back: command.back,
      flashcard_type: command.flashcard_type,
    })
    .select("id, front, back, flashcard_type, created_at, ai_generation_id")
    .single();

  // Handle database errors with specific error codes
  if (flashcardError) {
    console.error("Database error while creating flashcard:", {
      error: flashcardError,
      userId,
      command,
    });

    // Check for specific error codes
    if (flashcardError.code === "23503") {
      // Foreign key violation - user doesn't exist
      throw new FlashcardServiceError(
        "User not found in the system",
        "USER_NOT_FOUND",
        flashcardError
      );
    }

    if (flashcardError.code === "23505") {
      // Unique constraint violation
      throw new FlashcardServiceError(
        "Flashcard already exists",
        "DUPLICATE_FLASHCARD",
        flashcardError
      );
    }

    if (flashcardError.code === "22001") {
      // String data right truncation - text too long
      throw new FlashcardServiceError(
        "Flashcard text exceeds maximum allowed length",
        "TEXT_TOO_LONG",
        flashcardError
      );
    }

    // Generic database error
    throw new FlashcardServiceError(
      flashcardError.message || "Failed to create flashcard",
      "DATABASE_ERROR",
      flashcardError
    );
  }

  // Handle case where no data is returned
  if (!flashcardData) {
    console.error("No data returned after flashcard creation");
    throw new FlashcardServiceError(
      "Failed to retrieve created flashcard",
      "NO_DATA_RETURNED"
    );
  }

  // Transform database result to DTO
  const flashcardDTO: FlashcardDTO = {
    id: flashcardData.id,
    front: flashcardData.front,
    back: flashcardData.back,
    flashcard_type: flashcardData.flashcard_type,
    created_at: flashcardData.created_at,
    ai_generation_id: flashcardData.ai_generation_id,
  };

  return flashcardDTO;
}

