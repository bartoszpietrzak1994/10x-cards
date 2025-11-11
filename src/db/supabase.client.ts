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

export type SupabaseClient = SupabaseClientBase<Database>;
