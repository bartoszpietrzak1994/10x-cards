import type { APIRoute } from "astro";
import { supabaseServiceClient, createServiceClient } from "../../../db/supabase.client";

export const prerender = false;

/**
 * Cloudflare Pages runtime environment interface
 */
interface CloudflareEnv {
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

/**
 * GET /api/debug/env-check
 * Returns comprehensive environment diagnostics
 * 
 * ⚠️ SECURITY: Remove or secure this endpoint before production!
 */
export const GET: APIRoute = async ({ locals }) => {
  // @ts-ignore - Cloudflare-specific runtime property
  const env = (locals.runtime?.env as CloudflareEnv) || {};
  
  // Access keys from runtime (Cloudflare) and import.meta.env (local dev)
  const runtimeServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const importMetaServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const finalServiceKey = runtimeServiceKey || importMetaServiceKey;
  
  const runtimeOpenRouterKey = env.OPENROUTER_API_KEY;
  const importMetaOpenRouterKey = import.meta.env.OPENROUTER_API_KEY;
  const finalOpenRouterKey = runtimeOpenRouterKey || importMetaOpenRouterKey;

  // Test creating service client with runtime key
  let canCreateServiceClient = false;
  let serviceClientError = null;
  if (finalServiceKey) {
    try {
      createServiceClient(finalServiceKey);
      canCreateServiceClient = true;
    } catch (error) {
      serviceClientError = error instanceof Error ? error.message : "Unknown error";
    }
  }

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
      
      // Secret variables - compare runtime vs import.meta.env
      supabaseServiceRoleKey: {
        fromRuntime: {
          exists: !!runtimeServiceKey,
          length: runtimeServiceKey?.length || 0,
          prefix: runtimeServiceKey?.substring(0, 10) || "NOT_SET",
        },
        fromImportMeta: {
          exists: !!importMetaServiceKey,
          length: importMetaServiceKey?.length || 0,
          prefix: importMetaServiceKey?.substring(0, 10) || "NOT_SET",
        },
        final: {
          exists: !!finalServiceKey,
          length: finalServiceKey?.length || 0,
          source: runtimeServiceKey ? "runtime" : importMetaServiceKey ? "import.meta" : "none",
        }
      },
      openrouterApiKey: {
        fromRuntime: {
          exists: !!runtimeOpenRouterKey,
          length: runtimeOpenRouterKey?.length || 0,
          prefix: runtimeOpenRouterKey?.substring(0, 10) || "NOT_SET",
        },
        fromImportMeta: {
          exists: !!importMetaOpenRouterKey,
          length: importMetaOpenRouterKey?.length || 0,
          prefix: importMetaOpenRouterKey?.substring(0, 10) || "NOT_SET",
        },
        final: {
          exists: !!finalOpenRouterKey,
          length: finalOpenRouterKey?.length || 0,
          source: runtimeOpenRouterKey ? "runtime" : importMetaOpenRouterKey ? "import.meta" : "none",
        }
      },
    },
    
    // Service client check
    services: {
      moduleLevel: {
        supabaseServiceClient: {
          exists: !!supabaseServiceClient,
          type: supabaseServiceClient ? typeof supabaseServiceClient : "null",
        },
      },
      runtime: {
        canCreateServiceClient,
        error: serviceClientError,
      }
    },
    
    // Runtime check
    runtime: {
      // @ts-ignore - Cloudflare-specific
      hasCloudflareRuntime: !!locals.runtime,
      // @ts-ignore - Cloudflare-specific
      hasCloudflareEnv: !!env || !!locals.runtime?.env,
      runtimeEnvKeys: env ? Object.keys(env) : [],
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

