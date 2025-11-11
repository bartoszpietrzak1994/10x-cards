## View Implementation Plan — Flashcards Dashboard

## 1. Overview
The Flashcards Dashboard provides an overview of all user flashcards (manual and AI-related), enabling browsing, filtering by type, sorting, pagination, and inline edit/delete actions. It focuses on fast navigation, accessible interactions, and a short feedback loop for managing flashcards.

## 2. View Routing
- Path: `/flashcards`
- File: `src/pages/flashcards/index.astro`
- The page renders a React container component to handle interactivity (filters, pagination, edit/delete).

## 3. Component Structure
- `FlashcardsDashboard` (React, container)
  - `FlashcardsToolbar`
    - `FlashcardTypeFilter`
    - `SortBySelect`
    - `SortOrderToggle`
    - `PageSizeSelect`
    - Optional navigation actions: “Create manual” → `/flashcards/create`, “AI generation” → `/flashcards/ai-generation`
  - `FlashcardsList`
    - `FlashcardCard` (per item)
      - Inline editor (re-use `InlineEditor`)
      - `ActionMenu` (Edit, Delete)
  - `PaginationControls`
  - `FeedbackArea` (alerts/status for errors, empty state, success messages)

## 4. Component Details
### FlashcardsDashboard
- Component description: Top-level container managing query state (page, limit, sort, order, type filter), data fetching, and mutations (edit, delete). It coordinates toolbar, list, and pagination.
- Main elements: wrapper `<div>`, header/title, `FlashcardsToolbar`, `FlashcardsList`, `PaginationControls`, `FeedbackArea`.
- Handled interactions:
  - Change filter/sort/order/pageSize → updates query state and refetches list.
  - Pagination change (page) → refetch.
  - Edit item (optimistic UI optional) → PUT `/api/flashcards/{id}`.
  - Delete item → DELETE `/api/flashcards/{id}`; refresh list or optimistically remove.
- Handled validation:
  - Constrain UI inputs to allowed values so requests always satisfy the API schema:
    - `page ≥ 1`, `limit ∈ [1, 100]`.
    - `sortBy ∈ {"created_at","front","back"}`.
    - `order ∈ {"asc","desc"}`.
    - `flashcard_type ∈ {"manual","ai-generated","ai-edited","ai-proposal"} | undefined`.
  - For editing, validate `front (1..200)` and `back (1..500)` before PUT (use `validateFlashcardField` for field-level hints).
- Types (DTO + ViewModel):
  - Uses `FlashcardsListDTO`, `FlashcardDTO` from `src/types.ts`.
  - Uses `GetFlashcardsQuery` from service layer as a basis for query state.
  - View models: `FlashcardsQueryState`, `FlashcardsListViewModel` (see “Types”).
- Props: none (top-level rendered by page).

### FlashcardsToolbar
- Component description: Controls for type filter, sort by, order, and page size with accessible labels and helper text.
- Main elements: filter select, sort select, order toggle button, page size select, optional CTA buttons linking to create/AI generation pages.
- Handled interactions:
  - On change of any control → calls parent callbacks to update query state.
- Handled validation:
  - All controls use constrained option sets to keep values within API schema.
- Types:
  - `FlashcardsQueryState` for current values.
  - `ToolbarProps` for change handlers (see “Types”).
- Props:
  - `query: FlashcardsQueryState`
  - `onQueryChange: (next: FlashcardsQueryState) => void`
  - Optional: navigation callbacks/links for create/AI generation.

### FlashcardsList
- Component description: Displays a responsive grid/list of `FlashcardCard` items or an empty state when none.
- Main elements: container grid, conditional empty state, mapped `FlashcardCard` children.
- Handled interactions:
  - Delegates per-item edit/delete events up to the container.
- Handled validation:
  - None directly (read-only display). Child will validate edits.
- Types:
  - `FlashcardDTO[]` for items.
  - `FlashcardsListItemVM` (for UI-only flags like “isEditing”) if needed.
- Props:
  - `items: FlashcardDTO[]`
  - `onEdit: (id: number, data: { front?: string; back?: string }) => Promise<void>`
  - `onDelete: (id: number) => Promise<void>`

### FlashcardCard
- Component description: Card showing `front`, truncated `back`, `flashcard_type`, `created_at`, with Edit/Delete actions. When editing, use the shared `InlineEditor`.
- Main elements: `Card`, headings, metadata row, `ActionMenu` with “Edit” and “Delete”, conditional `InlineEditor` region.
- Handled interactions:
  - “Edit” toggles inline editor, validates fields, confirms PUT.
  - “Delete” triggers confirm and calls DELETE.
- Handled validation:
  - Use `validateFlashcardField('front'|'back', value)` for field-level validation and character counters.
- Types:
  - `FlashcardDTO` for data, `FlashcardsListItemVM` for UI flags.
- Props:
  - `item: FlashcardDTO`
  - `onEdit: (id: number, data: { front?: string; back?: string }) => Promise<void>`
  - `onDelete: (id: number) => Promise<void>`

### PaginationControls
- Component description: Prev/Next, page indicator, and optional page jump.
- Main elements: buttons and current/total indicator using `pagination` from API.
- Handled interactions:
  - Change page → calls `onPageChange(page)` to update `FlashcardsDashboard` query.
- Handled validation:
  - Disable prev when page === 1; disable next when we’re at the last page (derived from total and pageSize).
- Types:
  - `PaginationDto` from `src/types.ts`.
- Props:
  - `page: number`
  - `pageSize: number`
  - `total: number`
  - `onPageChange: (page: number) => void`

### FeedbackArea
- Component description: Display request errors, empty state, or info messages. Can use `Alert` from Shadcn or `StatusBanner` when appropriate.
- Main elements: conditionally rendered `Alert`/empty-state panel.
- Handled interactions: none.
- Handled validation: none.
- Props:
  - `status: 'idle'|'loading'|'error'|'success'`
  - `message?: string`

## 5. Types
- Backend DTOs (existing in `src/types.ts`):
  - `FlashcardDTO`: `{ id: number; front: string; back: string; flashcard_type: "manual"|"ai-generated"|"ai-edited"|"ai-proposal"; created_at: string; ai_generation_id: number | null }`
  - `PaginationDto`: `{ page: number; pageSize: number; total: number }`
  - `FlashcardsListDTO`: `{ flashcards: FlashcardDTO[]; pagination: PaginationDto }`
- Service query type (existing in `src/lib/services/flashcardService.ts`):
  - `GetFlashcardsQuery`: `{ page: number; limit: number; sortBy: "created_at"|"front"|"back"; order: "asc"|"desc"; flashcard_type?: "manual"|"ai-generated"|"ai-edited"|"ai-proposal" }`
- New view types:
  - `FlashcardsQueryState`:
    - `page: number`
    - `limit: number` (1..100)
    - `sortBy: "created_at" | "front" | "back"`
    - `order: "asc" | "desc"`
    - `flashcard_type?: "manual" | "ai-generated" | "ai-edited" | "ai-proposal"`
  - `FlashcardsListViewModel`:
    - `items: FlashcardDTO[]`
    - `pagination: PaginationDto`
    - `isLoading: boolean`
    - `error?: string`
  - `ToolbarProps`:
    - `query: FlashcardsQueryState`
    - `onQueryChange: (next: FlashcardsQueryState) => void`
  - `FlashcardsListItemVM` (optional, if per-item editing state is local to item, can be kept internally):
    - `isEditing: boolean`
    - `editValue: { front: string; back: string }`
    - `errors?: { front?: string; back?: string }`

## 6. State Management
- At `FlashcardsDashboard`:
  - `query: FlashcardsQueryState` (controlled by toolbar and pagination).
  - `view: FlashcardsListViewModel` (data, loading, error).
  - `pendingActionId?: number` to disable controls per-item during updates.
- Custom hook: `useFlashcardsList` (in `src/components/hooks/useFlashcardsList.ts`)
  - Accepts `query: FlashcardsQueryState`.
  - Performs GET `/api/flashcards` with `page`, `limit`, `sortBy`, `order`, `flashcard_type`.
  - Returns `{ data, isLoading, error, refetch }`.
  - Implements aborting in-flight requests when query changes; debounced refetch if needed.
- Editing/deleting can be handled inline in `FlashcardsDashboard` with `useCallback` handlers and optimistic updates, or via a small helper hook (optional).

## 7. API Integration
- Endpoint: GET `/api/flashcards`
  - Query params (validated server-side):
    - `page` (default 1, positive int)
    - `limit` (default 10, positive int, max 100)
    - `sortBy` in `{"created_at","front","back"}`
    - `order` in `{"asc","desc"}`
    - `flashcard_type` in `{"manual","ai-generated","ai-edited","ai-proposal"}` (optional)
  - Response: `FlashcardsListDTO`
- Edit: PUT `/api/flashcards/{id}`
  - Body: `{ front?: string; back?: string }` with constraints front(1..200), back(1..500).
  - Response: `{ message: string; flashcard: FlashcardDTO }`
- Delete: DELETE `/api/flashcards/{id}`
  - Response: `{ message: string }` (200 on success)
- Unauthorized handling (401): show message and CTA to log in; optionally redirect to `/auth/login`.

## 8. User Interactions
- Change filter/sort/order/page size:
  - Update `query` state; refetch list.
  - Reset `page` to 1 on filter/sort/order/page size changes.
- Navigate pages:
  - Update `page`; refetch.
- Edit a flashcard:
  - Click “Edit” → inline editor expands on card.
  - Validate inputs live; disable “Save” if invalid.
  - Submit → PUT; on success, close editor and update card content; on error, show alert.
- Delete a flashcard:
  - Click “Delete” → confirm → call DELETE; remove item from list or refetch.
- Empty state:
  - If `items.length === 0`, show an accessible empty-state with links to create or AI-generate.

## 9. Conditions and Validation
- Toolbar controls only allow legal values matching the backend schema.
- Editing validation:
  - `front`: required, 1..200 chars.
  - `back`: required, 1..500 chars.
  - Use `validateFlashcardField` for field-level feedback and character counters.
- Pagination:
  - `page ≥ 1`, `pageSize ≤ 100`.
  - Disable navigation buttons accordingly.
- Network state:
  - Disable actions on items during pending updates to prevent duplicate requests.

## 10. Error Handling
- Fetch errors:
  - Display `Alert` with error message; allow retry via “Try again” button (calls `refetch`).
  - Handle 401 by showing a login CTA; optional auto-redirect.
- Edit errors:
  - Show per-field validation messages for 400 errors from the server when possible.
  - On generic 500 or service errors, show a destructive `Alert`.
- Delete errors:
  - Show destructive `Alert`; re-enable controls to retry.
- Empty results are not an error; show helpful empty-state UI.

## 11. Implementation Steps
1. Routing
   - Create `src/pages/flashcards/index.astro` using `src/layouts/Layout.astro`.
   - Render `<FlashcardsDashboard />` inside the page.
2. Components
   - Create `src/components/flashcards/FlashcardsDashboard.tsx` (container).
   - Create `src/components/flashcards/FlashcardsToolbar.tsx` with type filter, sort select, order toggle, page size select, and optional CTAs.
   - Create `src/components/flashcards/FlashcardsList.tsx` and `src/components/flashcards/FlashcardCard.tsx` (use Shadcn `Card`, existing `InlineEditor`).
   - Create `src/components/flashcards/PaginationControls.tsx`.
3. Hook
   - Implement `src/components/hooks/useFlashcardsList.ts`:
     - Accepts `FlashcardsQueryState`,
     - Builds query string and fetches `/api/flashcards`,
     - Returns `{ data, isLoading, error, refetch }`.
4. Validation
   - Reuse `validateFlashcardField` for live editing validation.
   - Enforce allowed values in toolbar controls.
5. Data Flow
   - In `FlashcardsDashboard`, wire toolbar → query state → `useFlashcardsList` fetch.
   - Implement `onEdit` (PUT) and `onDelete` (DELETE) with optimistic updates or refetch.
6. UI/UX
   - Implement accessible labels, `aria-describedby` for inputs, `aria-live="polite"` for feedback.
   - Add empty-state with links to `/flashcards/create` and `/flashcards/ai-generation`.
7. Edge Cases
   - Handle empty results, error states, unauthorized (401), slow networks (loading skeletons/spinners).
8. Polish
   - Add truncation for long `front`/`back` in list view with title tooltips.
   - Ensure dark mode compatibility via Tailwind variants.
9. QA
   - Manually verify filtering, sorting, pagination, edit, delete.
   - Confirm API constraints are respected and error messages are user-friendly.


