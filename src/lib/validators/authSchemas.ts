import { z } from "zod";

/**
 * Validation constants for authentication
 */
export const AUTH_VALIDATION = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    minLength: 6,
  },
} as const;

/**
 * Schema for email field
 */
export const emailSchema = z
  .string()
  .min(1, { message: "Email address is required" })
  .email({ message: "Invalid email address format" });

/**
 * Schema for password field
 */
export const passwordSchema = z
  .string()
  .min(1, { message: "Password is required" })
  .min(AUTH_VALIDATION.password.minLength, {
    message: `Password must be at least ${AUTH_VALIDATION.password.minLength} characters long`,
  });

/**
 * Schema for login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

/**
 * Schema for registration
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Password confirmation is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/**
 * Schema for password recovery
 */
export const recoverPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Schema for password reset
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: "Token is required" }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Password confirmation is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/**
 * Type inference helpers
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Validation helper for field-level validation
 */
export function validateAuthField(
  field: "email" | "password" | "confirmPassword",
  value: string,
  additionalContext?: { password?: string }
): { isValid: boolean; error?: string } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let schema: z.ZodString | z.ZodEffects<z.ZodObject<any>>;

  switch (field) {
    case "email":
      schema = emailSchema;
      break;
    case "password":
      schema = passwordSchema;
      break;
    case "confirmPassword": {
      if (!additionalContext?.password) {
        return { isValid: false, error: "Password is required for confirmation validation" };
      }
      // Create a temporary schema for confirmPassword validation
      const confirmSchema = z
        .object({
          password: z.string(),
          confirmPassword: z.string().min(1, { message: "Password confirmation is required" }),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords must match",
          path: ["confirmPassword"],
        });

      const result = confirmSchema.safeParse({
        password: additionalContext.password,
        confirmPassword: value,
      });

      if (result.success) {
        return { isValid: true };
      }

      const error = result.error.errors.find((e) => e.path.includes("confirmPassword"));
      return {
        isValid: false,
        error: error?.message || "Validation failed",
      };
    }
    default:
      return { isValid: false, error: "Unknown field" };
  }

  const result = schema.safeParse(value);

  if (result.success) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error.errors[0]?.message || "Validation failed",
  };
}
