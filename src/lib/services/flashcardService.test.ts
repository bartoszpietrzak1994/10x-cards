import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createManualFlashcard,
  deleteFlashcard,
  updateFlashcard,
  FlashcardServiceError,
} from "./flashcardService";
import type { SupabaseClient } from "../db/supabase.client";
import type {
  CreateManualFlashcardCommand,
  UpdateFlashcardCommand,
  FlashcardDTO,
} from "@/types";

// Mock Supabase client
const createMockSupabaseClient = () => {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

describe("FlashcardService", () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createManualFlashcard", () => {
    const userId = "user-123";
    const validCommand: CreateManualFlashcardCommand = {
      front: "What is TypeScript?",
      back: "TypeScript is a typed superset of JavaScript",
      flashcard_type: "manual",
    };

    it("should successfully create a manual flashcard", async () => {
      // Arrange
      const mockFlashcardData = {
        id: 1,
        front: validCommand.front,
        back: validCommand.back,
        flashcard_type: "manual" as const,
        created_at: "2024-01-01T00:00:00Z",
        ai_generation_id: null,
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFlashcardData,
              error: null,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await createManualFlashcard(mockSupabase, userId, validCommand);

      // Assert
      expect(result).toEqual(mockFlashcardData);
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });

    it("should throw FlashcardServiceError with INVALID_USER_ID when userId is empty", async () => {
      // Act & Assert
      await expect(
        createManualFlashcard(mockSupabase, "", validCommand)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        createManualFlashcard(mockSupabase, "", validCommand)
      ).rejects.toHaveProperty("code", "INVALID_USER_ID");
    });

    it("should throw FlashcardServiceError with INVALID_USER_ID when userId is not a string", async () => {
      // Act & Assert
      await expect(
        createManualFlashcard(mockSupabase, null as any, validCommand)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        createManualFlashcard(mockSupabase, null as any, validCommand)
      ).rejects.toHaveProperty("code", "INVALID_USER_ID");
    });

    it("should throw FlashcardServiceError with USER_NOT_FOUND when user doesn't exist", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: "23503",
                message: "Foreign key violation",
              } as any,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toHaveProperty("code", "USER_NOT_FOUND");
    });

    it("should throw FlashcardServiceError with DUPLICATE_FLASHCARD when flashcard already exists", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: "23505",
                message: "Unique constraint violation",
              } as any,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toHaveProperty("code", "DUPLICATE_FLASHCARD");
    });

    it("should throw FlashcardServiceError with TEXT_TOO_LONG when text exceeds maximum length", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: "22001",
                message: "String data right truncation",
              } as any,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toHaveProperty("code", "TEXT_TOO_LONG");
    });

    it("should throw FlashcardServiceError with DATABASE_ERROR for generic database errors", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: "XXXXX",
                message: "Generic database error",
              } as any,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toHaveProperty("code", "DATABASE_ERROR");
    });

    it("should throw FlashcardServiceError with NO_DATA_RETURNED when no data is returned", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        createManualFlashcard(mockSupabase, userId, validCommand)
      ).rejects.toHaveProperty("code", "NO_DATA_RETURNED");
    });
  });

  describe("deleteFlashcard", () => {
    const flashcardId = 1;
    const userId = "user-123";

    it("should successfully delete a flashcard", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: flashcardId, user_id: userId },
                error: null,
              }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await deleteFlashcard(mockSupabase, flashcardId, userId);

      // Assert
      expect(result).toEqual({});
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });

    it("should return error when userId is missing", async () => {
      // Act
      const result = await deleteFlashcard(mockSupabase, flashcardId, "");

      // Assert
      expect(result).toEqual({
        error: {
          code: "INVALID_USER",
          message: "User not authenticated",
        },
      });
    });

    it("should return error when flashcard is not found", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  message: "Not found",
                  code: "PGRST116",
                } as any,
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await deleteFlashcard(mockSupabase, flashcardId, userId);

      // Assert
      expect(result).toEqual({
        error: {
          code: "not_found",
          message: "Flashcard not found or access unauthorized",
        },
      });
    });

    it("should return error when flashcard doesn't belong to user", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await deleteFlashcard(mockSupabase, flashcardId, userId);

      // Assert
      expect(result).toEqual({
        error: {
          code: "not_found",
          message: "Flashcard not found or access unauthorized",
        },
      });
    });

    it("should return error when deletion fails", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: flashcardId, user_id: userId },
                error: null,
              }),
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: {
                code: "DELETE_ERROR",
                message: "Failed to delete",
              } as any,
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await deleteFlashcard(mockSupabase, flashcardId, userId);

      // Assert
      expect(result).toEqual({
        error: {
          code: "DELETE_ERROR",
          message: "Failed to delete",
        },
      });
    });
  });

  describe("updateFlashcard", () => {
    const userId = "user-123";
    const flashcardId = 1;

    it("should successfully update a flashcard with both front and back", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {
        front: "Updated front",
        back: "Updated back",
      };

      const existingFlashcard = {
        id: flashcardId,
        user_id: userId,
        flashcard_type: "manual" as const,
      };

      const updatedFlashcard: FlashcardDTO = {
        id: flashcardId,
        front: command.front!,
        back: command.back!,
        flashcard_type: "manual" as const,
        created_at: "2024-01-01T00:00:00Z",
        ai_generation_id: null,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: existingFlashcard,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedFlashcard,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await updateFlashcard(mockSupabase, userId, flashcardId, command);

      // Assert
      expect(result).toEqual(updatedFlashcard);
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });

    it("should successfully update only the front of a flashcard", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {
        front: "Updated front",
      };

      const existingFlashcard = {
        id: flashcardId,
        user_id: userId,
        flashcard_type: "manual" as const,
      };

      const updatedFlashcard: FlashcardDTO = {
        id: flashcardId,
        front: command.front!,
        back: "Original back",
        flashcard_type: "manual" as const,
        created_at: "2024-01-01T00:00:00Z",
        ai_generation_id: null,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: existingFlashcard,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedFlashcard,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await updateFlashcard(mockSupabase, userId, flashcardId, command);

      // Assert
      expect(result).toEqual(updatedFlashcard);
    });

    it("should change flashcard_type from ai-proposal to ai-edited when updating", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {
        front: "Updated front",
      };

      const existingFlashcard = {
        id: flashcardId,
        user_id: userId,
        flashcard_type: "ai-proposal" as const,
      };

      const updatedFlashcard: FlashcardDTO = {
        id: flashcardId,
        front: command.front!,
        back: "Original back",
        flashcard_type: "ai-edited" as const,
        created_at: "2024-01-01T00:00:00Z",
        ai_generation_id: 1,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: existingFlashcard,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedFlashcard,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act
      const result = await updateFlashcard(mockSupabase, userId, flashcardId, command);

      // Assert
      expect(result.flashcard_type).toBe("ai-edited");
    });

    it("should throw FlashcardServiceError with INVALID_USER_ID when userId is empty", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {
        front: "Updated front",
      };

      // Act & Assert
      await expect(
        updateFlashcard(mockSupabase, "", flashcardId, command)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        updateFlashcard(mockSupabase, "", flashcardId, command)
      ).rejects.toHaveProperty("code", "INVALID_USER_ID");
    });

    it("should throw FlashcardServiceError with INVALID_FLASHCARD_ID when flashcardId is invalid", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {
        front: "Updated front",
      };

      // Act & Assert
      await expect(
        updateFlashcard(mockSupabase, userId, 0, command)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        updateFlashcard(mockSupabase, userId, 0, command)
      ).rejects.toHaveProperty("code", "INVALID_FLASHCARD_ID");
    });

    it("should throw FlashcardServiceError with NO_UPDATE_FIELDS when no fields provided", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {};

      // Act & Assert
      await expect(
        updateFlashcard(mockSupabase, userId, flashcardId, command)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        updateFlashcard(mockSupabase, userId, flashcardId, command)
      ).rejects.toHaveProperty("code", "NO_UPDATE_FIELDS");
    });

    it("should throw FlashcardServiceError with FLASHCARD_NOT_FOUND when flashcard doesn't exist", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {
        front: "Updated front",
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: "PGRST116",
                  message: "No rows returned",
                } as any,
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(
        updateFlashcard(mockSupabase, userId, flashcardId, command)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        updateFlashcard(mockSupabase, userId, flashcardId, command)
      ).rejects.toHaveProperty("code", "FLASHCARD_NOT_FOUND");
    });

    it("should throw FlashcardServiceError with TEXT_TOO_LONG when text exceeds maximum length", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {
        front: "Updated front",
      };

      const existingFlashcard = {
        id: flashcardId,
        user_id: userId,
        flashcard_type: "manual" as const,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: existingFlashcard,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: {
                    code: "22001",
                    message: "String data right truncation",
                  } as any,
                }),
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(
        updateFlashcard(mockSupabase, userId, flashcardId, command)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        updateFlashcard(mockSupabase, userId, flashcardId, command)
      ).rejects.toHaveProperty("code", "TEXT_TOO_LONG");
    });

    it("should throw FlashcardServiceError with NO_DATA_RETURNED when no data is returned after update", async () => {
      // Arrange
      const command: UpdateFlashcardCommand = {
        front: "Updated front",
      };

      const existingFlashcard = {
        id: flashcardId,
        user_id: userId,
        flashcard_type: "manual" as const,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: existingFlashcard,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);

      // Act & Assert
      await expect(
        updateFlashcard(mockSupabase, userId, flashcardId, command)
      ).rejects.toThrow(FlashcardServiceError);
      
      await expect(
        updateFlashcard(mockSupabase, userId, flashcardId, command)
      ).rejects.toHaveProperty("code", "NO_DATA_RETURNED");
    });
  });

  describe("FlashcardServiceError", () => {
    it("should create error with all properties", () => {
      // Arrange
      const message = "Test error";
      const code = "TEST_ERROR";
      const originalError = new Error("Original error");

      // Act
      const error = new FlashcardServiceError(message, code, originalError);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FlashcardServiceError);
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe("FlashcardServiceError");
    });

    it("should create error without original error", () => {
      // Arrange
      const message = "Test error";
      const code = "TEST_ERROR";

      // Act
      const error = new FlashcardServiceError(message, code);

      // Assert
      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.originalError).toBeUndefined();
    });
  });
});

