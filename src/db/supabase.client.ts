import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Service role client for server-side operations that bypass RLS
 * Use this for trusted server-side operations like AI generation
 */
export const supabaseServiceClient = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseClient; // Fallback to regular client if service key not available

export type SupabaseClient = SupabaseClientBase<Database>;

export const DEFAULT_USER_ID = "7c1c2c24-4dce-404d-96f5-8b41bee7dfdf";
