## View Implementation Plan: Create Manual Flashcard

## 1. Overview
This view allows a logged-in user to manually create a new flashcard by entering the front (question) and back (answer) and submitting it to the backend. It validates inputs inline, provides character counters, handles API errors, and shows a success confirmation with basic navigation guidance.

## 2. View Routing
- Path: `/flashcards/create`
- File: `src/pages/flashcards/create.astro`
- This Astro page renders a React client component that manages the form and its interactions.

## 3. Component Structure
- `src/pages/flashcards/create.astro`
  - `ManualFlashcardForm` (React, client:load)
    - `FormHeader` (optional inline JSX, simple heading + subtitle)
    - `TextareaField` (reusable for `front` and `back`)
      - `Label`
      - `Textarea`
      - `CharacterCounter`
      - `ValidationMessage`
    - `SubmitButton` (reuses `src/components/ui/button.tsx`)
    - `FormAlert` (success/error inline alert)

## 4. Component Details

### ManualFlashcardForm
- Description: The main client component rendering the form, handling local state, validation, submission, and result display.
- Main elements:
  - Two labeled `textarea` inputs (front/back)
  - Character counters under each field
  - Inline validation messages
  - Submit button with loading state
  - Success or error alert region
- Handled interactions:
  - Change in `front` and `back` textareas (update state, re-validate, update length counters)
  - Submit (POST to `/api/flashcards`)
- Handled validation (mirrors API contract exactly):
  - `front`: required, min length 1, max length 200
  - `back`: required, min length 1, max length 500
  - `flashcard_type`: fixed value `manual` (sent by the component)
  - Client conditions prevent submit if invalid; server errors still surfaced
- Types:
  - Uses DTOs from `@/types`: `CreateManualFlashcardCommand`, `FlashcardDTO`
  - ViewModels defined in Section 5
- Props:
  - None required. Optional props for future reuse:
    - `onSuccess?(flashcard: FlashcardDTO): void`
    - `redirectPath?: string` (e.g., to navigate after success)

### TextareaField
- Description: A controlled field + label + helper area used for both `front` and `back`.
- Main elements:
  - `<label>` associated via `htmlFor`
  - `<textarea>` with controlled value
  - `CharacterCounter` (current/limit)
  - `ValidationMessage` (aria-connected to textarea)
- Handled interactions:
  - `onChange` forwards event to parent (ManualFlashcardForm)
- Handled validation:
  - Displays field-specific error passed from parent
  - Shows remaining characters; indicates overflow (and aria-invalid=true)
- Types:
  - `TextareaFieldProps` (Section 5)
- Props:
  - `id: string`
  - `label: string`
  - `value: string`
  - `onChange: (value: string) => void`
  - `maxLength: number`
  - `placeholder?: string`
  - `error?: string`

### CharacterCounter
- Description: Shows `currentLength / maxLength` and highlights when over limit.
- Main elements: Inline text span with conditional styling.
- Interactions: none (pure presentational).
- Props:
  - `current: number`
  - `max: number`

### ValidationMessage
- Description: Presents the field error under the input; connected via `aria-describedby`.
- Interactions: none.
- Props:
  - `message?: string`

### SubmitButton
- Description: Wraps `src/components/ui/button.tsx`, handling disabled and loading.
- Interactions: click to submit.
- Props:
  - `disabled?: boolean`
  - `loading?: boolean`
  - `children: React.ReactNode`

### FormAlert
- Description: Inline alert banner for success / error messages.
- Interactions: may include a dismiss button.
- Props:
  - `type: "success" | "error"`
  - `message: string`

## 5. Types
- Existing DTOs (from `@/types`):
  - `CreateManualFlashcardCommand`: `{ front: string; back: string; flashcard_type: "manual" }`
  - `FlashcardDTO`: `{ id: number; front: string; back: string; flashcard_type: string; created_at: string; ai_generation_id: number | null }`

- New frontend types (ViewModels and helpers):
  - `ManualFlashcardFormValues`:
    - `front: string`
    - `back: string`
  - `ManualFlashcardFormErrors`:
    - `front?: string`
    - `back?: string`
    - `general?: string` (non-field error)
  - `CreateManualFlashcardResponse` (API response shape used client-side):
    - `message: string`
    - `flashcard: FlashcardDTO`
  - `TextareaFieldProps`:
    - `id: string`
    - `label: string`
    - `value: string`
    - `onChange: (value: string) => void`
    - `maxLength: number`
    - `placeholder?: string`
    - `error?: string`

## 6. State Management
- Local component state in `ManualFlashcardForm` via React `useState`:
  - `values: ManualFlashcardFormValues` (front/back)
  - `errors: ManualFlashcardFormErrors`
  - `isSubmitting: boolean`
  - `apiSuccessMessage: string | null`
  - `apiErrorMessage: string | null`
  - `createdFlashcard: FlashcardDTO | null`
- Derived state:
  - `isValid` (no errors and required inputs present)
  - `frontCount`, `backCount` for counters
- Optional custom hook `useManualFlashcardForm`:
  - Encapsulates validation and submission logic; returns state, handlers, and submit function. Beneficial if reused elsewhere.

## 7. API Integration
- Endpoint: `POST /api/flashcards`
- Request headers: `Content-Type: application/json`
- Request body (matches `CreateManualFlashcardCommand`):
  ```json
  { "front": "...", "back": "...", "flashcard_type": "manual" }
  ```
- Success response: `201 Created`
  ```json
  {
    "message": "Flashcard created successfully",
    "flashcard": { "id": 123, "front": "...", "back": "...", "flashcard_type": "manual", "created_at": "...", "ai_generation_id": null }
  }
  ```
- Error responses:
  - `400` validation: `{ error: "Validation failed", details: string[] }`
  - `401` unauthorized: `{ error: "Unauthorized", message: "You must be logged in to create flashcards" }`
  - `409` duplicate: `{ error: string, code: "DUPLICATE_FLASHCARD" }`
  - `500` internal: `{ error: string, message?: string }`
- Frontend handling:
  - On 201: parse, set `createdFlashcard`, show success alert, optionally navigate
  - On 4xx/5xx: map to form `errors.general` or field errors if details provided

## 8. User Interactions
- Typing into `front`/`back`:
  - Updates values; runs lightweight validation; updates counters
  - Shows inline errors if empty or exceeds max length
- Submit click:
  - If invalid: prevent submit, focus first invalid field
  - If valid: POST request; button shows loading; form disabled
- On success:
  - Show success alert with flashcard ID
  - Optionally display a link/button to navigate (e.g., to list or homepage)
- On error:
  - Show error alert; field-level or general; keep user input intact

## 9. Conditions and Validation
- Field-level checks before submit:
  - `front`: required, length 1–200
  - `back`: required, length 1–500
- API contract:
  - Ensure `flashcard_type` is always `manual`
  - Send valid JSON with proper headers
- Accessibility:
  - Use `aria-invalid` when errors present
  - Connect errors via `aria-describedby`
  - Move focus to first error on failed validation or to alert on API error

## 10. Error Handling
- Client validation failures: show inline messages, disable submit until valid
- Network errors/timeouts: show general error message; allow retry
- 400 Validation from API: parse `details` array; surface in `errors.general` and highlight offending field(s) if mappable
- 401 Unauthorized: show message prompting login; optionally include a link to login
- 409 Duplicate: show specific error; allow user to edit and resubmit
- 500 Server errors: generic friendly error; keep input for retry

## 11. Implementation Steps
1. Routing
   - Create `src/pages/flashcards/create.astro` that imports and renders `ManualFlashcardForm` with client hydration.
2. Component scaffolding
   - Create `src/components/flashcards/ManualFlashcardForm.tsx` with local state and layout (Tailwind for spacing/typography).
   - Create small presentational subcomponents in the same file or siblings: `TextareaField`, `CharacterCounter`, `ValidationMessage`, `FormAlert`.
   - Reuse `src/components/ui/button.tsx` for the submit button.
3. Validation logic
   - Implement client-side validators mirroring server rules (length, required).
   - Disable submit when invalid or when submitting.
4. API integration
   - Implement `handleSubmit`: assemble `CreateManualFlashcardCommand` including `flashcard_type: "manual"`, POST to `/api/flashcards`.
   - On 201: update success state and `createdFlashcard`.
   - On errors: parse body, set `errors` or `apiErrorMessage` accordingly.
5. Accessibility
   - Add labels, `aria-invalid`, and `aria-describedby` for fields.
   - On submit failure, focus first invalid field; on API error, focus alert.
6. UX polish
   - Add character counters; change color when exceeding max.
   - Loading state on submit button; disable fields while submitting.
   - Success message with optional actions (e.g., "Create another", "Go to home").
7. Testing (unit-level guidance)
   - Validate that inputs enforce length limits and required rules.
   - Mock fetch to assert POST body and error handling (Vitest + RTL).
8. Documentation
   - Add JSDoc comments for component props.
   - Brief README note in component directory if needed.


