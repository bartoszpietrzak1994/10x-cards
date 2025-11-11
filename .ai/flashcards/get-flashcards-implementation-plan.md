# API Endpoint Implementation Plan: Get List of Flashcards

## 1. Endpoint Overview
This endpoint retrieves a paginated list of flashcards belonging to the authenticated user. It supports optional filtering by flashcard type and custom sorting options.

## 2. Request Details
- **HTTP Method:** GET
- **URL Structure:** /flashcards
- **Query Parameters:**
  - **Required:** None
  - **Optional:**
    - `page` (number, default: 1) – The page number for pagination.
    - `limit` (number, default: 10) – The number of flashcards per page.
    - `sortBy` (string, e.g., `created_at`) – Field for sorting flashcards.
    - `order` (string, either `asc` or `desc`) – Sorting direction.
    - `flashcard_type` (string) – Filter flashcards by type (e.g., "manual", "AI-generated").

## 3. Used Types
- **DTOs / Command Models:**
  - `FlashcardDTO` – Represents individual flashcard details.
  - `PaginationDto` – Contains pagination information (page, pageSize, total).
  - `FlashcardsListDTO` – Contains the array of flashcards and corresponding pagination data.

## 4. Response Details
- **Success Response (200 OK):**
  - JSON payload structured as follows:
    ```json
    {
      "flashcards": [
        {
          "id": 123,
          "front": "Question text...",
          "back": "Answer text...",
          "flashcard_type": "manual",
          "created_at": "timestamp",
          "ai_generation_id": null
        }
        // ... additional flashcards
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 50
      }
    }
    ```
- **Error Responses:**
  - 400 Bad Request: For invalid query parameters.
  - 401 Unauthorized: If the user is not authenticated.
  - 500 Internal Server Error: For unexpected server/database errors.

## 5. Data Flow
1. **Authentication:** Verify the JWT from the `Authorization` header. If invalid or missing, respond with 401 Unauthorized.
2. **Query Parameters Processing:** Parse and validate query parameters (`page`, `limit`, `sortBy`, `order`, `flashcard_type`). Apply defaults if parameters are omitted.
3. **Database Query:**
   - Use the authenticated user's `id` to query the flashcards table.
   - Apply filtering on `flashcard_type` if provided.
   - Sort the results based on `sortBy` and `order` parameters.
   - Implement pagination using `page` and `limit` values.
4. **Mapping Data:** Map retrieved records to `FlashcardDTO` and assemble the pagination metadata into a `PaginationDto`.
5. **Response Assembly:** Return the assembled data as a `FlashcardsListDTO` JSON payload.

## 6. Security Considerations
- **Authentication & Authorization:** Protect the endpoint with JWT validation to ensure access is limited to the authenticated user. Utilize RLS in the database to enforce data access restrictions.
- **Input Validation & Sanitization:** Validate and sanitize all user-supplied query parameters to prevent injection attacks.
- **Database Security:** Use parameterized queries/ORM to mitigate SQL injection risks.

## 7. Error Handling
- **401 Unauthorized:** Return if the request lacks a valid JWT.
- **400 Bad Request:** Return if query parameters are invalid (e.g., non-numeric values for `page` or `limit`, invalid values for `order`).
- **500 Internal Server Error:** Catch unexpected errors (e.g., database outages) and log the details appropriately, possibly using an AI logs table.

## 8. Performance Considerations
- **Pagination:** Limit the number of flashcards returned per request to optimize response time.
- **Indexing:** Ensure the database has indexes on `user_id`, `flashcard_type`, and sorting columns (e.g., `created_at`).
- **Caching:** Consider employing caching strategies for frequently accessed data.

## 9. Implementation Steps
1. **Middleware Setup:** Ensure authentication middleware validates the JWT and injects the authenticated user context.
2. **Parameter Parsing:** In the endpoint handler, parse and validate query parameters, setting defaults where necessary.
3. **Database Access:** Construct a query to retrieve flashcards filtered by the authenticated user's `id`, and apply optional filters, sorting, and pagination.
4. **Data Transformation:** Map the result set to the `FlashcardsListDTO` format using defined DTOs.
5. **Error Handling:** Add robust error handling mechanisms to catch and respond to validation and unexpected errors.
6. **Logging:** Implement logging to capture error details, potentially integrating with existing logging solutions.
7. **Unit & Integration Testing:** Develop tests to cover successful responses, invalid input scenarios, and unauthorized access.
8. **Documentation:** Update API documentation to include endpoint details and usage examples.

## 10. Implementation Status: ✅ COMPLETED

### What Was Implemented:

#### 1. Validation Schema (`src/lib/validators/flashcardSchemas.ts`)
- ✅ Created `getFlashcardsQuerySchema` with Zod for query parameter validation
- ✅ Supports all optional parameters with proper defaults and constraints
- ✅ Max limit set to 100 to prevent abuse
- ✅ Enum validation for `sortBy`, `order`, and `flashcard_type`

#### 2. Service Layer (`src/lib/services/flashcardService.ts`)
- ✅ Implemented `getFlashcards` function with comprehensive error handling
- ✅ Created `GetFlashcardsQuery` interface for type safety
- ✅ Proper pagination calculation (offset-based)
- ✅ Filtering by `flashcard_type` when provided
- ✅ Sorting with configurable field and order
- ✅ Returns `FlashcardsListDTO` with pagination metadata
- ✅ Handles empty results gracefully (returns empty array)

#### 3. API Endpoint (`src/pages/api/flashcards/index.ts`)
- ✅ Implemented GET handler alongside existing POST handler
- ✅ Authentication check (returns 401 if not authenticated)
- ✅ Query parameter parsing from URL
- ✅ Input validation with detailed error messages (400 for invalid params)
- ✅ Service layer integration
- ✅ Comprehensive error handling with proper HTTP status codes
- ✅ Consistent error response format

#### 4. Unit Tests (`src/lib/services/flashcardService.test.ts`)
- ✅ 14 comprehensive tests for `getFlashcards` function
- ✅ Tests cover: pagination, filtering, sorting, empty results, errors
- ✅ All 35 tests in the suite pass successfully
- ✅ Proper mocking of Supabase client

## 11. Usage Examples

### Example 1: Get First Page with Default Settings
```bash
GET /api/flashcards
# Returns first 10 flashcards sorted by created_at (desc)
```

**Response:**
```json
{
  "flashcards": [
    {
      "id": 5,
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript",
      "flashcard_type": "manual",
      "created_at": "2025-11-11T10:00:00Z",
      "ai_generation_id": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1
  }
}
```

### Example 2: Get Second Page with Custom Limit
```bash
GET /api/flashcards?page=2&limit=20
```

### Example 3: Filter by Flashcard Type
```bash
GET /api/flashcards?flashcard_type=manual
# Returns only manual flashcards
```

### Example 4: Custom Sorting
```bash
GET /api/flashcards?sortBy=front&order=asc
# Sorts alphabetically by question (A-Z)
```

### Example 5: Complex Query
```bash
GET /api/flashcards?page=2&limit=25&sortBy=created_at&order=asc&flashcard_type=ai-generated
# Page 2, 25 items per page, oldest first, only AI-generated flashcards
```

### Example 6: Error Responses

**401 Unauthorized (Not Logged In):**
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to view flashcards"
}
```

**400 Bad Request (Invalid Parameters):**
```json
{
  "error": "Invalid query parameters",
  "details": [
    "limit: Number must be greater than 0",
    "order: Invalid enum value. Expected 'asc' | 'desc', received 'invalid'"
  ]
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch flashcards",
  "message": "Database connection error"
}
```

## 12. Next Steps

While the endpoint is fully functional, consider these enhancements for production:

1. **Caching:** Implement Redis caching for frequently accessed flashcard lists
2. **Rate Limiting:** Add rate limiting to prevent abuse
3. **Additional Filters:** Support filtering by date ranges, search by content
4. **E2E Tests:** Add Playwright tests for complete user flows
5. **Performance Monitoring:** Track query performance and optimize as needed
6. **API Documentation:** Add OpenAPI/Swagger documentation
