import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: PUBLIC_SUPABASE_ANON_KEY");
}

/**
 * Client for users (with RLS).
 * This client is configured for SSR - session management handled by middleware.
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // Managed by middleware
    persistSession: false, // No localStorage
    detectSessionInUrl: false, // No URL session detection
  },
});

/**
 * Service role client that bypasses RLS.
 * ONLY use for trusted server-side operations (e.g., background jobs).
 * NEVER expose this client to the frontend or use it for user-initiated requests.
 * 
 * NOTE: In Cloudflare Pages, this will be null at module load time because
 * non-PUBLIC environment variables aren't available via import.meta.env.
 * Use createServiceClient() with runtime env instead.
 */
export const supabaseServiceClient =
  supabaseServiceKey
    ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

/**
 * Creates a Supabase service role client with the provided service key.
 * Use this in Cloudflare Pages/Workers where environment variables must be accessed at runtime.
 * 
 * @param serviceRoleKey - The Supabase service role key from runtime environment
 * @returns Configured Supabase client with service role access
 * @throws Error if required parameters are missing
 */
export function createServiceClient(serviceRoleKey: string): SupabaseClient<Database> {
  if (!serviceRoleKey) {
    throw new Error("Service role key is required");
  }

  if (!supabaseUrl) {
    throw new Error("Supabase URL is not configured");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type SupabaseClient = SupabaseClientBase<Database>;
