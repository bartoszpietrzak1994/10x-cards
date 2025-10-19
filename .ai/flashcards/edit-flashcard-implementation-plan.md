# API Endpoint Implementation Plan: Update a Flashcard

## 1. Endpoint Overview
The endpoint is responsible for updating an existing flashcard record. It accepts user input for the updated “front” and “back” text, validates the input against length restrictions, verifies that the flashcard belongs to the authenticated user, updates the record in the database, and returns the updated flashcard information.

## 2. Request Details
- **HTTP Method**: PUT
- **URL Structure**: `/flashcards/{id}`  
  Here, `{id}` is the flashcard identifier passed as a path parameter.
- **Parameters**:
  - **Path Parameter (Required)**:
    - `id`: flashcard identifier.
  - **Body (Required JSON Payload)**:
    ```json
    {
      "front": "Updated question text (max 200 characters)",
      "back": "Updated answer text (max 500 characters)"
    }
    ```
- **Input Validation**:
  - Ensure `front` does not exceed 200 characters.
  - Ensure `back` does not exceed 500 characters.
  - Validate that both fields are provided and are strings.

## 3. Used Types
- **Command Model**: `UpdateFlashcardCommand` (from `src/types.ts`)
- **Data Transfer Object (DTO)**: `FlashcardDTO` for response structure.
- **Service Layer Types**: Types used in the update service (from `src/lib/services/flashcardService.ts`, if applicable).

## 4. Response Details
- **Success Response** (HTTP 200 OK):
  - **Payload**:
    ```json
    {
      "message": "Flashcard updated successfully",
      "flashcard": {
        "id": 123,
        "front": "Updated question text...",
        "back": "Updated answer text...",
        "flashcard_type": "manual",
        "created_at": "timestamp"
      }
    }
    ```
- **Error Responses**:
  - **400 Bad Request**: When the input payload does not pass validation (e.g., missing fields, text length issues).
  - **401 Unauthorized**: If the request does not include valid authentication credentials.
  - **404 Not Found**: When no flashcard exists with the provided `id` belonging to the authenticated user.
  - **500 Internal Server Error**: For unexpected server-side issues.

## 5. Data Flow
1. **Receive Request**: The endpoint receives a PUT request at `/flashcards/{id}`.
2. **Authenticate User**: Middleware or similar mechanism validates the JWT token to determine the current user.
3. **Extract and Validate**:
   - Extract `id` from the URL.
   - Validate the request body using a schema (e.g., using Zod) to match `UpdateFlashcardCommand`.
4. **Service Layer Call**: Call the update function in the flashcard service which:
   - Checks that the flashcard exists.
   - Confirms that the flashcard belongs to the requesting user.
   - Performs the update operation in the database.
5. **Return Response**: On success, return the updated flashcard data wrapped in a JSON response with a success message.

## 6. Security Considerations
- **Authentication**: Ensure that the user is authenticated. Use JWT tokens provided in the `Authorization` header.
- **Authorization & RLS**: Leverage Supabase Row-Level Security (RLS) so that users can only update their own flashcards.
- **Input Sanitization**: Validate and sanitize inputs (especially the text fields) to prevent issues such as XSS or SQL injection.
- **Error Logging**: Log validation failures and unexpected errors appropriately, without exposing sensitive details to the client.

## 7. Error Handling
- **Validation Errors**: Return 400 Bad Request with a descriptive error message if input fails length or type validations.
- **Authentication Failures**: Return 401 Unauthorized if authentication fails.
- **Resource Not Found**: Return 404 Not Found if the flashcard does not exist or does not belong to the user.
- **Unexpected Errors**: Catch any other errors and return a 500 Internal Server Error. Record error details in an error log system if applicable.

## 8. Performance Considerations
- **Database Indexes**: Ensure that indexes on flashcard identifiers and user identifiers are in place for fast lookups.
- **Service Layer Optimization**: Use efficient queries and leverage caching if necessary for frequently updated records.
- **Minimal Payload Size**: Only return required fields in the response to minimize payload size and improve response times.

## 9. Implementation Steps
1. **Define Update Validation Schema**:
   - Create or update a Zod (or similar) schema that validates the `front` and `back` fields according to the described limits.
2. **Implement Authentication Middleware**:
   - Verify the JWT token and attach user information to the request context.
3. **Extract Path Parameter and Request Body**:
   - In the endpoint handler, extract the flashcard `id` from the URL and the body.
4. **Call Service Layer Method**:
   - Pass the user identifier, flashcard `id`, and update data (front and back) to the flashcard service update method.
   - If the flashcard does not belong to the user or is not found, throw a 404 error.
5. **Handle Service Response**:
   - On successful update, construct the response JSON with the updated flashcard data and a success message.
6. **Error Handling Logic**:
   - Add try-catch blocks to handle validation errors, authorization errors, and unexpected exceptions, and map these to the appropriate HTTP status codes.
7. **Testing**:
   - Write tests to cover successful updates, invalid payloads, unauthorized access, and non-existent flashcard scenarios.
8. **Documentation**:
   - Update API documentation to reflect the new endpoint behavior, expected input/output, and error codes.
9. **Logging**:
   - Ensure that any error or unexpected behavior is logged with sufficient context (keeping user data secure).
