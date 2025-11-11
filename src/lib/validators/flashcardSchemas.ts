import { z } from "zod";

/**
 * Validation constants for flashcards
 */
export const FLASHCARD_VALIDATION = {
  front: {
    minLength: 1,
    maxLength: 200,
  },
  back: {
    minLength: 1,
    maxLength: 500,
  },
  inputText: {
    minLength: 1000,
    maxLength: 10000,
  },
} as const;

/**
 * Schema for flashcard front field
 */
export const flashcardFrontSchema = z
  .string()
  .min(FLASHCARD_VALIDATION.front.minLength, {
    message: "Question is required",
  })
  .max(FLASHCARD_VALIDATION.front.maxLength, {
    message: `Question must not exceed ${FLASHCARD_VALIDATION.front.maxLength} characters`,
  })
  .trim();

/**
 * Schema for flashcard back field
 */
export const flashcardBackSchema = z
  .string()
  .min(FLASHCARD_VALIDATION.back.minLength, {
    message: "Answer is required",
  })
  .max(FLASHCARD_VALIDATION.back.maxLength, {
    message: `Answer must not exceed ${FLASHCARD_VALIDATION.back.maxLength} characters`,
  })
  .trim();

/**
 * Schema for creating a manual flashcard
 */
export const createManualFlashcardSchema = z.object({
  front: flashcardFrontSchema,
  back: flashcardBackSchema,
  flashcard_type: z.literal("manual"),
});

/**
 * Schema for updating a flashcard (front and/or back)
 */
export const updateFlashcardSchema = z
  .object({
    front: flashcardFrontSchema.optional(),
    back: flashcardBackSchema.optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

/**
 * Schema for AI generation input text
 */
export const aiGenerationInputSchema = z.object({
  input_text: z
    .string()
    .min(FLASHCARD_VALIDATION.inputText.minLength, {
      message: `Input text must be at least ${FLASHCARD_VALIDATION.inputText.minLength} characters`,
    })
    .max(FLASHCARD_VALIDATION.inputText.maxLength, {
      message: `Input text must not exceed ${FLASHCARD_VALIDATION.inputText.maxLength} characters`,
    })
    .trim(),
});

/**
 * Schema for flashcard proposal editing
 */
export const editFlashcardProposalSchema = z.object({
  front: flashcardFrontSchema,
  back: flashcardBackSchema,
});

/**
 * Type inference helpers
 */
export type CreateManualFlashcardInput = z.infer<typeof createManualFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type AIGenerationInput = z.infer<typeof aiGenerationInputSchema>;
export type EditFlashcardProposalInput = z.infer<typeof editFlashcardProposalSchema>;

/**
 * Schema for getting a list of flashcards with pagination and filters
 */
export const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["created_at", "front", "back"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  flashcard_type: z
    .enum(["manual", "ai-generated", "ai-edited", "ai-proposal"])
    .nullish()
    .transform((val) => (val === null ? undefined : val)),
});

/**
 * Validation helper for field-level validation
 */
export function validateFlashcardField(field: "front" | "back", value: string): { isValid: boolean; error?: string } {
  const schema = field === "front" ? flashcardFrontSchema : flashcardBackSchema;
  const result = schema.safeParse(value);

  if (result.success) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error.errors[0]?.message || "Validation failed",
  };
}
