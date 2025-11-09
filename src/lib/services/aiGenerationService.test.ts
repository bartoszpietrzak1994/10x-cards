/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initiateAIGeneration } from "./aiGenerationService";
import type { SupabaseClient } from "../db/supabase.client";
import * as openrouterService from "./openrouterService";

// Mock the openrouterService module
vi.mock("./openrouterService", () => ({
  createOpenRouterService: vi.fn(),
  OpenRouterService: vi.fn(),
}));

// Mock Supabase client
const createMockSupabaseClient = () => {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

describe("AIGenerationService", () => {
  let mockSupabase: SupabaseClient;
  let mockOpenRouterService: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();

    // Create a mock OpenRouter service instance
    mockOpenRouterService = {
      sendChat: vi.fn(),
    };

    // Mock the factory function to return our mock service
    vi.mocked(openrouterService.createOpenRouterService).mockReturnValue(mockOpenRouterService);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initiateAIGeneration", () => {
    const generationId = 1;
    const userId = "user-123";
    const validInputText = "a".repeat(1500); // 1500 characters (valid)

    const mockAIResponse = {
      content: JSON.stringify({
        flashcards: [
          { front: "Question 1", back: "Answer 1" },
          { front: "Question 2", back: "Answer 2" },
          { front: "Question 3", back: "Answer 3" },
        ],
      }),
      usage: {
        total_tokens: 150,
        prompt_tokens: 100,
        completion_tokens: 50,
      },
      model: "openai/gpt-4o-mini",
    };

    const setupMockSupabaseSuccess = () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
    };

    it("should successfully generate flashcards", async () => {
      // Arrange
      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(mockAIResponse);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert
      expect(openrouterService.createOpenRouterService).toHaveBeenCalled();
      expect(mockOpenRouterService.sendChat).toHaveBeenCalledWith(
        expect.stringContaining("educational content creator"),
        expect.stringContaining(validInputText),
        expect.objectContaining({
          responseFormat: expect.any(Object),
          modelParams: expect.objectContaining({
            temperature: 0.7,
            max_tokens: 2000,
          }),
        })
      );
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards_ai_generation");
      expect(mockSupabase.from).toHaveBeenCalledWith("ai_logs");
    });

    it("should throw error when input text is empty", async () => {
      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, "", userId)).rejects.toThrow(
        "Input text cannot be empty"
      );
    });

    it("should throw error when input text is only whitespace", async () => {
      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, "   ", userId)).rejects.toThrow(
        "Input text cannot be empty"
      );
    });

    it("should throw error when input text is too short (less than 1000 characters)", async () => {
      // Arrange
      const shortText = "a".repeat(999);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, shortText, userId)).rejects.toThrow(
        "Input text must be between 1000 and 10000 characters"
      );
    });

    it("should throw error when input text is too long (more than 10000 characters)", async () => {
      // Arrange
      const longText = "a".repeat(10001);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, longText, userId)).rejects.toThrow(
        "Input text must be between 1000 and 10000 characters"
      );
    });

    it("should accept input text at minimum boundary (exactly 1000 characters)", async () => {
      // Arrange
      const minText = "a".repeat(1000);
      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(mockAIResponse);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, minText, userId);

      // Assert - should not throw
      expect(mockOpenRouterService.sendChat).toHaveBeenCalled();
    });

    it("should accept input text at maximum boundary (exactly 10000 characters)", async () => {
      // Arrange
      const maxText = "a".repeat(10000);
      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(mockAIResponse);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, maxText, userId);

      // Assert - should not throw
      expect(mockOpenRouterService.sendChat).toHaveBeenCalled();
    });

    it("should throw error when AI generates no flashcards", async () => {
      // Arrange
      const emptyResponse = {
        content: JSON.stringify({ flashcards: [] }),
        model: "openai/gpt-4o-mini",
      };

      mockOpenRouterService.sendChat.mockResolvedValue(emptyResponse);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "AI generated no flashcards"
      );
    });

    it("should throw error when AI response has no flashcards property", async () => {
      // Arrange
      const invalidResponse = {
        content: JSON.stringify({ data: [] }),
        model: "openai/gpt-4o-mini",
      };

      mockOpenRouterService.sendChat.mockResolvedValue(invalidResponse);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Invalid response structure: missing flashcards array"
      );
    });

    it("should throw error when AI response is not valid JSON", async () => {
      // Arrange
      const invalidResponse = {
        content: "This is not valid JSON",
        model: "openai/gpt-4o-mini",
      };

      mockOpenRouterService.sendChat.mockResolvedValue(invalidResponse);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Failed to parse AI response as JSON"
      );
    });

    it("should throw error when flashcard front is empty", async () => {
      // Arrange
      const responseWithEmptyFront = {
        content: JSON.stringify({
          flashcards: [{ front: "", back: "Answer 1" }],
        }),
        model: "openai/gpt-4o-mini",
      };

      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithEmptyFront);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Flashcard front cannot be empty"
      );
    });

    it("should throw error when flashcard back is empty", async () => {
      // Arrange
      const responseWithEmptyBack = {
        content: JSON.stringify({
          flashcards: [{ front: "Question 1", back: "" }],
        }),
        model: "openai/gpt-4o-mini",
      };

      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithEmptyBack);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Flashcard back cannot be empty"
      );
    });

    it("should throw error when flashcard front exceeds 200 characters", async () => {
      // Arrange
      const longFront = "a".repeat(201);
      const responseWithLongFront = {
        content: JSON.stringify({
          flashcards: [{ front: longFront, back: "Answer 1" }],
        }),
        model: "openai/gpt-4o-mini",
      };

      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithLongFront);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Flashcard front exceeds maximum length of 200 characters"
      );
    });

    it("should throw error when flashcard back exceeds 500 characters", async () => {
      // Arrange
      const longBack = "a".repeat(501);
      const responseWithLongBack = {
        content: JSON.stringify({
          flashcards: [{ front: "Question 1", back: longBack }],
        }),
        model: "openai/gpt-4o-mini",
      };

      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithLongBack);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Flashcard back exceeds maximum length of 500 characters"
      );
    });

    it("should accept flashcard front at maximum boundary (200 characters)", async () => {
      // Arrange
      const maxFront = "a".repeat(200);
      const responseWithMaxFront = {
        content: JSON.stringify({
          flashcards: [{ front: maxFront, back: "Answer 1" }],
        }),
        usage: { total_tokens: 100 },
        model: "openai/gpt-4o-mini",
      };

      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithMaxFront);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert - should not throw
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });

    it("should accept flashcard back at maximum boundary (500 characters)", async () => {
      // Arrange
      const maxBack = "a".repeat(500);
      const responseWithMaxBack = {
        content: JSON.stringify({
          flashcards: [{ front: "Question 1", back: maxBack }],
        }),
        usage: { total_tokens: 100 },
        model: "openai/gpt-4o-mini",
      };

      setupMockSupabaseSuccess();
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithMaxBack);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert - should not throw
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });

    it("should trim whitespace from flashcard front and back", async () => {
      // Arrange
      const responseWithWhitespace = {
        content: JSON.stringify({
          flashcards: [{ front: "  Question 1  ", back: "  Answer 1  " }],
        }),
        usage: { total_tokens: 100 },
        model: "openai/gpt-4o-mini",
      };

      let insertedFlashcards: any[] = [];
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockImplementation((data: any) => {
              insertedFlashcards = data;
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithWhitespace);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert
      expect(insertedFlashcards[0].front).toBe("Question 1");
      expect(insertedFlashcards[0].back).toBe("Answer 1");
    });

    it("should handle multiple flashcards in response", async () => {
      // Arrange
      const multipleFlashcardsResponse = {
        content: JSON.stringify({
          flashcards: [
            { front: "Q1", back: "A1" },
            { front: "Q2", back: "A2" },
            { front: "Q3", back: "A3" },
            { front: "Q4", back: "A4" },
            { front: "Q5", back: "A5" },
          ],
        }),
        usage: { total_tokens: 200 },
        model: "openai/gpt-4o-mini",
      };

      let insertedFlashcards: any[] = [];
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockImplementation((data: any) => {
              insertedFlashcards = data;
              return Promise.resolve({ error: null });
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(multipleFlashcardsResponse);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert
      expect(insertedFlashcards).toHaveLength(5);
      expect(insertedFlashcards[0].flashcard_type).toBe("ai-proposal");
      expect(insertedFlashcards[0].user_id).toBe(userId);
      expect(insertedFlashcards[0].ai_generation_id).toBe(generationId);
    });

    it("should update flashcards_ai_generation with metadata", async () => {
      // Arrange
      const updateCalls: any[] = [];
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "flashcards_ai_generation") {
          return {
            update: vi.fn().mockImplementation((data: any) => {
              updateCalls.push(data);
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(mockAIResponse);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert
      const generationUpdate = updateCalls[0];
      expect(generationUpdate).toMatchObject({
        token_count: 150,
        generated_flashcards_count: 3,
        model: "openai/gpt-4o-mini",
      });
      expect(generationUpdate.response_time).toBeDefined();
    });

    it("should update ai_logs with timing information", async () => {
      // Arrange
      const aiLogUpdates: any[] = [];
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "ai_logs") {
          return {
            update: vi.fn().mockImplementation((data: any) => {
              aiLogUpdates.push(data);
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(mockAIResponse);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert
      const aiLogUpdate = aiLogUpdates[0];
      expect(aiLogUpdate).toMatchObject({
        token_count: 150,
      });
      expect(aiLogUpdate.response_time).toBeDefined();
    });

    it("should update ai_logs with error on failure", async () => {
      // Arrange
      const errorUpdates: any[] = [];
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "ai_logs") {
          return {
            update: vi.fn().mockImplementation((data: any) => {
              errorUpdates.push(data);
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockRejectedValue(new Error("API Error"));

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "API Error"
      );

      // Assert error was logged
      expect(errorUpdates.length).toBeGreaterThan(0);
      expect(errorUpdates[0].error_info).toBe("API Error");
    });

    it("should handle database error when inserting flashcards", async () => {
      // Arrange
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockResolvedValue({
              error: { message: "Database error" },
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(mockAIResponse);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Failed to create flashcard proposals: Database error"
      );
    });

    it("should handle database error when updating generation record", async () => {
      // Arrange
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "flashcards_ai_generation") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: "Update failed" },
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(mockAIResponse);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Failed to update generation record: Update failed"
      );
    });

    it("should handle database error when updating ai_logs", async () => {
      // Arrange
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "ai_logs") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: "Log update failed" },
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(mockAIResponse);

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "Failed to update ai_logs: Log update failed"
      );
    });

    it("should handle OpenRouter service error", async () => {
      // Arrange
      mockOpenRouterService.sendChat.mockRejectedValue(new Error("OpenRouter Service: Rate limit exceeded"));

      // Act & Assert
      await expect(initiateAIGeneration(mockSupabase, generationId, validInputText, userId)).rejects.toThrow(
        "OpenRouter Service: Rate limit exceeded"
      );
    });

    it("should handle response without usage statistics", async () => {
      // Arrange
      const responseWithoutUsage = {
        content: JSON.stringify({
          flashcards: [{ front: "Question 1", back: "Answer 1" }],
        }),
        model: "openai/gpt-4o-mini",
      };

      const updateCalls: any[] = [];
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "flashcards_ai_generation") {
          return {
            update: vi.fn().mockImplementation((data: any) => {
              updateCalls.push(data);
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithoutUsage);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert
      const generationUpdate = updateCalls[0];
      expect(generationUpdate.token_count).toBe(0);
    });

    it("should handle response without model information", async () => {
      // Arrange
      const responseWithoutModel = {
        content: JSON.stringify({
          flashcards: [{ front: "Question 1", back: "Answer 1" }],
        }),
        usage: { total_tokens: 100 },
      };

      const updateCalls: any[] = [];
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "flashcards") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "flashcards_ai_generation") {
          return {
            update: vi.fn().mockImplementation((data: any) => {
              updateCalls.push(data);
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      vi.spyOn(mockSupabase, "from").mockImplementation(mockFrom);
      mockOpenRouterService.sendChat.mockResolvedValue(responseWithoutModel);

      // Act
      await initiateAIGeneration(mockSupabase, generationId, validInputText, userId);

      // Assert
      const generationUpdate = updateCalls[0];
      expect(generationUpdate.model).toBe("unknown");
    });
  });
});
