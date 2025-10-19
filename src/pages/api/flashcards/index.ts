import type { APIRoute } from "astro";
import { z } from "zod";

import { DEFAULT_USER_ID } from "@/db/supabase.client";
import {
  createManualFlashcard,
  FlashcardServiceError,
} from "@/lib/services/flashcardService";
import type { CreateManualFlashcardCommand, FlashcardDTO } from "@/types";

// Zod schema for input validation
const createManualFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, "Front text is required")
    .max(200, "Front text must not exceed 200 characters"),
  back: z
    .string()
    .min(1, "Back text is required")
    .max(500, "Back text must not exceed 500 characters"),
  flashcard_type: z.literal("manual", {
    errorMap: () => ({ message: "Flashcard type must be 'manual'" }),
  }),
});

export const prerender = false;

/**
 * POST /api/flashcards
 * Creates a new manual flashcard for the authenticated user.
 *
 * Request Body:
 * - front (string, max 200 chars): The question text
 * - back (string, max 500 chars): The answer text
 * - flashcard_type (string): Must be "manual"
 *
 * @returns 201 Created with flashcard data
 * @throws 400 Bad Request if input validation fails
 * @throws 401 Unauthorized if user is not authenticated (future implementation)
 * @throws 500 Internal Server Error for unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate input using Zod schema
    const validationResult = createManualFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errorMessages,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedData = validationResult.data as CreateManualFlashcardCommand;
    const supabase = locals.supabase;

    // Step 3: Get user ID from context
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID
    // when authentication middleware is implemented
    const userId = DEFAULT_USER_ID;

    // Step 4: Create flashcard using service layer
    const flashcard: FlashcardDTO = await createManualFlashcard(
      supabase,
      userId,
      validatedData
    );

    // Step 5: Return success response with created flashcard
    return new Response(
      JSON.stringify({
        message: "Flashcard created successfully",
        flashcard,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Global error handler
    console.error("Unexpected error in create flashcard endpoint:", error);

    // Handle FlashcardServiceError with specific error codes
    if (error instanceof FlashcardServiceError) {
      // Map error codes to HTTP status codes
      const statusCodeMap: Record<string, number> = {
        INVALID_USER_ID: 400,
        USER_NOT_FOUND: 404,
        DUPLICATE_FLASHCARD: 409,
        TEXT_TOO_LONG: 400,
        NO_DATA_RETURNED: 500,
        DATABASE_ERROR: 500,
      };

      const statusCode = statusCodeMap[error.code] || 500;

      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
        }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle generic Error instances
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Failed to create flashcard",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generic error response for unknown error types
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

