import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  registerUser,
  loginUser,
  logoutUser,
  recoverPassword,
  resetPassword,
  getUserFromSession,
  AuthServiceError,
} from "./authService";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RegisterUserCommand,
  LoginUserCommand,
  RecoverPasswordCommand,
  ResetPasswordCommand,
} from "@/types";

// Mock Supabase client
const createMockSupabaseClient = () => {
  return {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      verifyOtp: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

describe("AuthService", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerUser", () => {
    const validCommand: RegisterUserCommand = {
      email: "test@example.com",
      password: "SecurePassword123!",
    };

    it("should successfully register a new user", async () => {
      // Arrange
      const mockUser = {
        id: "user-123",
        email: validCommand.email,
      };

      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: mockUser as any, session: null },
        error: null,
      });

      // Act
      const result = await registerUser(mockSupabase, validCommand);

      // Assert
      expect(result).toEqual({
        message:
          "Registration successful. Please check your email to confirm your account.",
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validCommand.email,
        password: validCommand.password,
        options: {
          emailRedirectTo: expect.stringContaining("/auth/confirm-email"),
        },
      });
    });

    it("should throw AuthServiceError with USER_ALREADY_EXISTS code when email is already registered", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "User already registered",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(registerUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(registerUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "USER_ALREADY_EXISTS");
    });

    it("should throw AuthServiceError with WEAK_PASSWORD code when password is weak", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Password is too weak",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(registerUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(registerUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "WEAK_PASSWORD");
    });

    it("should throw AuthServiceError with AUTH_ERROR code for generic auth errors", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Network error",
          name: "AuthError",
          status: 500,
        } as any,
      });

      // Act & Assert
      await expect(registerUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(registerUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });

    it("should throw AuthServiceError when user data is not returned", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signUp").mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      // Act & Assert
      await expect(registerUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(registerUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signUp").mockRejectedValue(
        new Error("Unexpected error")
      );

      // Act & Assert
      await expect(registerUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(registerUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });
  });

  describe("loginUser", () => {
    const validCommand: LoginUserCommand = {
      email: "test@example.com",
      password: "SecurePassword123!",
    };

    const mockUser = {
      id: "user-123",
      email: validCommand.email,
    };

    const mockUserData = {
      id: mockUser.id,
      email: mockUser.email,
      roles: { name: "user" },
    };

    const mockSession = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-123",
    };

    beforeEach(() => {
      // Mock the getUserFromSession query
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      });
      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
    });

    it("should successfully log in a user", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: {
          user: mockUser as any,
          session: mockSession as any,
        },
        error: null,
      });

      // Act
      const result = await loginUser(mockSupabase, validCommand);

      // Assert
      expect(result).toEqual({
        message: "Login successful",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: "user",
        },
        session: {
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
        },
      });
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validCommand.email,
        password: validCommand.password,
      });
    });

    it("should throw AuthServiceError with EMAIL_NOT_CONFIRMED code when email is not confirmed", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Email not confirmed",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(loginUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "EMAIL_NOT_CONFIRMED");
    });

    it("should throw AuthServiceError with INVALID_CREDENTIALS code for invalid credentials", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Invalid login credentials",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(loginUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "INVALID_CREDENTIALS");
    });

    it("should throw AuthServiceError when session is not returned", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockResolvedValue({
        data: { user: mockUser as any, session: null },
        error: null,
      });

      // Act & Assert
      await expect(loginUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(loginUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signInWithPassword").mockRejectedValue(
        new Error("Network error")
      );

      // Act & Assert
      await expect(loginUser(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(loginUser(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });
  });

  describe("logoutUser", () => {
    it("should successfully log out a user", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signOut").mockResolvedValue({
        error: null,
      });

      // Act
      await logoutUser(mockSupabase);

      // Assert
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should throw AuthServiceError when logout fails", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signOut").mockResolvedValue({
        error: {
          message: "Logout failed",
          name: "AuthError",
          status: 500,
        } as any,
      });

      // Act & Assert
      await expect(logoutUser(mockSupabase)).rejects.toThrow(AuthServiceError);
      await expect(logoutUser(mockSupabase))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "signOut").mockRejectedValue(
        new Error("Unexpected error")
      );

      // Act & Assert
      await expect(logoutUser(mockSupabase)).rejects.toThrow(AuthServiceError);
      await expect(logoutUser(mockSupabase))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });
  });

  describe("recoverPassword", () => {
    const validCommand: RecoverPasswordCommand = {
      email: "test@example.com",
      redirectTo: "http://localhost:4321/auth/reset-password",
    };

    it("should successfully send password recovery email", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "resetPasswordForEmail").mockResolvedValue({
        data: {} as any,
        error: null,
      });

      // Act
      await recoverPassword(mockSupabase, validCommand);

      // Assert
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        validCommand.email,
        {
          redirectTo: validCommand.redirectTo,
        }
      );
    });

    it("should throw AuthServiceError with EMAIL_SEND_FAILED code when email send fails", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "resetPasswordForEmail").mockResolvedValue({
        data: {} as any,
        error: {
          message: "Failed to send email",
          name: "AuthError",
          status: 500,
        } as any,
      });

      // Act & Assert
      await expect(recoverPassword(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(recoverPassword(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "EMAIL_SEND_FAILED");
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "resetPasswordForEmail").mockRejectedValue(
        new Error("Network error")
      );

      // Act & Assert
      await expect(recoverPassword(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(recoverPassword(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });
  });

  describe("resetPassword", () => {
    const validCommand: ResetPasswordCommand = {
      token: "valid-token-hash",
      password: "NewSecurePassword123!",
    };

    it("should successfully reset password", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "verifyOtp").mockResolvedValue({
        data: { user: { id: "user-123" } as any, session: null },
        error: null,
      });

      vi.spyOn(mockSupabase.auth, "updateUser").mockResolvedValue({
        data: { user: { id: "user-123" } as any },
        error: null,
      });

      // Act
      await resetPassword(mockSupabase, validCommand);

      // Assert
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: validCommand.token,
        type: "recovery",
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: validCommand.password,
      });
    });

    it("should throw AuthServiceError with TOKEN_EXPIRED code when token is expired", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "verifyOtp").mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Token expired",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(resetPassword(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(resetPassword(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "TOKEN_EXPIRED");
    });

    it("should throw AuthServiceError with INVALID_TOKEN code when token is invalid", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "verifyOtp").mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Invalid token",
          name: "AuthError",
          status: 400,
        } as any,
      });

      // Act & Assert
      await expect(resetPassword(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(resetPassword(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "INVALID_TOKEN");
    });

    it("should throw AuthServiceError when password update fails", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "verifyOtp").mockResolvedValue({
        data: { user: { id: "user-123" } as any, session: null },
        error: null,
      });

      vi.spyOn(mockSupabase.auth, "updateUser").mockResolvedValue({
        data: { user: null },
        error: {
          message: "Failed to update password",
          name: "AuthError",
          status: 500,
        } as any,
      });

      // Act & Assert
      await expect(resetPassword(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(resetPassword(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      // Arrange
      vi.spyOn(mockSupabase.auth, "verifyOtp").mockRejectedValue(
        new Error("Network error")
      );

      // Act & Assert
      await expect(resetPassword(mockSupabase, validCommand)).rejects.toThrow(
        AuthServiceError
      );
      await expect(resetPassword(mockSupabase, validCommand))
        .rejects.toHaveProperty("code", "AUTH_ERROR");
    });
  });

  describe("getUserFromSession", () => {
    const userId = "user-123";

    it("should successfully fetch user data with role", async () => {
      // Arrange
      const mockUserData = {
        id: userId,
        email: "test@example.com",
        roles: { name: "admin" },
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await getUserFromSession(mockSupabase, userId);

      // Assert
      expect(result).toEqual({
        id: userId,
        email: "test@example.com",
        role: "admin",
      });
      expect(mockSupabase.from).toHaveBeenCalledWith("users");
    });

    it("should default to 'user' role when roles is null", async () => {
      // Arrange
      const mockUserData = {
        id: userId,
        email: "test@example.com",
        roles: null,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await getUserFromSession(mockSupabase, userId);

      // Assert
      expect(result.role).toBe("user");
    });

    it("should throw AuthServiceError with DATABASE_ERROR code when user not found", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: "User not found",
                code: "PGRST116",
              } as any,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(getUserFromSession(mockSupabase, userId)).rejects.toThrow(
        AuthServiceError
      );
      await expect(getUserFromSession(mockSupabase, userId))
        .rejects.toHaveProperty("code", "DATABASE_ERROR");
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error("Database connection error")),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(getUserFromSession(mockSupabase, userId)).rejects.toThrow(
        AuthServiceError
      );
      await expect(getUserFromSession(mockSupabase, userId))
        .rejects.toHaveProperty("code", "DATABASE_ERROR");
    });
  });

  describe("AuthServiceError", () => {
    it("should create error with all properties", () => {
      // Arrange
      const message = "Test error";
      const code = "TEST_ERROR";
      const originalError = new Error("Original error");

      // Act
      const error = new AuthServiceError(message, code, originalError);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthServiceError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe("AuthServiceError");
    });

    it("should create error without original error", () => {
      // Arrange
      const message = "Test error";
      const code = "TEST_ERROR";

      // Act
      const error = new AuthServiceError(message, code);

      // Assert
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.originalError).toBeUndefined();
    });
  });
});

