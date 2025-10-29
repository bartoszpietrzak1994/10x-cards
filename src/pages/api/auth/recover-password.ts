import type { APIRoute } from "astro";
import { z } from "zod";
import { recoverPassword, AuthServiceError } from "@/lib/services/authService";

export const prerender = false;

/**
 * Zod schema for password recovery request validation
 */
const recoverPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * POST /api/auth/recover-password
 * 
 * Initiates the password recovery process by sending a recovery email.
 * 
 * Request Body:
 * - email: string (valid email format)
 * 
 * Responses:
 * - 200: Recovery email sent (or would be sent if email exists)
 * - 400: Invalid request data
 * - 500: Server error
 * 
 * Note: For security reasons, always returns 200 even if email doesn't exist
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
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

    // Validate request body
    const validation = recoverPasswordSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email } = validation.data;

    // Get the base URL from the request or environment
    const baseUrl = import.meta.env.SITE || "http://localhost:4321";
    const redirectTo = `${baseUrl}/auth/reset-password`;

    // Initiate password recovery
    await recoverPassword(locals.supabase, {
      email,
      redirectTo,
    });

    // Always return success for security reasons (don't reveal if email exists)
    return new Response(
      JSON.stringify({
        message: "If the provided email address exists in our system, we will send password reset instructions to it.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/auth/recover-password:", error);

    // Even for errors, we return a generic success message for security
    // But log the actual error for debugging
    return new Response(
      JSON.stringify({
        message: "If the provided email address exists in our system, we will send password reset instructions to it.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

