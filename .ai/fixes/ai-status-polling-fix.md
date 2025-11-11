# AI Generation Status Polling Fix

**Date**: 2025-11-11  
**Issue**: StatusBanner not refreshing to "completed" even after flashcards were generated successfully  
**Status**: ✅ Fixed

---

## Problem Analysis

### Root Cause (UPDATED)

The issue had **TWO problems**:

1. **Client-Side Polling**: React components were using an unauthenticated Supabase client to poll for generation data
2. **Server-Side Updates**: Background job was using SSR Supabase client that lost auth context after HTTP response was sent, causing RLS to block the UPDATE

### Technical Details

1. **Client-Side Supabase Client Configuration**:
   ```typescript
   // src/db/supabase.client.ts
   export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
     auth: {
       autoRefreshToken: false,
       persistSession: false,  // ❌ Cannot read cookies!
       detectSessionInUrl: false,
     },
   });
   ```

2. **Polling Flow Before Fix**:
   - React hook called `service.fetchGenerationData(generationId)`
   - Service used **client-side Supabase client** with direct queries:
     - `supabase.from("flashcards_ai_generation").select(...)`
     - `supabase.from("ai_logs").select(...)`
   - Client had **no auth context** (persistSession: false)
   - RLS policies blocked reads (required `auth.uid()`)
   - Could never see `response_time` field → status stuck on "processing"

3. **Why Server Update Succeeded**:
   - Server-side operations in `initiateAIGeneration` used authenticated Supabase client from middleware
   - That client had proper JWT token and could update records
   - But client-side polling couldn't **read** those updates

### Why This Happened

The application uses **Astro SSR** with cookie-based authentication. The client-side Supabase client is intentionally configured with `persistSession: false` because:
- Session is managed server-side via cookies
- Client should not directly store tokens
- All authenticated operations should go through API endpoints

However, the polling implementation was incorrectly using direct Supabase queries instead of API endpoints.

---

## Solution

### Changes Made

#### 1. Created Service Role Supabase Client (`src/db/supabase.client.ts`)

**Purpose**: Bypass RLS for trusted background operations

```typescript
export const supabaseServiceClient =
  supabaseServiceKey
    ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
```

**Security Note**: This client has full database access. ONLY use for server-side background jobs.

#### 2. Updated AI Generation API to Use Service Client

Modified `src/pages/api/flashcards/ai-generation.ts` to use service role client for async operations:

```typescript
initiateAIGeneration(supabaseServiceClient, generationId, input_text, userId)
```

This ensures the background job can update the `response_time` field even after the HTTP response is sent.

#### 3. Created New API Endpoint (`/api/flashcards/ai-generation/[id].ts`)

**Purpose**: Provide authenticated access to generation data

**Features**:
- Uses server-side Supabase client (from `locals.supabase`)
- Inherits authentication from cookies via middleware
- Respects RLS policies (only returns data owned by user)
- Returns comprehensive generation state:
  - Generation metadata (`flashcards_ai_generation` table)
  - AI logs (`ai_logs` table)
  - Proposals (`flashcards` table)
  - Computed status based on data

**Endpoint Behavior**:
```typescript
GET /api/flashcards/ai-generation/[id]

Response:
{
  status: "processing" | "completed" | "failed",
  generationMeta: {...},
  aiLog: {...} | null,
  proposals: [...]
}
```

**Status Determination**:
- `failed`: If `aiLog.error_info` exists
- `completed`: If `generationMeta.response_time` exists
- `processing`: Otherwise

#### 2. Updated `AIGenerationClientService`

**Before**:
```typescript
class AIGenerationClientService {
  constructor(private supabase: SupabaseClient) {}
  
  async fetchGenerationMeta(id) {
    return await this.supabase.from("flashcards_ai_generation").select(...)
  }
  
  async fetchAILog(id) {
    return await this.supabase.from("ai_logs").select(...)
  }
  
  async fetchProposals(id) {
    return await this.supabase.from("flashcards").select(...)
  }
}
```

**After**:
```typescript
class AIGenerationClientService {
  constructor() {}  // No Supabase client needed
  
  async fetchGenerationData(id) {
    const response = await fetch(`/api/flashcards/ai-generation/${id}`, {
      credentials: "same-origin"  // Include cookies
    });
    return await response.json();
  }
}
```

**Benefits**:
- Uses HTTP fetch with cookies → automatic authentication
- Single API call instead of multiple Supabase queries
- Better separation: client code doesn't need Supabase client
- Consistent with other authenticated operations

#### 3. Updated `useAIGeneration` Hook

Removed dependency on `supabaseClient`:

```typescript
// Before
const service = useMemo(() => createAIGenerationClientService(supabaseClient), []);

// After
const service = useMemo(() => createAIGenerationClientService(), []);
```

---

## How It Works Now

### Successful Flow

1. **User submits text** → POST `/api/flashcards/ai-generation`
   - Creates generation record
   - Starts async AI processing
   - Returns `generation_id` and status: "processing"

2. **Polling starts** (every 2 seconds):
   ```
   React Hook → AIGenerationClientService → GET /api/flashcards/ai-generation/[id]
                                              ↓ (with cookies)
                                           Astro Middleware
                                              ↓ (authenticates)
                                           API Handler
                                              ↓ (uses locals.supabase)
                                           Database (RLS passes)
                                              ↓
                                           Returns data ✅
   ```

3. **AI completes processing**:
   - Background job updates `response_time` in database
   - Uses server-side authenticated client

4. **Next poll cycle**:
   - API endpoint reads updated `response_time`
   - Computes status: "completed"
   - Returns to client

5. **StatusBanner updates**:
   - Receives status: "completed"
   - Shows success message ✅

### Authentication Chain

```
Browser (cookies) 
  → fetch() with credentials: "same-origin" 
  → Astro middleware reads cookies 
  → Creates authenticated Supabase client 
  → Attaches to locals.supabase 
  → API endpoint uses locals.supabase 
  → RLS policies pass ✅
```

---

## Testing Verification

### Build Status
✅ TypeScript compilation successful  
✅ No linter errors  
✅ All imports resolved correctly

### Expected Behavior

1. **Submit AI generation request**
   - StatusBanner shows "Processing" with spinner

2. **Wait for AI completion** (typically 10-30 seconds)
   - Polling happens every 2 seconds
   - No visible changes during processing

3. **AI completes successfully**
   - StatusBanner updates to "Generation Complete" with checkmark
   - Generated flashcards appear below

4. **If AI fails**
   - StatusBanner shows "Generation Failed" with error icon
   - Error message displayed

---

## Files Changed

1. **Created**:
   - `src/pages/api/flashcards/ai-generation/[id].ts` - New API endpoint for fetching generation status
   - `.ai/fixes/ai-status-polling-fix.md` - This documentation

2. **Modified**:
   - `src/db/supabase.client.ts` - Added service role client
   - `src/env.d.ts` - Added SUPABASE_SERVICE_ROLE_KEY type
   - `src/pages/api/flashcards/ai-generation.ts` - Use service client for background job
   - `src/lib/services/aiGenerationService.ts` - Added debug logging
   - `src/lib/services/aiGenerationClientService.ts` - Use API endpoint instead of direct queries, added debug logging
   - `src/components/hooks/useAIGeneration.ts` - Removed Supabase client dependency, added debug logging
   - `src/components/hooks/usePolling.ts` - Added error logging

---

## Setup Required

### Environment Variable

Add the following to your `.env` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find it:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the `service_role` key (NOT the `anon` key)
4. Add it to your `.env` file

**Security Warning:** The service role key bypasses ALL RLS policies. Never expose it to the frontend or commit it to version control.

---

## Lessons Learned

### Key Principle 1: Client-Side Authentication in Astro SSR

When using Astro with SSR and cookie-based authentication:

1. ❌ **Don't** use client-side Supabase client for authenticated queries
2. ✅ **Do** use fetch() to call authenticated API endpoints
3. ✅ **Do** set `credentials: "same-origin"` to include cookies
4. ✅ **Do** use `locals.supabase` in API endpoints (has auth context)

### Key Principle 2: Background Jobs and RLS

When running async background operations:

1. ❌ **Don't** use SSR Supabase client (`locals.supabase`) for fire-and-forget operations
   - The client is tied to the HTTP request/response cycle
   - After the response is sent, `auth.uid()` returns NULL
   - RLS policies will block all operations

2. ✅ **Do** use service role client for background operations
   - Bypasses RLS (has full database access)
   - Not tied to any request context
   - Works for async operations that run after response is sent

3. ⚠️ **Security**: NEVER expose service role client to frontend
   - Only use in server-side code
   - Only for trusted operations
   - Consider adding application-level access checks

### Why This Pattern Works

- **Cookies are automatic**: Browser sends them with fetch()
- **Middleware handles auth**: Every API request goes through authentication
- **RLS just works**: Server-side client has proper JWT tokens
- **Type safety**: API contracts defined with TypeScript DTOs
- **Consistent pattern**: Same as login, flashcards list, etc.

### When to Use Each Client

| Use Case | Client | Reason |
|----------|--------|--------|
| API endpoints (sync) | `locals.supabase` | Has auth context from cookies, respects RLS |
| Background jobs (async) | `supabaseServiceClient` | Bypasses RLS, not tied to request context |
| React components | `fetch()` to API | No direct Supabase access, uses cookies |
| Static pages | N/A | No auth needed |
| Admin operations | `supabaseServiceClient` | Full database access (use with caution) |

---

## Related Files

- Authentication spec: `.ai/auth/auth-spec.md`
- Login implementation: `.ai/auth/login-implementation-summary.md`
- Middleware: `src/middleware/index.ts`
- Supabase client config: `src/db/supabase.client.ts`

---

## Future Considerations

### Potential Optimizations

1. **WebSockets for Real-Time Updates**
   - Replace polling with Supabase Realtime subscriptions
   - Requires server-side setup or service worker

2. **Retry Logic**
   - Add exponential backoff for failed polls
   - Handle network errors gracefully

3. **Caching**
   - Cache completed generations client-side
   - Reduce unnecessary API calls

### Related Issues

None - this fix addresses the core authentication issue.

