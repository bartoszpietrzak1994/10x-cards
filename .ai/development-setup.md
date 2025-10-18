# Development Setup for AI Generation Endpoint

## Prerequisites

1. **Supabase Account & Project**
   - Create a Supabase account at https://supabase.com
   - Create a new project
   - Note down your project URL and anon key

2. **Environment Variables**
   - Copy `.env.example` to `.env` (if exists) or create `.env`
   - Add the following variables:
     ```
     SUPABASE_URL=your-project-url
     SUPABASE_KEY=your-anon-key
     OPENROUTER_API_KEY=your-openrouter-key (for future AI integration)
     ```

## Database Setup

### Step 1: Run Migrations

Apply the database schema using Supabase CLI:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

Alternatively, you can run the migration SQL directly in the Supabase dashboard:
1. Go to SQL Editor in your Supabase dashboard
2. Copy the content of `supabase/migrations/20251016120000_initial_schema.sql`
3. Run it

### Step 2: Create Test User

Since authentication is not yet implemented, you need to create a test user manually:

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Users**
3. Click "Add User"
4. Enter an email (e.g., `test@example.com`)
5. Set a password
6. Click "Create User"
7. **Important:** Copy the user's UUID from the list

#### Option B: Using SQL

Run this in the SQL Editor:

```sql
-- First, insert a role if not exists
INSERT INTO roles (name) VALUES ('user')
ON CONFLICT (name) DO NOTHING;

-- Create an auth user (this will generate a UUID)
-- Note: You need to do this through Supabase Auth UI or API
-- Then link it to your users table:
INSERT INTO users (id, email, role_id)
VALUES (
  'your-auth-user-uuid-here',  -- Replace with actual UUID from auth.users
  'test@example.com',
  (SELECT id FROM roles WHERE name = 'user')
);
```

### Step 3: Note Your User UUID

You'll need this UUID for testing the API. It should look like:
```
550e8400-e29b-41d4-a716-446655440000
```

## Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **The application will be available at:**
   ```
   http://localhost:4321
   ```

## Testing the AI Generation Endpoint

### Using HTTP Client (VS Code REST Client, etc.)

1. Open the file `.ai/api-test-examples.http`
2. Update the `@userId` variable with your test user UUID
3. Send requests directly from the file (if using REST Client extension)

### Using cURL

```bash
curl -X POST http://localhost:4321/api/flashcards/ai-generation \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-uuid-here",
    "input_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit... (at least 1000 characters)"
  }'
```

### Expected Response (202 Accepted)

```json
{
  "message": "AI generation initiated",
  "generation_id": 1,
  "status": "processing"
}
```

### Error Responses

**400 Bad Request** - Invalid input:
```json
{
  "error": "Validation failed",
  "details": [
    "input_text: Input text must be at least 1000 characters"
  ]
}
```

**500 Internal Server Error** - Database or server error:
```json
{
  "error": "Failed to initiate AI generation",
  "details": "Database connection failed"
}
```

## Verifying the Data

After making a successful request, verify the data was inserted:

```sql
-- Check flashcards_ai_generation table
SELECT * FROM flashcards_ai_generation ORDER BY id DESC LIMIT 5;

-- Check ai_logs table
SELECT * FROM ai_logs ORDER BY id DESC LIMIT 5;
```

You should see:
- A new record in `flashcards_ai_generation` with `user_id` and `request_time`
- A new record in `ai_logs` with `input_text_hash`, `input_length`, and `request_time`
- Fields like `response_time`, `token_count`, etc. will be `NULL` (to be filled by async processing)

## Troubleshooting

### Error: "Failed to insert AI generation record"

- Check if the user UUID exists in both `auth.users` and `users` tables
- Verify database connection (check SUPABASE_URL and SUPABASE_KEY)
- Check Supabase logs in the dashboard

### Error: "Invalid JSON in request body"

- Ensure your JSON is properly formatted
- Check that content-type header is set to `application/json`

### Error: "Validation failed"

- Verify input_text is between 1000-10000 characters
- Ensure user_id is a valid UUID format

## Next Steps

Once the endpoint is working:

1. Implement actual AI generation logic in `src/lib/services/aiGenerationService.ts`
2. Add queue system for background processing (e.g., Bull, BullMQ)
3. Integrate with OpenRouter or OpenAI API
4. Implement proper authentication (JWT tokens)
5. Add rate limiting
6. Create status check endpoint for polling generation results

