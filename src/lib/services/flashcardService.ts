import type { Database } from "@/db/database.types";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateManualFlashcardCommand, FlashcardDTO, UpdateFlashcardCommand } from "../../types";

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
    throw new FlashcardServiceError("Invalid user ID provided", "INVALID_USER_ID");
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
      throw new FlashcardServiceError("User not found in the system", "USER_NOT_FOUND", flashcardError);
    }

    if (flashcardError.code === "23505") {
      // Unique constraint violation
      throw new FlashcardServiceError("Flashcard already exists", "DUPLICATE_FLASHCARD", flashcardError);
    }

    if (flashcardError.code === "22001") {
      // String data right truncation - text too long
      throw new FlashcardServiceError("Flashcard text exceeds maximum allowed length", "TEXT_TOO_LONG", flashcardError);
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
    throw new FlashcardServiceError("Failed to retrieve created flashcard", "NO_DATA_RETURNED");
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

/**
 * Updates an existing flashcard for a user.
 *
 * This function handles the business logic for updating a flashcard,
 * including validation that the flashcard belongs to the user,
 * database interaction, and data transformation.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user updating the flashcard
 * @param flashcardId - ID of the flashcard to update
 * @param command - Command containing updated flashcard data (front and/or back)
 * @returns Promise resolving to the updated flashcard DTO
 * @throws FlashcardServiceError if flashcard not found, doesn't belong to user, or database operation fails
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: number,
  command: UpdateFlashcardCommand
): Promise<FlashcardDTO> {
  // Validate user ID format
  if (!userId || typeof userId !== "string") {
    throw new FlashcardServiceError("Invalid user ID provided", "INVALID_USER_ID");
  }

  // Validate flashcard ID
  if (!flashcardId || flashcardId <= 0) {
    throw new FlashcardServiceError("Invalid flashcard ID provided", "INVALID_FLASHCARD_ID");
  }

  // Validate that at least one field is being updated
  if (!command.front && !command.back) {
    throw new FlashcardServiceError(
      "At least one field (front or back) must be provided for update",
      "NO_UPDATE_FIELDS"
    );
  }

  // First, check if the flashcard exists and belongs to the user
  const { data: existingFlashcard, error: fetchError } = await supabase
    .from("flashcards")
    .select("id, user_id, flashcard_type")
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    console.error("Database error while fetching flashcard:", {
      error: fetchError,
      flashcardId,
      userId,
    });

    // Handle case where flashcard doesn't exist or doesn't belong to user
    if (fetchError.code === "PGRST116") {
      // PostgREST error for no rows returned
      throw new FlashcardServiceError(
        "Flashcard not found or does not belong to user",
        "FLASHCARD_NOT_FOUND",
        fetchError
      );
    }

    throw new FlashcardServiceError(fetchError.message || "Failed to fetch flashcard", "DATABASE_ERROR", fetchError);
  }

  if (!existingFlashcard) {
    throw new FlashcardServiceError("Flashcard not found or does not belong to user", "FLASHCARD_NOT_FOUND");
  }

  // Build update object with only provided fields
  const updateData: Partial<{ front: string; back: string; flashcard_type: Database["public"]["Enums"]["card_type"] }> =
    {};
  if (command.front !== undefined) {
    updateData.front = command.front;
  }
  if (command.back !== undefined) {
    updateData.back = command.back;
  }

  // State machine logic for flashcard_type:
  // - "manual" → remains "manual" (no change)
  // - "ai-edited" → remains "ai-edited" (no change)
  // - "ai-generated" → changes to "ai-edited"
  // - "ai-proposal" → remains "ai-proposal" (no change)
  if (existingFlashcard.flashcard_type === "ai-generated") {
    updateData.flashcard_type = "ai-edited";
  }

  // Update the flashcard in the database
  const { data: flashcardData, error: updateError } = await supabase
    .from("flashcards")
    .update(updateData)
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .select("id, front, back, flashcard_type, created_at, ai_generation_id")
    .single();

  // Handle database errors with specific error codes
  if (updateError) {
    console.error("Database error while updating flashcard:", {
      error: updateError,
      flashcardId,
      userId,
      command,
    });

    if (updateError.code === "22001") {
      // String data right truncation - text too long
      throw new FlashcardServiceError("Flashcard text exceeds maximum allowed length", "TEXT_TOO_LONG", updateError);
    }

    // Generic database error
    throw new FlashcardServiceError(updateError.message || "Failed to update flashcard", "DATABASE_ERROR", updateError);
  }

  // Handle case where no data is returned
  if (!flashcardData) {
    console.error("No data returned after flashcard update");
    throw new FlashcardServiceError("Failed to retrieve updated flashcard", "NO_DATA_RETURNED");
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
