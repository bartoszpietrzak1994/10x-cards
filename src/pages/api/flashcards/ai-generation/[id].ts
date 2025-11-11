import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/flashcards/ai-generation/[id]
 * Fetches AI generation status, metadata, and related data
 *
 * @returns 200 OK with generation data
 * @throws 401 Unauthorized if user is not authenticated
 * @throws 403 Forbidden if user doesn't own this generation
 * @throws 404 Not Found if generation doesn't exist
 * @throws 500 Internal Server Error for unexpected errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to access generation data",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate generation ID
    const generationId = parseInt(params.id || "", 10);
    if (isNaN(generationId)) {
      return new Response(
        JSON.stringify({
          error: "Invalid generation ID",
          message: "Generation ID must be a valid number",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = locals.supabase;

    // Step 3: Fetch generation metadata (also verifies ownership via RLS)
    const { data: generationMeta, error: generationError } = await supabase
      .from("flashcards_ai_generation")
      .select("request_time, response_time, token_count, model, generated_flashcards_count")
      .eq("id", generationId)
      .single();

    if (generationError) {
      if (generationError.code === "PGRST116") {
        // No rows returned - either doesn't exist or user doesn't own it
        return new Response(
          JSON.stringify({
            error: "Not found",
            message: "Generation not found or you don't have access to it",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // eslint-disable-next-line no-console
      console.error("Error fetching generation metadata:", generationError);
      throw generationError;
    }

    // Step 4: Fetch AI log
    const { data: aiLog, error: logError } = await supabase
      .from("ai_logs")
      .select("request_time, response_time, token_count, error_info")
      .eq("flashcards_generation_id", generationId)
      .single();

    if (logError && logError.code !== "PGRST116") {
      // Log error but don't fail the request
      // eslint-disable-next-line no-console
      console.error("Error fetching AI log:", logError);
    }

    // Step 5: Fetch proposals
    const { data: proposals, error: proposalsError } = await supabase
      .from("flashcards")
      .select("id, front, back, flashcard_type, created_at, ai_generation_id")
      .eq("ai_generation_id", generationId)
      .in("flashcard_type", ["ai-generated", "ai-proposal"])
      .order("created_at", { ascending: true });

    if (proposalsError) {
      // eslint-disable-next-line no-console
      console.error("Error fetching proposals:", proposalsError);
      throw proposalsError;
    }

    // Step 6: Determine status
    let status: "processing" | "completed" | "failed" = "processing";
    if (aiLog?.error_info) {
      status = "failed";
    } else if (generationMeta.response_time) {
      status = "completed";
    }

    // eslint-disable-next-line no-console
    console.log("[AI Generation GET API] Generation ID:", generationId, "Status:", status, "response_time:", generationMeta.response_time);

    // Step 7: Return response
    return new Response(
      JSON.stringify({
        status,
        generationMeta,
        aiLog: aiLog || null,
        proposals: proposals || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in AI generation GET endpoint:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while fetching generation data",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

