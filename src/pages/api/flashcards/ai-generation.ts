import type { APIRoute } from "astro";
import { z } from "zod";

import { initiateAIGeneration } from "../../../lib/services/aiGenerationService";
import { createServiceClient } from "../../../db/supabase.client";
import type { AIGenerationResponseDTO } from "../../../types";

/**
 * Cloudflare Pages runtime environment interface
 */
interface CloudflareEnv {
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

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
  // Add debug headers to ALL responses for visibility
  const debugHeaders = {
    "Content-Type": "application/json",
    "X-Debug-Timestamp": new Date().toISOString(),
    "X-Debug-User-Id": locals.user?.id || "NOT_AUTHENTICATED",
  };

  // Get Cloudflare context for waitUntil (keeps worker alive for background jobs)
  // @ts-ignore - Cloudflare-specific
  const cfContext = locals.runtime?.ctx;

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

    // Step 4: Access environment variables from Cloudflare runtime context
    // In Cloudflare Pages, non-PUBLIC env vars must be accessed via runtime.env
    // @ts-ignore - Cloudflare-specific runtime property
    const env = (locals.runtime?.env as CloudflareEnv) || {};
    
    // Try runtime context first, fallback to import.meta.env (for local dev)
    const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    const openrouterApiKey = env.OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;

    // Step 5: Comprehensive environment check with detailed diagnostics
    const envDiagnostics = {
      hasRuntimeContext: !!locals.runtime,
      hasRuntimeEnv: !!env,
      supabaseServiceRoleKey: !!supabaseServiceRoleKey,
      supabaseServiceRoleKeyLength: supabaseServiceRoleKey?.length || 0,
      openrouterApiKey: !!openrouterApiKey,
      openrouterApiKeyLength: openrouterApiKey?.length || 0,
      publicSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
      publicSupabaseAnonKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      timestamp: new Date().toISOString(),
    };

    // Add diagnostics to headers for easy debugging
    Object.assign(debugHeaders, {
      "X-Debug-Runtime": envDiagnostics.hasRuntimeContext.toString(),
      "X-Debug-Service-Key": envDiagnostics.supabaseServiceRoleKey.toString(),
      "X-Debug-OpenRouter-Key": envDiagnostics.openrouterApiKey.toString(),
    });

    // Step 6: Validate service role key availability
    if (!supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({
          error: "Service unavailable",
          message: "AI generation service is not properly configured. Please contact support.",
          debug: {
            reason: "SUPABASE_SERVICE_ROLE_KEY not configured or invalid",
            diagnostics: envDiagnostics,
            hint: "Check Cloudflare Pages environment variables in Production settings",
          }
        }),
        {
          status: 503,
          headers: debugHeaders,
        }
      );
    }

    // Step 7: Validate OpenRouter configuration
    if (!openrouterApiKey) {
      return new Response(
        JSON.stringify({
          error: "Service unavailable",
          message: "AI generation service is not properly configured. Please contact support.",
          debug: {
            reason: "OPENROUTER_API_KEY not configured or invalid",
            diagnostics: envDiagnostics,
            hint: "Check Cloudflare Pages environment variables in Production settings",
          }
        }),
        {
          status: 503,
          headers: debugHeaders,
        }
      );
    }

    // Step 8: Create service client with runtime environment variable
    let serviceClient;
    try {
      serviceClient = createServiceClient(supabaseServiceRoleKey);
    } catch (clientError) {
      return new Response(
        JSON.stringify({
          error: "Service unavailable",
          message: "Failed to initialize service client.",
          debug: {
            reason: "Service client initialization failed",
            error: clientError instanceof Error ? clientError.message : "Unknown error",
            diagnostics: envDiagnostics,
          }
        }),
        {
          status: 503,
          headers: debugHeaders,
        }
      );
    }

    // Step 9: Generate SHA-256 hash of input text (Web Crypto API - Cloudflare compatible)
    const encoder = new TextEncoder();
    const data = encoder.encode(input_text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputTextHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const inputLength = input_text.length;
    const requestTime = new Date().toISOString();

    // Step 10: Insert record into flashcards_ai_generation table
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

    // Step 11: Insert record into ai_logs table
    const { error: logError } = await supabase.from("ai_logs").insert({
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

    // Step 12: Trigger asynchronous AI processing
    // Note: In Cloudflare Workers, we use waitUntil to keep the worker alive
    // for background operations. Without it, the worker terminates after the response.
    const backgroundJob = initiateAIGeneration(
      serviceClient, 
      generationId, 
      input_text, 
      userId, 
      openrouterApiKey
    ).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // eslint-disable-next-line no-console
      console.error("Failed to initiate AI generation:", {
        generationId,
        userId,
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      
      // Error is logged but doesn't affect the response
      // The generation record is already created
      // The error will be recorded in ai_logs by the service itself
    });

    // Keep the worker alive for background processing (Cloudflare Workers requirement)
    if (cfContext?.waitUntil) {
      cfContext.waitUntil(backgroundJob);
      Object.assign(debugHeaders, { "X-Debug-WaitUntil": "true" });
    } else {
      // Local development fallback - just continue with fire-and-forget
      // eslint-disable-next-line no-console
      console.warn("waitUntil not available - background job may not complete in production");
      Object.assign(debugHeaders, { "X-Debug-WaitUntil": "false" });
    }

    // Step 13: Return 202 Accepted response
    const response: AIGenerationResponseDTO = {
      message: "AI generation initiated",
      generation_id: generationId,
      status: "processing",
    };

    return new Response(JSON.stringify(response), {
      status: 202,
      headers: debugHeaders,
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
