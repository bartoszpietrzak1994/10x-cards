 # Test Examples for POST /api/flashcards

## Valid Request
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "back": "React is a JavaScript library for building user interfaces",
    "flashcard_type": "manual"
  }'
```

**Expected Response (201 Created):**
```json
{
  "message": "Flashcard created successfully",
  "flashcard": {
    "id": 1,
    "front": "What is React?",
    "back": "React is a JavaScript library for building user interfaces",
    "flashcard_type": "manual",
    "created_at": "2025-10-19T12:00:00.000Z",
    "ai_generation_id": null
  }
}
```

## Invalid Request - Missing Required Field
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "flashcard_type": "manual"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    "back: Back text is required"
  ]
}
```

## Invalid Request - Text Too Long
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React? Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "back": "React is a JavaScript library",
    "flashcard_type": "manual"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    "front: Front text must not exceed 200 characters"
  ]
}
```

## Invalid Request - Wrong Flashcard Type
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "back": "React is a JavaScript library",
    "flashcard_type": "ai-generated"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    "flashcard_type: Flashcard type must be 'manual'"
  ]
}
```

## Invalid Request - Malformed JSON
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "What is React?",
    "back": "React is a JavaScript library"
  '
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Invalid JSON in request body"
}
```

## Test with All Edge Cases

### Minimum Valid Length
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "A",
    "back": "B",
    "flashcard_type": "manual"
  }'
```

### Maximum Valid Length
```bash
curl -X POST http://localhost:4321/api/flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "front": "'"$(printf 'A%.0s' {1..200})"'",
    "back": "'"$(printf 'B%.0s' {1..500})"'",
    "flashcard_type": "manual"
  }'
```

## Notes for Testing

1. **Prerequisites:**
   - Ensure the development server is running: `npm run dev`
   - Ensure Supabase is configured with proper environment variables
   - Database should have the `flashcards` table created

2. **Test Checklist:**
   - [ ] Valid request creates flashcard successfully (201)
   - [ ] Missing field returns validation error (400)
   - [ ] Text exceeding max length returns validation error (400)
   - [ ] Wrong flashcard type returns validation error (400)
   - [ ] Malformed JSON returns parse error (400)
   - [ ] Database errors are caught and return 500
   - [ ] Created flashcard has all expected fields
   - [ ] `ai_generation_id` is null for manual flashcards
   - [ ] Flashcard is associated with correct user_id

3. **Database Verification:**
   After successful creation, verify in database:
   ```sql
   SELECT * FROM flashcards ORDER BY created_at DESC LIMIT 1;
   ```

