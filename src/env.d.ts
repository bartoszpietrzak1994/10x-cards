/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";
import type { UserDTO } from "./types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user: UserDTO | null;
      // Cloudflare Pages runtime context
      runtime?: {
        env?: Record<string, string | undefined>;
        cf?: Record<string, unknown>;
        ctx?: {
          waitUntil?: (promise: Promise<unknown>) => void;
          passThroughOnException?: () => void;
        };
      };
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
