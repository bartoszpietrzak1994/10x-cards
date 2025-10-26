# View Implementation Plan – AI Flashcards Generation

## 1. Overview
The AI Flashcards Generation view enables users to paste long-form text and initiate AI-based flashcard generation. It validates input length, submits a request to the backend, displays processing status, and shows generated flashcard proposals once available. Users can accept, edit (update) or reject (delete) proposals inline. The view also surfaces AI logging metadata (timestamps, token counts) for transparency.

## 2. View Routing
- Path: `/flashcards/ai-generation`
- File: `src/pages/flashcards/ai-generation.astro` wrapping a client-side React component for interactive behavior.

## 3. Component Structure
- `AIGenerationPage` (Astro page)
  - `AIGenerationView` (React – client:load)
    - `AIGenerationForm`
      - `TextInputWithCount`
      - `SubmitButton`
    - `StatusBanner`
    - `AIGenerationMeta`
    - `ProposalsList`
      - `ProposalCard` (repeated)
        - `InlineEditor` (conditional when editing)
        - `AcceptButton` / `EditButton` / `DeleteButton` / `SaveButton` / `CancelButton`

## 4. Component Details
### AIGenerationPage (Astro)
- Purpose: Route container that mounts the interactive React view.
- Elements: Wrapper layout (`src/layouts/Layout.astro`), `<AIGenerationView />` via `client:load`.
- Props: None.

### AIGenerationView (React)
- Purpose: Orchestrates form submission, polling, and rendering of status, metadata, and results.
- Main elements: Section with form, status area, metadata, results list.
- Handled interactions:
  - Submit generation
  - Poll/refresh status and results
  - Accept/edit/reject proposals
- Handled validation:
  - Input text length between 1000 and 10000 characters before enabling submit
- Types:
  - Uses DTOs: `InitiateAIGenerationCommand`, `AIGenerationResponseDTO`, `FlashcardProposal`, `AILogDTO`
  - ViewModels: `AIGenerationVM`, `FlashcardProposalVM`
- Props: None (self-contained view).

### AIGenerationForm
- Purpose: Text input (textarea) with live character counter and submit.
- Main elements: Label + textarea (accessible), counter text (current/remaining), submit button, helper/error text.
- Handled interactions: Input change, submit.
- Handled validation:
  - Disable submit < 1000 or > 10000 chars
  - Show error message on invalid range
- Types: `InitiateAIGenerationCommand` for submit payload.
- Props:
  - `value: string`
  - `onChange(value: string): void`
  - `isValid: boolean`
  - `charCount: number`
  - `min: number` (1000)
  - `max: number` (10000)
  - `onSubmit(): Promise<void>`
  - `isSubmitting: boolean`

### StatusBanner
- Purpose: Communicate processing, completed, or failed states with accessible status.
- Main elements: Alert/banner with icon; spinner during processing.
- Handled interactions: None (display-only).
- Handled validation: N/A.
- Types: `AIGenerationVM['status']`.
- Props:
  - `status: 'idle' | 'processing' | 'completed' | 'failed'`
  - `message?: string`

### AIGenerationMeta
- Purpose: Display AI log metadata for the current generation.
- Main elements: Small panel/table with `request_time`, `response_time`, `token_count`, `generated_flashcards_count`, `model`.
- Handled interactions: Manual refresh button (optional).
- Types: `AILogDTO` and selected fields from `flashcards_ai_generation`.
- Props:
  - `log?: AILogDTO`
  - `generationMeta?: { request_time: string; response_time?: string | null; token_count?: number | null; generated_flashcards_count?: number | null; model?: string | null; }`
  - `onRefresh?(): void`

### ProposalsList
- Purpose: Render a list of proposals and actions.
- Main elements: List of `ProposalCard`s; empty state.
- Handled interactions: Delegates to child for actions.
- Types: `FlashcardProposal[]` -> `FlashcardProposalVM[]` for UI state.
- Props:
  - `proposals: FlashcardProposalVM[]`
  - `onAccept(id: number): Promise<void>`
  - `onEditStart(id: number): void`
  - `onEditSave(id: number, data: { front: string; back: string }): Promise<void>`
  - `onEditCancel(id: number): void`
  - `onDelete(id: number): Promise<void>`

### ProposalCard
- Purpose: Show one flashcard proposal with accept/edit/delete; inline editing.
- Main elements: Card with front/back, action buttons; edit mode with inputs and validation messages.
- Handled interactions:
  - Accept: No content change (convert generated → edited handled by backend when updated), optional immediate feedback
  - Edit: Toggle `isEditing`; validate and submit PUT
  - Delete: Confirm then call DELETE
- Handled validation:
  - Edit front: 1..200
  - Edit back: 1..500
- Types: `FlashcardProposalVM`
- Props:
  - `proposal: FlashcardProposalVM`
  - `onAccept(id: number): Promise<void>`
  - `onEditSave(id: number, data: { front: string; back: string }): Promise<void>`
  - `onEditCancel(id: number): void`
  - `onDelete(id: number): Promise<void>`

### InlineEditor
- Purpose: Controlled inputs for front/back with validation hints.
- Main elements: Two inputs/textarea, helper text for limits, error text.
- Handled interactions: Change handlers; save/cancel actions.
- Validation: Front 1..200, Back 1..500; disable save if invalid.
- Types: `{ front: string; back: string }`
- Props:
  - `value: { front: string; back: string }`
  - `onChange(value: { front: string; back: string }): void`
  - `errors?: { front?: string; back?: string }`
  - `onSave(): void`
  - `onCancel(): void`

## 5. Types
- Existing DTOs (from `src/types.ts`):
  - `InitiateAIGenerationCommand` { input_text: string }
  - `AIGenerationResponseDTO` { message: string; generation_id: number; status: 'processing' }
  - `FlashcardProposal` { id, front, back, flashcard_type, created_at, ai_generation_id }
  - `AILogDTO` { request_time, response_time?, token_count?, error_info? }
  - `UpdateFlashcardCommand` { front?: string; back?: string }

- New ViewModel types:
  - `AIGenerationVM`:
    - `inputText: string`
    - `inputLength: number`
    - `isValidLength: boolean`
    - `isSubmitting: boolean`
    - `generationId?: number`
    - `status: 'idle' | 'processing' | 'completed' | 'failed'`
    - `aiLog?: AILogDTO`
    - `generationMeta?: { request_time: string; response_time?: string | null; token_count?: number | null; generated_flashcards_count?: number | null; model?: string | null; }`
    - `proposals: FlashcardProposalVM[]`
    - `error?: string`
  - `FlashcardProposalVM`:
    - `id: number`
    - `front: string`
    - `back: string`
    - `flashcard_type: 'ai-generated' | 'ai-edited' | 'ai-proposal' | 'manual'`
    - `created_at: string`
    - `ai_generation_id: number | null`
    - `isEditing: boolean`
    - `editFront: string`
    - `editBack: string`
    - `validationErrors?: { front?: string; back?: string }`

## 6. State Management
- Local state inside `AIGenerationView` via React hooks; no global store needed.
- Custom hooks:
  - `useCharCount(value: string, min = 1000, max = 10000)` → `{ count, isValid, remaining, error }`
  - `useAIGeneration()`:
    - Handles submit, status, polling, metadata fetch, proposals fetch, and CRUD actions.
    - API: `{ vm, setInputText, submit, refresh, accept, startEdit, saveEdit, cancelEdit, remove }`.
    - Polling: exponential backoff or fixed interval (e.g., 2–3s) up to ~45s; stop on `completed` or `failed`.

## 7. API Integration
- Endpoints used:
  1) Initiate AI generation
     - Method: POST `/api/flashcards/ai-generation`
     - Request: `InitiateAIGenerationCommand & { user_id: string }`
       - Note: Backend schema currently requires `user_id` (UUID). Use authenticated user id; in development, fall back to a public env (e.g., `PUBLIC_DEFAULT_USER_ID`) if needed.
     - Response: `AIGenerationResponseDTO`
  2) Update a flashcard (accept/edit)
     - Method: PUT `/api/flashcards/{id}`
     - Request: `UpdateFlashcardCommand` (front/back). For accept-without-edit, send a no-op edit by re-posting existing front/back or skip if not needed by UX.
     - Response: `{ message: string; flashcard: FlashcardDTO }`
  3) Delete a flashcard (reject)
     - Method: DELETE `/api/flashcards/{id}`
     - Response: `{ message: string }`

- Fetching status and proposals (client-side via Supabase, honoring RLS):
  - `flashcards_ai_generation`: select by `id` (request_time, response_time, token_count, model, generated_flashcards_count)
  - `ai_logs`: select by `flashcards_generation_id` for `AILogDTO`
  - `flashcards`: select where `ai_generation_id = generationId` and `flashcard_type in ('ai-generated','ai-proposal')`
  - These reads happen during polling or on manual refresh.

## 8. User Interactions
- Type/paste input text → live character count updates.
- Submit → disabled unless 1000–10000 chars; on submit, show spinner/processing state and message.
- While processing → banner with spinner; aria-live announcement; optional cancel disabled (fire-and-forget).
- After processing completes → proposals displayed; metadata visible.
- Accept → either no-op update or just visually mark as accepted; backend will move `ai-generated` → `ai-edited` after actual edit. If accept requires change, call PUT with current content.
- Edit → toggle inline editor, validate, call PUT; upon success, update item in list.
- Delete (Reject) → confirm then call DELETE; remove from list.
- Refresh → manual refresh button to re-fetch status/proposals if polling is over or paused.

## 9. Conditions and Validation
- Form input length: 1000 ≤ length ≤ 10000 → enable submit; else disable and show error.
- Edit validation:
  - `front`: required, 1..200
  - `back`: required, 1..500
- Status determination:
  - `status = 'processing'` until `flashcards_ai_generation.response_time` is non-null. If errors are recorded in `ai_logs.error_info`, surface `failed`.
- RLS/user ownership: Reads/writes are scoped to authenticated `user_id`; ensure we pass or derive the correct user id for POST, and Supabase client enforces RLS for reads.

## 10. Error Handling
- POST 400: Show validation error messages from response; keep input for correction.
- POST 401: Prompt user to log in (placeholder until auth is implemented).
- Polling timeout (e.g., >45s): Show info banner with manual refresh option.
- Missing metadata: Show partial data with placeholders; non-blocking.
- PUT/DELETE failures: Inline error on the affected card; allow retry.
- Network errors: Generic toast/banner; preserve user input and allow reattempt.
- Defensive checks for null/undefined `generationId` and empty results.

## 11. Implementation Steps
1) Create route `src/pages/flashcards/ai-generation.astro` and mount `AIGenerationView` (client:load) within the main layout.
2) Implement `AIGenerationView` skeleton with Tailwind classes and Shadcn/ui primitives (Button, Card, Alert).
3) Build `AIGenerationForm` with textarea, counter, and submit button; wire validation (1000–10000) and disabled states.
4) Add `StatusBanner` with accessible spinner and aria-live for status updates.
5) Implement `useCharCount` and `useAIGeneration` hooks to manage form state, submission, status, polling, and CRUD.
6) Integrate POST `/api/flashcards/ai-generation` (include `user_id` in body). Handle 202 response and capture `generation_id`.
7) Implement Supabase reads to fetch `flashcards_ai_generation`, `ai_logs`, and `flashcards` by `ai_generation_id` for status/meta/proposals.
8) Implement `ProposalsList` and `ProposalCard` with inline edit (`InlineEditor`), accept, and delete actions.
9) Integrate PUT `/api/flashcards/{id}` for edit (apply validation 1..200 and 1..500). Update local list on success.
10) Integrate DELETE `/api/flashcards/{id}` for reject; remove from local list on success.
11) Add manual refresh control and finalize polling behavior (stop on completed/failed or after timeout).
12) Add error displays (form-level, banner, and per-card errors). Ensure accessible labels and status messages.
13) QA against User Stories US-002 and US-003; verify input limits, status timing, proposal display, and CRUD actions.
14) Add light E2E/manual test docs describing expected flows and failure modes.

