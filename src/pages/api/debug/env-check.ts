import type { APIRoute } from "astro";
import { supabaseServiceClient } from "../../../db/supabase.client";

export const prerender = false;

/**
 * GET /api/debug/env-check
 * Returns comprehensive environment diagnostics
 * 
 * ⚠️ SECURITY: Remove or secure this endpoint before production!
 */
export const GET: APIRoute = async ({ locals }) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    
    // Authentication check
    authentication: {
      hasUser: !!locals.user,
      userId: locals.user?.id || null,
      hasSupabaseClient: !!locals.supabase,
    },
    
    // Environment variables check
    environment: {
      // Public variables (should always be set)
      publicSupabaseUrl: {
        exists: !!import.meta.env.PUBLIC_SUPABASE_URL,
        length: import.meta.env.PUBLIC_SUPABASE_URL?.length || 0,
        value: import.meta.env.PUBLIC_SUPABASE_URL 
          ? `${import.meta.env.PUBLIC_SUPABASE_URL.substring(0, 20)}...` 
          : "NOT_SET",
      },
      publicSupabaseAnonKey: {
        exists: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        length: import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        prefix: import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) || "NOT_SET",
      },
      
      // Secret variables (production only)
      supabaseServiceRoleKey: {
        exists: !!import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
        length: import.meta.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        prefix: import.meta.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || "NOT_SET",
      },
      openrouterApiKey: {
        exists: !!import.meta.env.OPENROUTER_API_KEY,
        length: import.meta.env.OPENROUTER_API_KEY?.length || 0,
        prefix: import.meta.env.OPENROUTER_API_KEY?.substring(0, 10) || "NOT_SET",
      },
    },
    
    // Service client check
    services: {
      supabaseServiceClient: {
        exists: !!supabaseServiceClient,
        type: supabaseServiceClient ? typeof supabaseServiceClient : "null",
      },
    },
    
    // Runtime check
    runtime: {
      // @ts-ignore - Cloudflare-specific
      hasCloudflareRuntime: !!locals.runtime,
      // @ts-ignore - Cloudflare-specific
      hasCloudflareEnv: !!locals.runtime?.env,
      nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'process_not_available',
    },
  };

  return new Response(
    JSON.stringify(diagnostics, null, 2),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Timestamp": new Date().toISOString(),
      },
    }
  );
};

