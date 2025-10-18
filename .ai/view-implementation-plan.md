# API Endpoint Implementation Plan: Initiate AI Flashcards Generation

## 1. Endpoint Overview
This endpoint submits user-provided text to the AI engine for flashcards generation. It validates that the input text is between 1000 and 10000 characters, records metadata (such as request time), and triggers asynchronous AI processing. A new record is inserted into the `flashcards_ai_generation` table, and the endpoint immediately responds with a processing status.

## 2. Request Details
- **HTTP Method:** POST  
- **URL Structure:** `/flashcards/ai-generation`
- **Headers:**  
  - `Authorization: Bearer <JWT token>` (required for authentication)
  - `Content-Type: application/json`
- **Parameters:**  
  - *Required (in request body):*
    - `input_text`: string (must be between 1000 and 10000 characters)
  - *Optional:*  
    - No additional optional parameters specified.
- **Request Body Example:**
  ```json
  {
    "input_text": "Long text between 1000 and 10000 characters..."
  }
  ```

## 3. Used Types
- **Command Models / DTOs:**  
  - `InitiateAIGenerationCommand` (from `src/types.ts`)
  - `AIGenerationResponseDTO` (from `src/types.ts`)

## 4. Response Details
- **Success Response (202 Accepted):**  
  ```json
  {
    "message": "AI generation initiated",
    "generation_id": 456,
    "status": "processing"
  }
  ```
- **Error Responses:**  
  - **400 Bad Request:** When the input does not meet the character length restrictions.
  - **401 Unauthorized:** When a valid authentication token is not provided.
  - **500 Internal Server Error:** For any unexpected server-side issues (e.g., database insert failures).

## 5. Data Flow
1. **Request Reception:**  
   - The endpoint receives the POST request along with the JSON payload and auth header.
2. **Input Validation:**  
   - Validate the user's JWT token and extract the user details for authorization.
   - Check that `input_text` is provided and its length is within the required range (between 1000 and 10000 characters).
3. **Database Interaction:**  
   - Insert a record into the `flashcards_ai_generation` table with:
     - `user_id` (extracted from the authenticated user)
     - `request_time` (current timestamp)
     - Other fields (e.g., `response_time`, `token_count`, `generated_flashcards_count`) may be left as null or default to be updated during asynchronous processing.
4. **Asynchronous Task Trigger:**  
   - Initiate an asynchronous process/job to perform AI flashcards generation which will later update the record with AI processing results.
5. **Response:**  
   - Return a 202 Accepted response including the generation ID and a status of "processing".

## 6. Security Considerations
- **Authentication & Authorization:**  
  - Verify the JWT token provided in the `Authorization` header.
- **Input Sanitization & Validation:**  
  - Ensure that the `input_text` does not include any malicious content, and strictly enforce length constraints.
- **Database Safety:**  
  - Use parameterized queries or an ORM/Query Builder to prevent SQL injection.
- **Rate Limiting:**  
  - Consider implementing rate limiting to avoid abuse of the endpoint.
- **Error Logging:**  
  - Log error details (without exposing sensitive information) for debugging and auditing purposes.

## 7. Error Handling
- **Invalid Input:** If `input_text` is missing or its length falls outside the allowed range, immediately return a 400 Bad Request with an informative error message.
- **Authentication Failures:** Return a 401 Unauthorized error if the user is not authenticated.
- **Database/Server Errors:** Catch any unexpected errors (e.g., failure to insert into the database) and return a 500 Internal Server Error. Ensure errors are logged with sufficient detail to diagnose issues (e.g., using a logging service or writing to an error log file).

## 8. Performance Considerations
- **Asynchronous Processing:**  
  - Offload the AI generation process to a background job to ensure fast API response.
- **Database Indexes:**  
  - Ensure that the `flashcards_ai_generation` table has appropriate indexes (e.g., on `user_id`) to speed up record retrieval.
- **Scalability:**  
  - Consider queue-based systems (like Bull or similar) for managing asynchronous jobs.
- **Caching:**  
  - While real-time caching isn’t necessary for this request, consider temporary caching of statuses if it becomes a performance bottleneck.

## 9. Implementation Steps
1. **Endpoint Skeleton:**
   - Create a new API route file (or update an existing one) at the appropriate path (e.g., `src/pages/api/flashcards/ai-generation.ts` if following file-based routing for Astro).
2. **Authentication Middleware:**
   - Ensure the endpoint uses authentication middleware or manually validates the JWT token in the request header.
3. **Input Validation:**
   - Validate the presence of `input_text` and check that its length is between 1000 and 10000 characters.
   - Return a 400 error with a clear message if validation fails.
4. **Database Insertion:**
   - Use the Supabase client (imported from `src/db/supabase.client.ts`) to insert a new row into the `flashcards_ai_generation` table.
   - Record the `user_id` (from the token), `request_time` (current timestamp), and leave other fields to be updated asynchronously.
5. **Asynchronous Task Trigger:**
   - Call a service function (e.g., `initiateAIGenerationService`) extracted in a new file under `src/lib/services/` to handle work dispatching for asynchronous AI processing.
6. **Response Assembly:**
   - Format the response using the `AIGenerationResponseDTO` to return a 202 status with the new generation ID and status "processing".
7. **Error Handling & Logging:**
   - Implement try/catch around the entire processing block.
   - Log relevant errors to the error logs (could integrate with a logging service or write to an error log file).
   - Ensure proper error responses with error codes 400, 401, or 500 as required.
8. **Testing:**
   - Write unit and integration tests to ensure that input validation, error handling, and asynchronous job initiation work as expected.
   - Test edge cases, such as boundary conditions for input text length.
9. **Documentation:**
   - Update API documentation (and `.ai/api-plan.md` if necessary) to reflect any implementation-specific details.
   - Share this plan with the team, ensuring clarity on error cases, validations, and asynchronous processing work.
