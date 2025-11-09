/**
 * Centralized validators export
 *
 * This module exports all validation schemas and utilities
 * for easy importing throughout the application.
 */

// Flashcard schemas
export {
  FLASHCARD_VALIDATION,
  flashcardFrontSchema,
  flashcardBackSchema,
  createManualFlashcardSchema,
  updateFlashcardSchema,
  aiGenerationInputSchema,
  editFlashcardProposalSchema,
  validateFlashcardField,
  type CreateManualFlashcardInput,
  type UpdateFlashcardInput,
  type AIGenerationInput,
  type EditFlashcardProposalInput,
} from "./flashcardSchemas";

// Auth schemas
export {
  AUTH_VALIDATION,
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  recoverPasswordSchema,
  resetPasswordSchema,
  validateAuthField,
  type LoginInput,
  type RegisterInput,
  type RecoverPasswordInput,
  type ResetPasswordInput,
} from "./authSchemas";
