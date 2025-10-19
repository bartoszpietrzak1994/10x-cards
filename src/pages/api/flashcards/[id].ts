import type { APIRoute } from "astro";
import { z } from "zod";

import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { updateFlashcard, FlashcardServiceError } from "@/lib/services/flashcardService";
import type { UpdateFlashcardCommand, FlashcardDTO } from "@/types";

// Zod schema for update flashcard validation
const updateFlashcardSchema = z
  .object({
    front: z
      .string()
      .min(1, "Front text cannot be empty")
      .max(200, "Front text must not exceed 200 characters")
      .optional(),
    back: z
      .string()
      .min(1, "Back text cannot be empty")
      .max(500, "Back text must not exceed 500 characters")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

export const prerender = false;

/**
 * PUT /api/flashcards/{id}
 * Updates an existing flashcard for the authenticated user.
 *
 * Path Parameters:
 * - id (number): The flashcard identifier
 *
 * Request Body:
 * - front (string, max 200 chars, optional): The updated question text
 * - back (string, max 500 chars, optional): The updated answer text
 *
 * @returns 200 OK with updated flashcard data
 * @throws 400 Bad Request if input validation fails
 * @throws 401 Unauthorized if user is not authenticated (future implementation)
 * @throws 404 Not Found if flashcard doesn't exist or doesn't belong to user
 * @throws 500 Internal Server Error for unexpected errors
 */
export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    // Step 1: Extract and validate path parameter (id)
    const flashcardId = params.id;

    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: "Flashcard ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate that ID is a valid number
    const parsedId = parseInt(flashcardId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Parse request body
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

    // Step 3: Validate input using Zod schema
    const validationResult = updateFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(
        (err) => `${err.path.join(".") || "root"}: ${err.message}`
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

    const validatedData = validationResult.data as UpdateFlashcardCommand;
    const supabase = locals.supabase;

    // Step 4: Get user ID from context
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID
    // when authentication middleware is implemented
    const userId = DEFAULT_USER_ID;

    // Step 5: Call service layer to update flashcard
    const flashcard: FlashcardDTO = await updateFlashcard(supabase, userId, parsedId, validatedData);

    // Step 6: Return success response with updated flashcard
    return new Response(
      JSON.stringify({
        message: "Flashcard updated successfully",
        flashcard,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Global error handler
    console.error("Unexpected error in update flashcard endpoint:", error);

    // Handle FlashcardServiceError with specific error codes
    if (error instanceof FlashcardServiceError) {
      // Map error codes to HTTP status codes
      const statusCodeMap: Record<string, number> = {
        INVALID_USER_ID: 400,
        INVALID_FLASHCARD_ID: 400,
        NO_UPDATE_FIELDS: 400,
        FLASHCARD_NOT_FOUND: 404,
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
          error: "Failed to update flashcard",
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
