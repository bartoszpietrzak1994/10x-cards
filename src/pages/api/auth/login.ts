import type { APIRoute } from "astro";
import { z } from "zod";
import { loginUser, AuthServiceError } from "@/lib/services/authService";
import type { LoginUserCommand } from "@/types";

// Zod schema for input validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates a user and creates a session.
 *
 * Request Body:
 * - email (string): User's email address
 * - password (string): User's password
 *
 * @returns 200 OK with user data and session cookies
 * @throws 400 Bad Request if input validation fails
 * @throws 401 Unauthorized if credentials are invalid
 * @throws 403 Forbidden if email is not confirmed
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
    const validationResult = loginSchema.safeParse(body);

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

    const validatedData = validationResult.data as LoginUserCommand;
    const supabase = locals.supabase;

    // Step 3: Authenticate user through service layer
    const result = await loginUser(supabase, validatedData);

    // Step 4: Session cookies are automatically managed by middleware
    // The createServerClient in middleware will handle setting/updating cookies

    // Step 5: Return success response
    return new Response(
      JSON.stringify({
        message: result.message,
        user: result.user,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/auth/login:", error);

    // Handle AuthServiceError with specific status codes
    if (error instanceof AuthServiceError) {
      const statusCodeMap: Record<string, number> = {
        INVALID_CREDENTIALS: 401,
        EMAIL_NOT_CONFIRMED: 403,
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

    // Handle other errors
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Login failed",
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

