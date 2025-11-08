import type { APIRoute } from "astro";
import { z } from "zod";
import { loginUser, AuthServiceError } from "@/lib/services/authService";

export const prerender = false;

/**
 * Zod schema for login request validation
 */
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 *
 * Authenticates a user and creates a session.
 *
 * Request Body:
 * - email: string (valid email format)
 * - password: string (required)
 *
 * Responses:
 * - 200: Login successful, session cookies set
 * - 400: Invalid request data
 * - 401: Invalid credentials
 * - 403: Email not confirmed
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
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
    const validation = loginSchema.safeParse(body);
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

    // Login user through service
    const result = await loginUser(locals.supabase, {
      email,
      password,
    });

    // Set session cookies
    // Note: When using @supabase/ssr with createServerClient,
    // cookies are automatically set by the client through the middleware
    // However, we can explicitly set them here for clarity
    cookies.set("sb-access-token", result.session.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    cookies.set("sb-refresh-token", result.session.refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Return user data (without session tokens)
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
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/auth/login:", error);

    // Handle AuthServiceError with proper status codes
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

    // Handle generic errors
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
