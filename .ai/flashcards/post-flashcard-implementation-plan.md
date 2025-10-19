# API Endpoint Implementation Plan: Create a Manual Flashcard

## 1. Endpoint Overview
This endpoint is responsible for creating a manual flashcard. It accepts the card content (front and back text) along with a fixed flashcard type ('manual') and inserts a new flashcard record into the database. This endpoint is used by authenticated users to add new manual flashcards.

## 2. Request Details
- HTTP Method: POST
- URL Structure: /flashcards
- Parameters:
  - Required (in Request Body):
    - front (string): The question text (max 200 characters).
    - back (string): The answer text (max 500 characters).
    - flashcard_type (string): Must be "manual".
  - Optional: None
- Request Body Structure:
  ```json
  {
    "front": "Question text (max 200 characters)",
    "back": "Answer text (max 500 characters)",
    "flashcard_type": "manual"
  }
  ```

## 3. Used Types
- DTOs / Command Models:
  - CreateManualFlashcardCommand (from types.ts): Contains `front`, `back` and a fixed `flashcard_type` of "manual".
  - FlashcardDTO (for the successful response payload).

## 4. Response Details
- Success Response (201 Created):
  ```json
  {
    "message": "Flashcard created successfully",
    "flashcard": {
      "id": <number>,
      "user_id": "<user-uuid>",
      "front": "...",
      "back": "...",
      "flashcard_type": "manual",
      "created_at": "timestamp"
    }
  }
  ```
- Error Response Statuses:
  - 400: Bad Request for input validation errors (e.g. missing fields, text lengths exceeded).
  - 401: Unauthorized if the user is not authenticated.
  - 500: Internal Server Error for unexpected issues.

## 5. Data Flow
1. The client sends a POST request to `/flashcards` with the required JSON body.
2. The server (API endpoint) first authenticates the user and retrieves the user context.
3. Input validation is performed:
   - Verify the presence and type of `front` and `back` fields.
   - Ensure `front` does not exceed 200 characters and `back` does not exceed 500 characters.
   - Confirm that `flashcard_type` equals "manual".
4. Validated data is passed to a service function (e.g., `createFlashcardService`) in `src/lib/services` that handles business logic and interacts with the database.
5. The service function inserts the new flashcard record into the `flashcards` table.
6. The API endpoint returns a 201 response with the newly created flashcard data.

## 6. Security Considerations
- Authentication: Ensure the endpoint is protected and the user is authenticated (e.g., using JWT and middleware).
- Authorization: Validate that the flashcard is created only for the authenticated user (using the user's ID from the session).
- Input Sanitization: Validate and sanitize input to avoid SQL injection and other common attacks.
- Data Validation: Enforce text length constraints and acceptable values (i.e., flashcard_type must be "manual").

## 7. Error Handling
- Input Validation Errors (400): Return detailed messages indicating which field failed validation.
- Unauthorized Access (401): Return when the user is not authenticated.
- Database and Server Errors (500): Catch exceptions and log errors, returning a generic error message to the client while logging detailed information to the server logs.
- Use early return patterns to simplify flow and reduce nesting.

## 8. Performance Considerations
- Use indexes on user_id to speed up insertion lookups if necessary.
- The flashcards table indexing strategy is already in place (see db-plan for indexes).
- Ensure that the service function performs minimal synchronous processing, offloading heavy tasks if needed.

## 9. Implementation Steps
1. **Route Setup**: Create a new API route in `src/pages/api/flashcards/` (if not already present) for handling POST requests.
2. **Authentication Middleware**: Ensure the API endpoint uses middleware to verify the authorization header and set the authenticated user in the request context.
3. **Input Parsing and Validation**:
   - Parse the JSON request body.
   - Validate `front`, `back` lengths and ensure `flashcard_type` equals "manual".
   - Reject requests with a 400 status code if validation fails.
4. **Service Layer**:
   - Create or update a service function (e.g., `createFlashcardService`) in `src/lib/services` to encapsulate business logic and database interaction.
   - The service should construct a flashcard record using the user’s ID from the context.
5. **Database Interaction**: Use the Supabase client or database abstraction in `src/db` to insert the record into the `flashcards` table.
6. **Response Handling**: On successful creation, return a JSON response with a message and the created flashcard details, using the 201 status code.
7. **Error Logging**: For any caught exceptions, log the error details appropriately (optionally, integrate with an error logging service or use console logging) and return a 500 error code to the client.
8. **Testing**: Write unit tests and integration tests to verify:
   - Input validation works as expected.
   - Flashcard is successfully created for a valid request.
   - Proper error responses are returned for different error scenarios.
