# API Endpoint Documentation: AI Flashcards Generation

## Overview

This document provides detailed information about the AI Flashcards Generation endpoint implementation.

## Endpoint Details

### POST `/api/flashcards/ai-generation`

Initiates asynchronous AI-powered flashcards generation from user-provided text.

**Base URL:** `http://localhost:4321` (development)

## Request

### Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

**Note:** Authentication header will be added in future implementation.

### Request Body

```typescript
{
  input_text: string;  // 1000-10000 characters
}
```

### Validation Rules

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| input_text | string | Yes | 1000-10000 characters |

### Example Request

```json
{
  "input_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
}
```

## Response

### Success Response (202 Accepted)

The endpoint returns immediately with status `202 Accepted` while AI generation continues in the background.

```json
{
  "message": "AI generation initiated",
  "generation_id": 123,
  "status": "processing"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| message | string | Human-readable success message |
| generation_id | number | Unique ID for tracking this generation request |
| status | string | Always "processing" for this endpoint |

### Error Responses

#### 400 Bad Request - Invalid JSON

```json
{
  "error": "Invalid JSON in request body"
}
```

**When:** The request body is not valid JSON.

#### 400 Bad Request - Validation Failed

```json
{
  "error": "Validation failed",
  "details": [
    "input_text: Input text must be at least 1000 characters"
  ]
}
```

**When:** Input data doesn't meet validation requirements.

**Common validation errors:**
- Input text is less than 1000 characters
- Input text exceeds 10000 characters
- user_id is missing or not a valid UUID

#### 500 Internal Server Error - Database Error

```json
{
  "error": "Failed to initiate AI generation",
  "details": "Database connection failed"
}
```

**When:** Database insertion fails (e.g., invalid user_id, connection issues).

#### 500 Internal Server Error - Unexpected Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while processing your request"
}
```

**When:** An unexpected error occurs during processing.

## HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 202 | Accepted | Request accepted, processing in background |
| 400 | Bad Request | Invalid input or malformed request |
| 500 | Internal Server Error | Server or database error |

## Implementation Details

### Data Flow

1. **Request Reception**
   - Endpoint receives POST request with JSON body
   - Content-Type must be `application/json`

2. **Input Validation**
   - Parse JSON body
   - Validate using Zod schema
   - Check input_text length (1000-10000 chars)

3. **Hash Generation**
   - Generate MD5 hash of input_text
   - Used for duplicate detection and logging

4. **Database Operations**
   - Insert record into `flashcards_ai_generation` table
     - Fields: `user_id`, `request_time`
     - Other fields (`response_time`, `token_count`, etc.) remain NULL
   - Insert record into `ai_logs` table
     - Fields: `flashcards_generation_id`, `request_time`, `input_length`, `input_text_hash`

5. **Asynchronous Processing Trigger**
   - Call `initiateAIGeneration()` service (fire-and-forget)
   - **Note:** Currently a placeholder, will be implemented with actual AI integration

6. **Response**
   - Return 202 status with generation_id
   - Client can use generation_id to poll for results (future endpoint)

### Database Schema

#### flashcards_ai_generation Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | serial | No | Primary key |
| user_id | uuid | No | Reference to users table |
| request_time | timestamptz | No | When generation was requested |
| response_time | timestamptz | Yes | When generation completed (filled later) |
| token_count | integer | Yes | AI tokens used (filled later) |
| generated_flashcards_count | integer | Yes | Number of flashcards generated (filled later) |
| model | varchar(36) | Yes | AI model used (filled later) |

#### ai_logs Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | serial | No | Primary key |
| flashcards_generation_id | integer | No | Reference to flashcards_ai_generation |
| request_time | timestamptz | No | Request timestamp |
| response_time | timestamptz | Yes | Response timestamp (filled later) |
| token_count | integer | Yes | Tokens used (filled later) |
| input_length | integer | No | Length of input text |
| input_text_hash | text | No | MD5 hash of input text |
| error_info | text | Yes | Error information if generation fails |

## Security Considerations

### Current Implementation (Development)

- **No authentication:** user_id is passed in request body (NOT production-ready)
- **No rate limiting:** Endpoint can be called unlimited times
- **No input sanitization:** Beyond length validation

### Future Implementation (Production)

- Add JWT token authentication
- Implement rate limiting (e.g., max 10 requests per hour per user)
- Add input sanitization to prevent injection attacks
- Implement CORS policies
- Add request logging and monitoring
- Consider implementing request deduplication based on input_text_hash

## Performance Characteristics

### Response Time

- **Average:** < 100ms (only database inserts)
- **Does not include:** AI generation time (handled asynchronously)

### Concurrency

- Supports concurrent requests
- Database handles transaction isolation
- Async processing prevents blocking

### Scalability

- Stateless endpoint design
- Can be horizontally scaled
- Background processing can be distributed using job queues

## Testing

### Unit Testing Checklist

- ✓ Valid input acceptance
- ✓ Input validation (too short, too long, missing fields)
- ✓ JSON parsing errors
- ✓ Database insertion success
- ✓ Database insertion failure handling
- ✓ Hash generation correctness

### Integration Testing Checklist

- ✓ End-to-end request flow
- ✓ Database record creation
- ✓ Proper status codes returned
- ✓ Error message formatting
- ✓ Async service invocation

### Edge Cases

- Input text exactly 1000 characters
- Input text exactly 10000 characters
- Empty string input
- Very large JSON payload

## Future Enhancements

1. **Authentication Integration**
   - Replace user_id parameter with JWT token
   - Extract user_id from authenticated session

2. **Actual AI Integration**
   - Implement OpenRouter/OpenAI API calls
   - Add queue system (Bull/BullMQ)
   - Update records with AI response data

3. **Status Polling Endpoint**
   - GET `/api/flashcards/ai-generation/:id/status`
   - Return current status and results

4. **Webhook Support**
   - Allow clients to register webhooks
   - Notify when generation completes

5. **Rate Limiting**
   - Implement per-user rate limits
   - Add quota management

6. **Caching**
   - Cache results based on input_text_hash
   - Return cached results for duplicate requests

## Related Files

- **Endpoint:** `src/pages/api/flashcards/ai-generation.ts`
- **Service:** `src/lib/services/aiGenerationService.ts`
- **Types:** `src/types.ts`
- **Database Types:** `src/db/database.types.ts`
- **Migration:** `supabase/migrations/20251016120000_initial_schema.sql`
- **Tests:** `.ai/api-test-examples.http`
- **Setup Guide:** `.ai/development-setup.md`

## Support

For questions or issues, refer to:
- Implementation plan: `.ai/ai-generation-endpoint-implementation-plan.md`
- Database plan: `.ai/db-plan.md`
- API plan: `.ai/api-plan.md`

