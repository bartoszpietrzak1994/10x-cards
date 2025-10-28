import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { LoginUserCommand, UserDTO, LoginResponseDTO } from "@/types";
import type { Session } from "@supabase/supabase-js";

/**
 * Custom error class for authentication service errors
 */
export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

/**
 * Error codes:
 * - USER_ALREADY_EXISTS: Email already registered
 * - WEAK_PASSWORD: Password does not meet requirements
 * - EMAIL_SEND_FAILED: Failed to send email
 * - INVALID_CREDENTIALS: Invalid login credentials
 * - EMAIL_NOT_CONFIRMED: Email has not been confirmed
 * - INVALID_TOKEN: Token is invalid
 * - TOKEN_EXPIRED: Token has expired
 * - AUTH_ERROR: General Supabase Auth error
 * - DATABASE_ERROR: Database error
 */

/**
 * Logs a user into the system.
 * 
 * Process:
 * 1. Authenticates user with Supabase Auth using email and password
 * 2. Verifies that email has been confirmed
 * 3. Fetches user data from public.users table (including role)
 * 4. Returns session and user data
 * 
 * @param supabase - Supabase client
 * @param command - Login credentials (email, password)
 * @returns Promise with user data and session
 * @throws AuthServiceError
 */
export async function loginUser(
  supabase: SupabaseClient<Database>,
  command: LoginUserCommand
): Promise<LoginResponseDTO & { session: Session }> {
  try {
    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    });

    if (error) {
      // Handle specific authentication errors
      if (error.message.includes("Invalid login credentials")) {
        throw new AuthServiceError(
          "Invalid email or password",
          "INVALID_CREDENTIALS",
          error
        );
      }

      if (error.message.includes("Email not confirmed")) {
        throw new AuthServiceError(
          "Your account has not been confirmed yet. Please check your email inbox.",
          "EMAIL_NOT_CONFIRMED",
          error
        );
      }

      throw new AuthServiceError(
        "Authentication failed",
        "AUTH_ERROR",
        error
      );
    }

    if (!data.session || !data.user) {
      throw new AuthServiceError(
        "No session returned after authentication",
        "AUTH_ERROR"
      );
    }

    // Check if email is confirmed (additional safety check)
    if (!data.user.email_confirmed_at) {
      throw new AuthServiceError(
        "Your account has not been confirmed yet. Please check your email inbox.",
        "EMAIL_NOT_CONFIRMED"
      );
    }

    // Fetch user data from public.users table with role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, roles(name)")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      throw new AuthServiceError(
        "Failed to fetch user data",
        "DATABASE_ERROR",
        userError
      );
    }

    if (!userData) {
      throw new AuthServiceError(
        "User not found in database",
        "DATABASE_ERROR"
      );
    }

    // Create UserDTO
    const user: UserDTO = {
      id: userData.id,
      email: userData.email,
      role: (userData.roles as any)?.name || "user",
    };

    return {
      message: "Login successful",
      user,
      session: data.session,
    };
  } catch (error) {
    // Re-throw AuthServiceError as-is
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error("Unexpected error in loginUser:", error);
    throw new AuthServiceError(
      "An unexpected error occurred during login",
      "AUTH_ERROR",
      error
    );
  }
}

/**
 * Helper function to get user data from session.
 * Used by middleware and other services.
 * 
 * @param supabase - Supabase client
 * @param userId - ID of the user from auth.users
 * @returns Promise with user data (UserDTO)
 * @throws AuthServiceError
 */
export async function getUserFromSession(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserDTO> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, roles(name)")
      .eq("id", userId)
      .single();

    if (error) {
      throw new AuthServiceError(
        "Failed to fetch user data",
        "DATABASE_ERROR",
        error
      );
    }

    if (!data) {
      throw new AuthServiceError(
        "User not found in database",
        "DATABASE_ERROR"
      );
    }

    return {
      id: data.id,
      email: data.email,
      role: (data.roles as any)?.name || "user",
    };
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    console.error("Unexpected error in getUserFromSession:", error);
    throw new AuthServiceError(
      "Failed to get user from session",
      "DATABASE_ERROR",
      error
    );
  }
}

