import type { Database } from "./db/database.types";

type User = Database["public"]["Tables"]["users"]["Row"];
type ManualFlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
type FlashcardUpdate = Database["public"]["Tables"]["flashcards"]["Update"];
type AILog = Database["public"]["Tables"]["ai_logs"]["Row"];
type Role = Database["public"]["Tables"]["roles"]["Row"];

/* ====================== Authentication DTOs ====================== */

/**
 * Command Model for registering a new user.
 * Note: Password is not stored in the database directly.
 */
export interface RegisterUserCommand {
  email: string;
  password: string;
  additionalData?: {
    role?: string; // Optional, defaults to standard user role if omitted
  };
}

/**
 * Command Model for logging in a user.
 */
export interface LoginUserCommand {
  email: string;
  password: string;
}

/**
 * DTO representing minimal public user details.
 * Derived from the 'users' table Row with computed 'role'.
 */
export type UserDTO = Pick<User, "id" | "email"> & {
  role: string; // role name derived from the roles table
};

/**
 * DTO for authentication response.
 */
export interface AuthResponseDTO {
  message: string;
  user: UserDTO;
  token: string;
}

/* ====================== Flashcards DTOs ====================== */

/**
 * Command Model for creating a manual flashcard.
 * Derived from the 'flashcards' table Insert type.
 * Only includes properties that can be set by the user.
 */
export type CreateManualFlashcardCommand = Pick<
  ManualFlashcardInsert,
  "front" | "back"
> & {
  flashcard_type: "manual"; // Fixed to "manual" for manual flashcards
};

/**
 * DTO representing flashcard details returned by the API.
 */
export type FlashcardDTO = Pick<
  Flashcard,
  "id" | "front" | "back" | "flashcard_type" | "created_at" | "ai_generation_id"
>;

/**
 * Command Model for updating an existing flashcard.
 * Only allows modification of 'front' and 'back'.
 */
export type UpdateFlashcardCommand = Pick<
  FlashcardUpdate,
  "front" | "back"
>;

/**
 * DTO for flashcard deletion response.
 */
export interface DeleteFlashcardResponseDTO {
  message: string;
}

/* ====================== AI Generation DTOs ====================== */

/**
 * Command Model for initiating AI flashcards generation.
 */
export interface InitiateAIGenerationCommand {
  input_text: string; // Must be between 1000 and 10000 characters
}

/**
 * DTO for the response after initiating AI generation.
 * The generation starts in "processing" status.
 */
export interface AIGenerationResponseDTO {
  message: string;
  generation_id: number;
  status: "processing";
}

/**
 * DTO representing the AI log entries.
 * Derived from the 'ai_logs' table Row with selected fields.
 */
export type AILogDTO = Pick<
  AILog,
  "request_time" | "response_time" | "token_count" | "error_info"
>;

/**
 * DTO representing a flashcard proposal.
 * Typically used in AI generation responses.
 */
export type FlashcardProposal = Pick<
  Flashcard,
  "id" | "front" | "back" | "flashcard_type" | "created_at" | "ai_generation_id"
>;

/**
 * DTO for editing a flashcard proposal.
 */
export interface EditFlashcardProposalDTO {
  front?: string;
  back?: string;
}

/**
 * DTO for accepting a flashcard proposal.
 */
export interface AcceptFlashcardProposalDTO {
  id: number;
}

/**
 * DTO for retrieving AI generation status.
 * Contains an array of flashcard proposals.
 */
export interface AIGenerationStatusDTO {
  generation_id: number;
  status: "processing" | "completed" | "failed";
  flashcardsProposals: FlashcardProposal[];
  ai_log: AILogDTO;
}

/* ====================== Role DTO ====================== */

/**
 * DTO for roles.
 * Direct representation of a role from the 'roles' table.
 */
export type RoleDTO = Role;

/* ====================== Pagination and List DTOs ====================== */

/**
 * DTO for pagination info.
 */
export interface PaginationDto {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * DTO for a paginated list of flashcards.
 */
export interface FlashcardsListDTO {
  flashcards: FlashcardDTO[];
  pagination: PaginationDto;
}

/**
 * DTO for a paginated list of AI generations.
 */
export interface AIGenerationsListDTO {
  aiGenerations: AIGenerationStatusDTO[];
  pagination: PaginationDto;
}