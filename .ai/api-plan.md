# REST API Plan

## 1. Resources
- **Roles**: Corresponds to the `roles` table.
- **Users**: Corresponds to the `users` table.
- **Flashcards AI Generation**: Corresponds to the `flashcards_ai_generation` table; used for logging and linking AI generation requests.
- **Flashcards**: Corresponds to the `flashcards` table; stores both manually created and AI-generated flashcards.
- **AI Logs**: Corresponds to the `ai_logs` table; stores detailed logs for AI interactions.

## 2. Endpoints

### Authentication Endpoints
1. **Register User**
   - **HTTP Method**: POST
   - **URL Path**: `/auth/register`
   - **Description**: Register a new user account.
   - **JSON Request Payload**:
     ```json
     {
       "email": "user@example.com",
       "password": "securePassword",
       "additionalData": { "role": "user" }  // Optional; defaults to standard user role if omitted.
     }
     ```
   - **JSON Response Payload**:
     ```json
     {
       "message": "Registration successful",
       "user": {
         "id": "uuid",
         "email": "user@example.com",
         "role": "user"
       },
       "token": "jwt-token"
     }
     ```
   - **Success Codes**: 201 Created
   - **Error Codes**:
     - 400 Bad Request (invalid payload)
     - 409 Conflict (email already exists)
     
2. **Login User**
   - **HTTP Method**: POST
   - **URL Path**: `/auth/login`
   - **Description**: Authenticate a user and return an authentication token.
   - **JSON Request Payload**:
     ```json
     {
       "email": "user@example.com",
       "password": "securePassword"
     }
     ```
   - **JSON Response Payload**:
     ```json
     {
       "message": "Login successful",
       "user": {
         "id": "uuid",
         "email": "user@example.com",
         "role": "user"
       },
       "token": "jwt-token"
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**:
     - 400 Bad Request
     - 401 Unauthorized

### Flashcards Endpoints

#### Manual Flashcards
1. **Create a Manual Flashcard**
   - **HTTP Method**: POST
   - **URL Path**: `/flashcards`
   - **Description**: Create a new manual flashcard.
   - **JSON Request Payload**:
     ```json
     {
       "front": "Question text (max 200 characters)",
       "back": "Answer text (max 500 characters)",
       "flashcard_type": "manual"
     }
     ```
   - **JSON Response Payload**:
     ```json
     {
       "message": "Flashcard created successfully",
       "flashcard": {
         "id": 123,
         "user_id": "uuid",
         "front": "Question text...",
         "back": "Answer text...",
         "flashcard_type": "manual",
         "created_at": "timestamp"
       }
     }
     ```
   - **Success Codes**: 201 Created
   - **Error Codes**:
     - 400 Bad Request (validation errors)
     - 401 Unauthorized
     
2. **Get List of Flashcards**
   - **HTTP Method**: GET
   - **URL Path**: `/flashcards`
   - **Description**: Retrieve a paginated list of flashcards for the authenticated user.
   - **Query Parameters**:
     - `page` (default: 1)
     - `limit` (default: 10)
     - `sortBy` (e.g., `created_at`)
     - `order` (`asc` or `desc`)
     - Optional filter by `flashcard_type`
   - **JSON Response Payload**:
     ```json
     {
       "flashcards": [
         {
           "id": 123,
           "front": "Question text...",
           "back": "Answer text...",
           "flashcard_type": "manual",
           "created_at": "timestamp"
         }
         // ... more flashcards
       ],
       "pagination": {
         "page": 1,
         "limit": 10,
         "total": 50
       }
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**:
     - 401 Unauthorized
     
3. **Get Flashcard Details**
   - **HTTP Method**: GET
   - **URL Path**: `/flashcards/{id}`
   - **Description**: Retrieve details of a specific flashcard.
   - **JSON Response Payload**:
     ```json
     {
       "flashcard": {
         "id": 123,
         "front": "Question text...",
         "back": "Answer text...",
         "flashcard_type": "manual",
         "created_at": "timestamp"
       }
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**:
     - 401 Unauthorized
     - 404 Not Found
     
4. **Update a Flashcard**
   - **HTTP Method**: PUT
   - **URL Path**: `/flashcards/{id}`
   - **Description**: Update an existing flashcard (manual or AI-edited).
   - **JSON Request Payload**:
     ```json
     {
       "front": "Updated question text (max 200 characters)",
       "back": "Updated answer text (max 500 characters)"
     }
     ```
   - **JSON Response Payload**:
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
   - **Success Codes**: 200 OK
   - **Error Codes**:
     - 400 Bad Request (validation errors)
     - 401 Unauthorized
     - 404 Not Found

5. **Delete a Flashcard**
   - **HTTP Method**: DELETE
   - **URL Path**: `/flashcards/{id}`
   - **Description**: Delete a specific flashcard.
   - **JSON Response Payload**:
     ```json
     {
       "message": "Flashcard deleted successfully"
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**:
     - 401 Unauthorized
     - 404 Not Found

#### AI-Based Flashcards Generation
1. **Initiate AI Flashcards Generation**
   - **HTTP Method**: POST
   - **URL Path**: `/flashcards/ai-generation`
   - **Description**: Submit text to the AI engine to generate flashcards. This endpoint validates input length, triggers asynchronous AI processing, logs metadata, and optionally creates flashcards.
   - **JSON Request Payload**:
     ```json
     {
       "input_text": "Long text between 1000 and 10000 characters..."
     }
     ```
   - **JSON Response Payload**:
     ```json
     {
       "message": "AI generation initiated",
       "generation_id": 456,
       "status": "processing"
     }
     ```
   - **Notes**: 
     - Validate that `input_text` length is between 1000 and 10000 characters.
     - Backend will record `request_time` and later update `response_time`, `token_count`, and `generated_flashcards_count`.
   - **Success Codes**: 202 Accepted
   - **Error Codes**:
     - 400 Bad Request (invalid input length)
     - 401 Unauthorized
     
2. **Retrieve AI Generation Status**
   - **HTTP Method**: GET
   - **URL Path**: `/flashcards/ai-generation/{generation_id}`
   - **Description**: Check status and results of an AI flashcards proposals generation request.
   - **JSON Response Payload**:
     ```json
     {
       "generation_id": 456,
       "status": "completed",  // or "processing", "failed"
       "flashcardsProposals": [
         {
           "id": 789,
           "front": "Generated question text...",
           "back": "Generated answer text...",
           "flashcard_type": "AI-generated",
           "created_at": "timestamp"
         }
       ],
       "ai_log": {
         "request_time": "timestamp",
         "response_time": "timestamp",
         "token_count": 123,
         "error_info": null
       }
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**:
     - 401 Unauthorized
     - 404 Not Found

### Roles and Users Management (For Admin if applicable)
*(These endpoints are optional and may be exposed only to admin users.)*
1. **List Users**
   - **HTTP Method**: GET
   - **URL Path**: `/users`
   - **Description**: Retrieve a list of users.
   - **Query Parameters**: Pagination (page, limit), filter by role.
   - **Success Codes**: 200 OK
   - **Error Codes**:
     - 401 Unauthorized
2. **Get User Details**
   - **HTTP Method**: GET
   - **URL Path**: `/users/{id}`
   - **Description**: Retrieve details for a specific user.
   - **Success Codes**: 200 OK
   - **Error Codes**:
     - 401 Unauthorized
     - 404 Not Found

## 3. Authentication and Authorization
- Authentication will be based on JWT tokens, ideally integrated with Supabase Auth.
- Protected endpoints require the JWT in the `Authorization` header.
- Row-Level Security (RLS) will be enforced at the database level, ensuring that users access only their own flashcards and data.
- Endpoints for registration and login are public; all other endpoints require proper authentication.
- Rate limiting and additional security measures (such as input sanitization and HTTPS enforcement) should be enforced at the API gateway or server level.

## 4. Validation and Business Logic
- **Input Validations**:
  - AI input for flashcard generation must be between 1000 and 10000 characters.
  - Flashcard “front” text must not exceed 200 characters; “back” text must not exceed 500 characters.
  - Email in user registration is validated for uniqueness.
  - Valid enum values must be provided for `flashcard_type` (allowed values: "AI-generated", "AI-edited", "manual").
- **Business Logic Implementation**:
  - For AI-based generation, the API validates the input, initiates an asynchronous task for AI processing, logs key metrics (request time, response time, token count, error messages) in the `flashcards_ai_generation` and `ai_logs` tables, and upon completion, creates flashcard records with type "AI-generated".
  - For manual flashcards, the API directly creates flashcard records using the payload provided.
  - Flashcards listing endpoints support pagination, filtering, and sorting to optimize performance and user experience.
  - Data operations follow the early return and guard clause patterns to ensure errors are handled immediately and the happy path remains clear.
