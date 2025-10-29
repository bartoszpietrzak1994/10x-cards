import type { APIRoute } from "astro";
import { z } from "zod";
import { resetPassword, AuthServiceError } from "@/lib/services/authService";

export const prerender = false;

/**
 * Zod schema for password reset request validation
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * POST /api/auth/reset-password
 * 
 * Resets the user's password using a recovery token.
 * 
 * Request Body:
 * - token: string (recovery token from email)
 * - password: string (new password, minimum 6 characters)
 * 
 * Responses:
 * - 200: Password reset successful
 * - 400: Invalid request data or token expired/invalid
 * - 500: Server error
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
    const validation = resetPasswordSchema.safeParse(body);
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

    const { token, password } = validation.data;

    // Reset password through service
    await resetPassword(locals.supabase, {
      token,
      password,
    });

    return new Response(
      JSON.stringify({
        message: "Password has been reset successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/auth/reset-password:", error);

    // Handle AuthServiceError with proper status codes
    if (error instanceof AuthServiceError) {
      const statusCodeMap: Record<string, number> = {
        INVALID_TOKEN: 400,
        TOKEN_EXPIRED: 400,
        AUTH_ERROR: 500,
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

    // Handle generic errors
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Password reset failed",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fallback for unknown errors
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

