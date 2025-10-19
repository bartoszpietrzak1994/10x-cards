# API Documentation: POST /api/flashcards

## Overview
Creates a new manual flashcard for the authenticated user.

## Endpoint Details
- **URL**: `/api/flashcards`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Authentication**: Required (currently using DEFAULT_USER_ID for development)

## Request

### Request Body Schema
```typescript
{
  front: string;      // Required, max 200 characters
  back: string;       // Required, max 500 characters
  flashcard_type: "manual";  // Required, must be literal "manual"
}
```

### Example Request
```bash
POST /api/flashcards
Content-Type: application/json

{
  "front": "What is TypeScript?",
  "back": "TypeScript is a strongly typed programming language that builds on JavaScript",
  "flashcard_type": "manual"
}
```

## Response

### Success Response (201 Created)

**Status Code**: `201 Created`

**Response Body**:
```json
{
  "message": "Flashcard created successfully",
  "flashcard": {
    "id": 1,
    "front": "What is TypeScript?",
    "back": "TypeScript is a strongly typed programming language that builds on JavaScript",
    "flashcard_type": "manual",
    "created_at": "2025-10-19T12:34:56.789Z",
    "ai_generation_id": null
  }
}
```

**Response Schema**:
```typescript
{
  message: string;
  flashcard: {
    id: number;
    front: string;
    back: string;
    flashcard_type: "manual";
    created_at: string;  // ISO 8601 timestamp
    ai_generation_id: number | null;
  };
}
```

### Error Responses

#### 400 Bad Request - Invalid JSON

**When**: Request body is not valid JSON

**Response**:
```json
{
  "error": "Invalid JSON in request body"
}
```

#### 400 Bad Request - Validation Failed

**When**: Request body fails Zod schema validation

**Response**:
```json
{
  "error": "Validation failed",
  "details": [
    "front: Front text is required",
    "back: Back text must not exceed 500 characters"
  ]
}
```

**Common Validation Errors**:
- `front: Front text is required` - Missing front field
- `front: Front text must not exceed 200 characters` - Front text too long
- `back: Back text is required` - Missing back field
- `back: Back text must not exceed 500 characters` - Back text too long
- `flashcard_type: Flashcard type must be 'manual'` - Invalid or missing flashcard_type

#### 400 Bad Request - Service Error (Invalid User ID)

**When**: User ID is invalid or missing

**Response**:
```json
{
  "error": "Invalid user ID provided",
  "code": "INVALID_USER_ID"
}
```

#### 404 Not Found - User Not Found

**When**: User ID doesn't exist in the database

**Response**:
```json
{
  "error": "User not found in the system",
  "code": "USER_NOT_FOUND"
}
```

#### 409 Conflict - Duplicate Flashcard

**When**: Flashcard with same unique constraints already exists

**Response**:
```json
{
  "error": "Flashcard already exists",
  "code": "DUPLICATE_FLASHCARD"
}
```

#### 500 Internal Server Error - Database Error

**When**: Unexpected database error occurs

**Response**:
```json
{
  "error": "Failed to create flashcard",
  "code": "DATABASE_ERROR"
}
```

OR (for unknown error types):
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while processing your request"
}
```

## Implementation Details

### Validation Rules
1. **Front Text**:
   - Required field
   - Must be a non-empty string
   - Maximum length: 200 characters
   - Validated by Zod schema before database insertion

2. **Back Text**:
   - Required field
   - Must be a non-empty string
   - Maximum length: 500 characters
   - Validated by Zod schema before database insertion

3. **Flashcard Type**:
   - Required field
   - Must be exactly the string "manual"
   - Other types ("ai-generated", "ai-edited", "ai-proposal") are not allowed for this endpoint

### Error Handling Strategy
The endpoint uses a multi-layered error handling approach:

1. **Input Validation Layer** (Zod):
   - Validates JSON format
   - Validates field types and constraints
   - Returns 400 with detailed validation errors

2. **Service Layer** (`FlashcardServiceError`):
   - Custom error class with error codes
   - Handles database-specific errors
   - Provides meaningful error messages

3. **HTTP Layer**:
   - Maps service error codes to appropriate HTTP status codes
   - Returns consistent error response format
   - Logs errors for debugging

### Error Code Mapping
```typescript
{
  INVALID_USER_ID: 400,      // Bad Request
  USER_NOT_FOUND: 404,       // Not Found
  DUPLICATE_FLASHCARD: 409,  // Conflict
  TEXT_TOO_LONG: 400,        // Bad Request
  NO_DATA_RETURNED: 500,     // Internal Server Error
  DATABASE_ERROR: 500,       // Internal Server Error
}
```

## Security Considerations

### Current Implementation (Development)
- Using `DEFAULT_USER_ID` constant for user identification
- No authentication middleware implemented yet
- RLS (Row-Level Security) policies are defined in the database but not enforced at API level

### Future Implementation (Production)
1. **Authentication**:
   - Implement JWT-based authentication middleware
   - Extract user ID from validated JWT token
   - Replace `DEFAULT_USER_ID` with authenticated user's ID

2. **Authorization**:
   - Verify user is authenticated before processing request
   - Return 401 Unauthorized if no valid authentication
   - Enforce RLS policies through Supabase

3. **Input Sanitization**:
   - Zod validation provides type safety
   - Supabase parameterized queries prevent SQL injection
   - Consider adding HTML sanitization for front/back text if needed

4. **Rate Limiting**:
   - Consider implementing rate limiting per user
   - Prevent abuse of flashcard creation endpoint

## Database Schema Reference

### Flashcards Table
```sql
CREATE TABLE flashcards (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_generation_id INTEGER UNIQUE REFERENCES flashcards_ai_generation(id),
  front VARCHAR(200) NOT NULL,
  back VARCHAR(500) NOT NULL,
  flashcard_type card_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Indexes
- `idx_flashcards_user_id` on `user_id`
- `idx_flashcards_typ` on `flashcard_type`
- `idx_flashcards_ai_generation_id` on `ai_generation_id`

## Testing

### Manual Testing
See [test-examples.md](./test-examples.md) for comprehensive curl examples.

### Integration Testing Checklist
- [ ] Valid flashcard creation returns 201
- [ ] Created flashcard has correct data structure
- [ ] Missing required fields return 400
- [ ] Text exceeding max length returns 400
- [ ] Invalid flashcard_type returns 400
- [ ] Malformed JSON returns 400
- [ ] Database errors are caught and logged
- [ ] User ID validation works correctly
- [ ] Flashcard is associated with correct user
- [ ] `ai_generation_id` is null for manual flashcards

### Edge Cases to Test
1. Minimum valid input (1 character for front and back)
2. Maximum valid input (200 chars for front, 500 for back)
3. Unicode characters and special characters
4. Empty strings (should fail validation)
5. Missing fields
6. Extra unexpected fields (should be ignored)
7. Invalid user ID
8. Non-existent user ID

## Performance Considerations

### Current Performance
- Single database insert operation
- Minimal synchronous processing
- No external API calls
- Direct response (no background jobs)

### Optimizations
- Database indexes on `user_id` and `flashcard_type` improve query performance
- Zod validation is fast and synchronous
- Single round-trip to database

### Future Considerations
- Consider batch creation endpoint for multiple flashcards
- Implement caching if needed for frequently accessed data
- Monitor database connection pool usage

## Related Endpoints
- `POST /api/flashcards/ai-generation` - Initiate AI flashcard generation
- `GET /api/flashcards` - List user's flashcards (to be implemented)
- `PATCH /api/flashcards/:id` - Update flashcard (to be implemented)
- `DELETE /api/flashcards/:id` - Delete flashcard (to be implemented)

## Changelog
- **2025-10-19**: Initial implementation
  - Created endpoint with full validation
  - Implemented custom error handling
  - Added comprehensive documentation

