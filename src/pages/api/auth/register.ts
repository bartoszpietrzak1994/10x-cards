import type { APIRoute } from "astro";
import { z } from "zod";
import { registerUser, AuthServiceError } from "@/lib/services/authService";

export const prerender = false;

/**
 * Zod schema for registration request validation
 */
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * POST /api/auth/register
 *
 * Registers a new user in the system.
 *
 * Request Body:
 * - email: string (valid email format)
 * - password: string (minimum 6 characters)
 *
 * Responses:
 * - 201: Registration successful, confirmation email sent
 * - 400: Invalid request data
 * - 409: Email already registered
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body;
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

    // Validate request body
    const validation = registerSchema.safeParse(body);
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

    const { email, password } = validation.data;

    // Register user through service
    const result = await registerUser(locals.supabase, {
      email,
      password,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/auth/register:", error);

    // Handle AuthServiceError with proper status codes
    if (error instanceof AuthServiceError) {
      const statusCodeMap: Record<string, number> = {
        USER_ALREADY_EXISTS: 409,
        WEAK_PASSWORD: 400,
        EMAIL_SEND_FAILED: 500,
        AUTH_ERROR: 500,
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

    // Handle generic errors
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Registration failed",
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
