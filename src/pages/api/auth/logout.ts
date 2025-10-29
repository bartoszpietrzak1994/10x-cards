import type { APIRoute } from "astro";
import { logoutUser, AuthServiceError } from "@/lib/services/authService";

export const prerender = false;

/**
 * POST /api/auth/logout
 * 
 * Logs out the current user and clears session.
 * 
 * Responses:
 * - 200: Logout successful
 * - 401: Not authenticated
 * - 500: Server error
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Logout user through service
    await logoutUser(locals.supabase);

    // Clear session cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    return new Response(
      JSON.stringify({
        message: "Logout successful",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/auth/logout:", error);

    // Handle AuthServiceError
    if (error instanceof AuthServiceError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle generic errors
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Logout failed",
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

