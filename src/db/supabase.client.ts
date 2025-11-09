import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

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
 * Service role client for server-side operations that bypass RLS.
 * Use this for trusted server-side operations like AI generation.
 * Currently uses the same key as anon client - for production, use separate SUPABASE_SERVICE_KEY.
 */
export const supabaseServiceClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type SupabaseClient = SupabaseClientBase<Database>;
