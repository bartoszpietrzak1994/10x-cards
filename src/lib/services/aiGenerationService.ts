import type { SupabaseClient } from "../../db/supabase.client";
import { createOpenRouterService } from "./openrouterService";
import type { ResponseFormat, ParsedResponse } from "./openrouter.types";

/**
 * Type definition for a generated flashcard from AI response
 */
export interface GeneratedFlashcard {
  front: string;
  back: string;
}

/**
 * Type definition for AI generation response schema
 * This matches the expected JSON structure from OpenRouter API
 */
export interface AIFlashcardsResponse {
  flashcards: GeneratedFlashcard[];
}

/**
 * JSON schema for flashcard generation response
 * This ensures the AI returns a structured, valid response
 */
const FLASHCARDS_RESPONSE_SCHEMA: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcards_generation_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: {
                type: "string",
                maxLength: 200,
                description: "The question or prompt side of the flashcard",
              },
              back: {
                type: "string",
                maxLength: 500,
                description: "The answer or explanation side of the flashcard",
              },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
          minItems: 1,
          maxItems: 20,
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    },
  },
};

/**
 * System prompt for flashcard generation
 */
const FLASHCARDS_GENERATION_SYSTEM_PROMPT = `You are an expert educational content creator specialized in generating high-quality flashcards for effective learning.

Your task is to analyze the provided text and create concise, focused flashcards that:
1. Extract key concepts, definitions, facts, and important details
2. Create clear, specific questions on the front side
3. Provide accurate, concise answers on the back side
4. Use simple, direct language
5. Focus on one concept per flashcard
6. Ensure questions are self-contained and don't require external context

Guidelines:
- Front side: Keep questions clear and specific (max 200 characters)
- Back side: Keep answers concise and accurate (max 500 characters)
- Generate between 3-20 flashcards depending on content richness
- Prioritize quality over quantity
- Avoid overly complex or ambiguous questions

Return your response as a JSON object with an array of flashcards.`;

/**
 * Initiates asynchronous AI flashcards generation process.
 *
 * This function orchestrates the complete AI generation workflow:
 * 1. Calls OpenRouter API to generate flashcards
 * 2. Parses and validates the AI response
 * 3. Creates flashcard proposals in the database
 * 4. Updates generation and logging records with metadata
 *
 * @param supabase - Supabase client instance
 * @param generationId - ID of the generation record
 * @param inputText - The text to generate flashcards from (1000-10000 characters)
 * @param userId - User ID for creating flashcard proposals
 * @param openRouterApiKey - OpenRouter API key from runtime context (required for Cloudflare Workers)
 * @throws Error if AI generation fails or response is invalid
 */
export async function initiateAIGeneration(
  supabase: SupabaseClient,
  generationId: number,
  inputText: string,
  userId: string,
  openRouterApiKey: string
): Promise<void> {
  // Validate input parameters
  if (!inputText || inputText.trim().length === 0) {
    throw new Error("Input text cannot be empty");
  }

  if (inputText.length < 1000 || inputText.length > 10000) {
    throw new Error("Input text must be between 1000 and 10000 characters");
  }

  const startTime = new Date();

  try {
    // Initialize OpenRouter service with error handling
    let openRouterService;
    try {
      openRouterService = createOpenRouterService(openRouterApiKey);
    } catch (serviceError) {
      const configError = serviceError instanceof Error 
        ? serviceError.message 
        : "Failed to initialize OpenRouter service";
      
      // eslint-disable-next-line no-console
      console.error("OpenRouter service initialization failed:", {
        generationId,
        error: configError,
        hasApiKey: !!openRouterApiKey,
        apiKeyLength: openRouterApiKey?.length || 0,
        timestamp: new Date().toISOString(),
      });
      
      throw new Error(`Configuration error: ${configError}`);
    }

    // Prepare user message
    const userMessage = `Please analyze the following text and generate educational flashcards:

${inputText}

Generate flashcards that will help someone learn and remember the key information from this text.`;

    // Call OpenRouter API with flashcard generation configuration and timeout
    let response: ParsedResponse;
    try {
      // Add timeout wrapper for API call (45 seconds to stay under 30-40s requirement)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI generation timeout - request took longer than 45 seconds")), 45000);
      });

      const apiPromise = openRouterService.sendChat(FLASHCARDS_GENERATION_SYSTEM_PROMPT, userMessage, {
        responseFormat: FLASHCARDS_RESPONSE_SCHEMA,
        modelParams: {
          temperature: 0.7,
          max_tokens: 2000,
        },
      });

      response = await Promise.race([apiPromise, timeoutPromise]);
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : "Unknown API error";
      
      // eslint-disable-next-line no-console
      console.error("OpenRouter API call failed:", {
        generationId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      // Categorize error types for better error messages
      if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
        throw new Error("AI service timeout - please try again with shorter text");
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        throw new Error("AI service rate limit exceeded - please try again in a few moments");
      } else if (errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
        throw new Error("AI service authentication failed - please contact support");
      } else if (errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
        throw new Error("AI service unavailable - please try again later");
      } else {
        throw new Error(`AI service error: ${errorMessage}`);
      }
    }

    // Parse AI response with error handling
    let parsedContent;
    try {
      parsedContent = parseAIResponse(response.content);
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : "Failed to parse AI response";
      
      // eslint-disable-next-line no-console
      console.error("AI response parsing failed:", {
        generationId,
        error: errorMessage,
        responseContent: response.content?.substring(0, 200), // Log first 200 chars for debugging
        timestamp: new Date().toISOString(),
      });
      
      throw new Error(`Invalid AI response format: ${errorMessage}`);
    }

    // Validate flashcards
    if (!parsedContent.flashcards || parsedContent.flashcards.length === 0) {
      throw new Error("AI generated no flashcards - the input text might not contain sufficient content for flashcard generation");
    }

    // Calculate response time
    const endTime = new Date();
    const responseTime = endTime.toISOString();

    // Process the response and create flashcard proposals with error handling
    try {
      await processAIResponse(supabase, generationId, userId, parsedContent.flashcards, {
        tokenCount: response.usage?.total_tokens || 0,
        model: response.model || "unknown",
        responseTime: responseTime,
        requestTime: startTime.toISOString(),
      });
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : "Database operation failed";
      
      // eslint-disable-next-line no-console
      console.error("Database operation failed while processing AI response:", {
        generationId,
        error: errorMessage,
        flashcardsCount: parsedContent.flashcards.length,
        timestamp: new Date().toISOString(),
      });
      
      // Check for specific database errors
      if (errorMessage.includes("connection") || errorMessage.includes("timeout")) {
        throw new Error("Database connection error - please try again");
      } else if (errorMessage.includes("permission") || errorMessage.includes("policy")) {
        throw new Error("Database permission error - please contact support");
      } else {
        throw new Error(`Failed to save flashcards: ${errorMessage}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log("AI Generation completed successfully:", {
      generationId,
      flashcardsCount: parsedContent.flashcards.length,
      model: response.model,
      tokenCount: response.usage?.total_tokens,
    });
  } catch (error) {
    // Handle errors and update database records
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // eslint-disable-next-line no-console
    console.error("AI Generation failed:", {
      generationId,
      error: errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Update ai_logs with error information
    await updateGenerationError(supabase, generationId, errorMessage);

    // Re-throw error to be handled by the caller
    throw error;
  }
}

/**
 * Processes AI response and creates flashcard proposals.
 *
 * This function handles:
 * 1. Creating flashcard proposals in the database
 * 2. Updating flashcards_ai_generation record with metadata
 * 3. Updating ai_logs record with timing and token information
 *
 * @param supabase - Supabase client instance
 * @param generationId - ID of the generation record
 * @param userId - User ID for creating flashcard proposals
 * @param flashcards - Array of generated flashcards
 * @param metadata - Metadata about the AI generation (tokens, model, timing)
 * @throws Error if database operations fail
 */
async function processAIResponse(
  supabase: SupabaseClient,
  generationId: number,
  userId: string,
  flashcards: GeneratedFlashcard[],
  metadata: {
    tokenCount: number;
    model: string;
    responseTime: string;
    requestTime: string;
  }
): Promise<void> {
  // Validate flashcards array
  if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
    throw new Error("Invalid flashcards array");
  }

  // Validate each flashcard
  for (const card of flashcards) {
    if (!card.front || card.front.trim().length === 0) {
      throw new Error("Flashcard front cannot be empty");
    }
    if (!card.back || card.back.trim().length === 0) {
      throw new Error("Flashcard back cannot be empty");
    }
    if (card.front.length > 200) {
      throw new Error("Flashcard front exceeds maximum length of 200 characters");
    }
    if (card.back.length > 500) {
      throw new Error("Flashcard back exceeds maximum length of 500 characters");
    }
  }

  try {
    // Create flashcard proposals in the database
    const flashcardInserts = flashcards.map((card) => ({
      user_id: userId,
      ai_generation_id: generationId,
      front: card.front.trim(),
      back: card.back.trim(),
      flashcard_type: "ai-proposal" as const,
    }));

    const { error: flashcardsError } = await supabase.from("flashcards").insert(flashcardInserts);

    if (flashcardsError) {
      // eslint-disable-next-line no-console
      console.error("Failed to insert flashcards:", {
        generationId,
        userId,
        flashcardsCount: flashcards.length,
        error: flashcardsError,
        errorCode: flashcardsError.code,
        errorDetails: flashcardsError.details,
        errorHint: flashcardsError.hint,
      });
      
      throw new Error(`Failed to create flashcard proposals: ${flashcardsError.message} (code: ${flashcardsError.code})`);
    }

    // Update flashcards_ai_generation record with metadata
    const { error: generationError } = await supabase
      .from("flashcards_ai_generation")
      .update({
        response_time: metadata.responseTime,
        token_count: metadata.tokenCount,
        generated_flashcards_count: flashcards.length,
        model: metadata.model,
      })
      .eq("id", generationId);

    if (generationError) {
      // eslint-disable-next-line no-console
      console.error("Failed to update generation record:", {
        generationId,
        error: generationError,
        errorCode: generationError.code,
        errorDetails: generationError.details,
      });
      
      throw new Error(`Failed to update generation record: ${generationError.message} (code: ${generationError.code})`);
    }

    // Update ai_logs record with timing and token information
    const { error: logError } = await supabase
      .from("ai_logs")
      .update({
        response_time: metadata.responseTime,
        token_count: metadata.tokenCount,
      })
      .eq("flashcards_generation_id", generationId);

    if (logError) {
      // eslint-disable-next-line no-console
      console.error("Failed to update ai_logs:", {
        generationId,
        error: logError,
        errorCode: logError.code,
        errorDetails: logError.details,
      });
      
      throw new Error(`Failed to update ai_logs: ${logError.message} (code: ${logError.code})`);
    }

    // eslint-disable-next-line no-console
    console.log("Flashcard proposals created successfully:", {
      generationId,
      flashcardsCount: flashcards.length,
      tokenCount: metadata.tokenCount,
    });
  } catch (error) {
    // Log error for debugging with full context
    // eslint-disable-next-line no-console
    console.error("Failed to process AI response:", {
      generationId,
      userId,
      flashcardsCount: flashcards.length,
      error: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

/**
 * Parses the AI response content into structured flashcard data
 *
 * @param content - Raw content string from AI response
 * @returns Parsed flashcards response object
 * @throws Error if parsing fails or response is invalid
 */
function parseAIResponse(content: string): AIFlashcardsResponse {
  if (!content || content.trim().length === 0) {
    throw new Error("AI response content is empty");
  }

  // eslint-disable-next-line no-console
  console.log("AI response content:", content);

  try {
    const parsed = JSON.parse(content);

    // Validate structure
    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error("Invalid response structure: missing flashcards array");
    }

    return parsed as AIFlashcardsResponse;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI response as JSON");
    }
    throw error;
  }
}

/**
 * Updates generation record with error information
 *
 * @param supabase - Supabase client instance
 * @param generationId - ID of the generation record
 * @param errorMessage - Error message to log
 */
async function updateGenerationError(
  supabase: SupabaseClient,
  generationId: number,
  errorMessage: string
): Promise<void> {
  try {
    // Truncate error message if too long to fit in database
    const truncatedError = errorMessage.length > 1000 
      ? errorMessage.substring(0, 997) + "..." 
      : errorMessage;

    // Update ai_logs with error information
    const { error: updateError } = await supabase
      .from("ai_logs")
      .update({
        error_info: truncatedError,
        response_time: new Date().toISOString(),
      })
      .eq("flashcards_generation_id", generationId);

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("Failed to update error in ai_logs:", {
        generationId,
        updateError,
        errorCode: updateError.code,
        errorDetails: updateError.details,
        originalError: truncatedError,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log("Error logged to ai_logs:", {
        generationId,
        errorMessage: truncatedError,
      });
    }
  } catch (error) {
    // Last resort error logging - if we can't update the database, at least log to console
    // eslint-disable-next-line no-console
    console.error("Critical: Failed to update error in ai_logs (exception caught):", {
      generationId,
      error: error instanceof Error ? error.message : "Unknown error",
      errorStack: error instanceof Error ? error.stack : undefined,
      originalError: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
