import type { APIRoute } from "astro";
import { createHash } from "crypto";
import { z } from "zod";

import { initiateAIGeneration } from "../../../lib/services/aiGenerationService";
import type { AIGenerationResponseDTO } from "../../../types";
import { supabaseServiceClient } from "@/db/supabase.client";

// Zod schema for input validation
const initiateAIGenerationSchema = z.object({
  input_text: z
    .string()
    .min(1000, "Input text must be at least 1000 characters")
    .max(10000, "Input text must not exceed 10000 characters"),
});

export const prerender = false;

/**
 * POST /api/flashcards/ai-generation
 * Initiates AI flashcards generation from user-provided text.
 *
 * @returns 202 Accepted with generation_id and status "processing"
 * @throws 400 Bad Request if input validation fails
 * @throws 500 Internal Server Error for unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse and validate request body
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
    const validationResult = initiateAIGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);

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

    const { input_text } = validationResult.data;
    const supabase = locals.supabase;

    // Step 3: Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to generate flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = locals.user.id;

    // Step 4: Generate MD5 hash of input text
    const inputTextHash = createHash("md5").update(input_text).digest("hex");
    const inputLength = input_text.length;
    const requestTime = new Date().toISOString();

    // Step 5: Insert record into flashcards_ai_generation table
    const { data: generationData, error: generationError } = await supabase
      .from("flashcards_ai_generation")
      .insert({
        user_id: userId,
        request_time: requestTime,
      })
      .select("id")
      .single();

    if (generationError || !generationData) {
      // eslint-disable-next-line no-console
      console.error("Failed to insert AI generation record:", generationError);
      return new Response(
        JSON.stringify({
          error: "Failed to initiate AI generation",
          details: generationError?.message || "Unknown database error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const generationId = generationData.id;

    // Step 6: Insert record into ai_logs table
    // Use service client to bypass RLS for ai_logs
    const { error: logError } = await supabaseServiceClient.from("ai_logs").insert({
      flashcards_generation_id: generationId,
      request_time: requestTime,
      input_length: inputLength,
      input_text_hash: inputTextHash,
    });

    if (logError) {
      // eslint-disable-next-line no-console
      console.error("Failed to insert AI log record:", logError);
      // Continue despite log error - generation record is created
    }

    // Step 7: Trigger asynchronous AI processing
    // Note: This is fire-and-forget - we don't await the result
    // In production, this would queue a background job
    // Use service client to bypass RLS for AI-generated flashcards
    initiateAIGeneration(supabaseServiceClient, generationId, input_text, userId).catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed to initiate AI generation:", error);
      // Error is logged but doesn't affect the response
      // The generation record is already created
    });

    // Step 8: Return 202 Accepted response
    const response: AIGenerationResponseDTO = {
      message: "AI generation initiated",
      generation_id: generationId,
      status: "processing",
    };

    return new Response(JSON.stringify(response), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Global error handler
    // eslint-disable-next-line no-console
    console.error("Unexpected error in AI generation endpoint:", error);

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
