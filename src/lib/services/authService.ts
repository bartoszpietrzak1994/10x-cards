import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RegisterUserCommand,
  LoginUserCommand,
  RecoverPasswordCommand,
  ResetPasswordCommand,
  UserDTO,
  RegisterResponseDTO,
  LoginResponseDTO,
} from "@/types";

/**
 * Custom error class for authentication service errors.
 * Provides structured error handling with specific error codes.
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
 * Registers a new user in the system.
 *
 * Process:
 * 1. Creates user in Supabase Auth (auth.users)
 * 2. Supabase automatically sends confirmation email
 * 3. Database trigger creates record in public.users after email confirmation
 *
 * @param supabase - Supabase client instance
 * @param command - Registration data (email, password)
 * @returns Promise with created user data
 * @throws AuthServiceError
 */
export async function registerUser(
  supabase: SupabaseClient,
  command: RegisterUserCommand
): Promise<RegisterResponseDTO> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: command.email,
      password: command.password,
      options: {
        emailRedirectTo: `${import.meta.env.SITE || "http://localhost:4321"}/auth/confirm-email`,
      },
    });

    if (error) {
      // Check for specific error types
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists")
      ) {
        throw new AuthServiceError("This email address is already registered", "USER_ALREADY_EXISTS", error);
      }

      if (error.message.toLowerCase().includes("password")) {
        throw new AuthServiceError("Password does not meet security requirements", "WEAK_PASSWORD", error);
      }

      throw new AuthServiceError("Failed to register user", "AUTH_ERROR", error);
    }

    if (!data.user) {
      throw new AuthServiceError("Failed to create user account", "AUTH_ERROR");
    }

    return {
      message: "Registration successful. Please check your email to confirm your account.",
      user: {
        id: data.user.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        email: data.user.email!,
      },
    };
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    throw new AuthServiceError("An unexpected error occurred during registration", "AUTH_ERROR", error);
  }
}

/**
 * Logs a user into the system.
 *
 * @param supabase - Supabase client instance
 * @param command - Login data (email, password)
 * @returns Promise with logged-in user data and session
 * @throws AuthServiceError
 */
export async function loginUser(
  supabase: SupabaseClient,
  command: LoginUserCommand
): Promise<LoginResponseDTO & { session: { access_token: string; refresh_token: string } }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    });

    if (error) {
      // Check if email is not confirmed
      if (error.message.toLowerCase().includes("email not confirmed")) {
        throw new AuthServiceError(
          "Your account has not been confirmed yet. Please check your email inbox.",
          "EMAIL_NOT_CONFIRMED",
          error
        );
      }

      // Invalid credentials
      throw new AuthServiceError("Invalid email or password", "INVALID_CREDENTIALS", error);
    }

    if (!data.session || !data.user) {
      throw new AuthServiceError("Failed to create session", "AUTH_ERROR");
    }

    // Fetch user data from public.users table with role
    const userData = await getUserFromSession(supabase, data.user.id);

    return {
      message: "Login successful",
      user: userData,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    throw new AuthServiceError("An unexpected error occurred during login", "AUTH_ERROR", error);
  }
}

/**
 * Logs out a user from the system.
 *
 * @param supabase - Supabase client instance
 * @throws AuthServiceError
 */
export async function logoutUser(supabase: SupabaseClient): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AuthServiceError("Failed to logout user", "AUTH_ERROR", error);
    }
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    throw new AuthServiceError("An unexpected error occurred during logout", "AUTH_ERROR", error);
  }
}

/**
 * Initiates the password recovery process.
 * Sends a password recovery email to the user.
 *
 * @param supabase - Supabase client instance
 * @param command - Email and redirect URL
 * @throws AuthServiceError
 */
export async function recoverPassword(supabase: SupabaseClient, command: RecoverPasswordCommand): Promise<void> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(command.email, {
      redirectTo: command.redirectTo,
    });

    if (error) {
      throw new AuthServiceError("Failed to send password recovery email", "EMAIL_SEND_FAILED", error);
    }

    // Always return success (don't reveal if email exists)
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    throw new AuthServiceError("An unexpected error occurred during password recovery", "AUTH_ERROR", error);
  }
}

/**
 * Resets user password using a recovery token.
 *
 * @param supabase - Supabase client instance
 * @param command - Token and new password
 * @throws AuthServiceError
 */
export async function resetPassword(supabase: SupabaseClient, command: ResetPasswordCommand): Promise<void> {
  try {
    // Verify the OTP token first
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: command.token,
      type: "recovery",
    });

    if (verifyError) {
      if (verifyError.message.toLowerCase().includes("expired")) {
        throw new AuthServiceError(
          "The password reset link has expired. Please request a new one.",
          "TOKEN_EXPIRED",
          verifyError
        );
      }

      throw new AuthServiceError(
        "The password reset link is invalid or has expired. Please request a new link.",
        "INVALID_TOKEN",
        verifyError
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: command.password,
    });

    if (updateError) {
      throw new AuthServiceError("Failed to update password", "AUTH_ERROR", updateError);
    }
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    throw new AuthServiceError("An unexpected error occurred during password reset", "AUTH_ERROR", error);
  }
}

/**
 * Fetches complete user data from the public.users table.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID from auth.users
 * @returns Promise with UserDTO
 * @throws AuthServiceError
 */
export async function getUserFromSession(supabase: SupabaseClient, userId: string): Promise<UserDTO> {
  try {
    const { data, error } = await supabase.from("users").select("id, email, roles(name)").eq("id", userId).single();

    if (error || !data) {
      throw new AuthServiceError("Failed to fetch user data", "DATABASE_ERROR", error);
    }

    return {
      id: data.id,
      email: data.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: (data.roles as any)?.name || "user",
    };
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    throw new AuthServiceError("An unexpected error occurred while fetching user data", "DATABASE_ERROR", error);
  }
}
